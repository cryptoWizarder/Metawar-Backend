import { TRPCError } from '@trpc/server';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { hashMessage, recoverAddress } from 'ethers';

import config from '~/config';
import { env } from '~/lib/nunjucks';
import { prismaClient } from '~/lib/prisma';
import { router } from '~/lib/trpc';
import { protectedProcedure } from '~/middlewares/access.middlewares';
import Logger from '~/helpers/logger.helpers';

const { nonce: nonceConf, publicUrl, appName } = config;
const url = new URL(publicUrl);
const logger = Logger('nonce');

const generate = protectedProcedure
  .input(
    z
      .object({
        wallet: z.string().min(10),
        provider: z.enum(['metamask', 'gamestop', 'other']).optional().default('metamask'),
        network: z.string().optional(),
      })
      .strict(),
  )
  .mutation(async ({ ctx, input }) => {
    const random = randomBytes(16).toString('base64url');
    const createdAt = new Date();
    const message = env.render('nonce.view.njk', {
      user: ctx.user,
      ...input,
      nonce: random,
      appName,
      publicUrl,
      createdAt,
      expiresAt: new Date(createdAt.getTime() + nonceConf.ttl),
      tos: nonceConf.tos,
      domain: url.host,
    });

    const record = await prismaClient.nonce.create({
      data: {
        nonce: random,
        uid: ctx.user.id,
        message,
        desc: `wallet: ${input.wallet}`,
      },
    });

    return {
      id: record.id,
      nonce: message,
    };
  });

const validate = protectedProcedure
  .input(
    z
      .object({
        signature: z.string(),
        id: z.string(),
      })
      .strict(),
  )
  .mutation(async ({ ctx, input: { id, signature } }) => {
    const nonce = await prismaClient.nonce.findUnique({
      where: {
        id,
      },
    });

    if (!nonce) throw new TRPCError({ code: 'NOT_FOUND', message: 'Nonce not found' });

    if (nonce.uid !== ctx.user.id)
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized' });

    let wallet: string;

    try {
      wallet = recoverAddress(hashMessage(nonce.message), signature);
    } catch (e) {
      logger.error('Cannot recover wallet address', ctx, 0, {
        message: (e as Error).message,
      });
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid signature' });
    }

    const found = await prismaClient.user.findFirst({
      where: {
        id: {
          not: ctx.user.id,
        },
        wallet_address: wallet,
      },
    });

    if (found) {
      logger.error(`Trying to connect an already connected wallet: '${wallet}'`, ctx);
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot connect wallet. Please disconnect it from other accounts.',
      });
    }

    try {
      await prismaClient.$transaction([
        prismaClient.user.update({
          where: {
            id: ctx.user.id,
          },
          data: {
            wallet_address: wallet,
          },
        }),
        prismaClient.nonce.delete({
          where: {
            id,
          },
        }),
      ]);
    } catch (e) {
      logger.error('Cannot connect wallet', ctx, 0, {
        wallet,
      });
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot connect wallet. Please disconnect it from other accounts.',
      });
    }

    return true;
  });

export default router({
  generate,
  validate,
});
