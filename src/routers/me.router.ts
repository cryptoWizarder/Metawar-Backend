import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import Logger from '~/helpers/logger.helpers';
import { getBalance, updateNFTs } from '~/helpers/loopring.helpers';
import { compareHashedValue, getHashedValue } from '~/helpers/user.helpers';
import { notify } from '~/lib/mailer';
import { prismaClient } from '~/lib/prisma';

import { getPublicSession } from '~/lib/session';
import { router } from '~/lib/trpc';
import { protectedProcedure, publicProcedure } from '~/middlewares/access.middlewares';

const logger = Logger('auth');

const get = publicProcedure.query(async ({ ctx: { user, session } }) =>
  user
    ? {
        ...getPublicSession(user),
        sid: session?.id,
      }
    : null,
);

const sessions = protectedProcedure.query(
  async ({ ctx: { user } }) =>
    await prismaClient.session.findMany({
      where: {
        uid: user!.id,
      },
    }),
);

const disconnect = protectedProcedure
  .input(
    z
      .object({
        sid: z.string().optional(),
      })
      .strict(),
  )
  .mutation(async ({ ctx, input: { sid } }) => {
    const { user, session } = ctx;
    const query: Prisma.SessionWhereInput = {
      uid: user.id,
    };

    if (sid && sid === session?.id) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You cannot disconnect your own session',
      });
    }

    query.id = sid;

    logger.info('Disconnected the session', ctx, 0, {
      uid: user.id,
      sid,
    });

    await prismaClient.session.deleteMany({
      where: query,
    });

    return true;
  });

const update = protectedProcedure
  .input(
    z
      .object({
        firstname: z.string(),
        lastname: z.string(),
      })
      .strict(),
  )
  .mutation(async ({ input: { firstname, lastname }, ctx }) => {
    await prismaClient.user.update({
      where: {
        id: ctx.user.id,
      },
      data: {
        firstname,
        lastname,
      },
    });

    logger.info('User updated', ctx, 0, {
      firstname,
      lastname,
    });

    return true;
  });

const balance = protectedProcedure.mutation(async ({ ctx }) => {
  if (!ctx.user.wallet_address) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Wallet address not connected',
    });
  }

  try {
    await updateNFTs();
  } catch (error) {
    logger.error('Error updating NFTs', ctx, 0, {
      error: (error as Error).message,
    });
  }

  try {
    return await getBalance(ctx.user.wallet_address);
  } catch (error) {
    logger.error('Error getting balance', ctx, 0, {
      error: (error as Error).message,
    });
  }
});

const disconnectWallet = protectedProcedure.mutation(async ({ ctx }) => {
  if (!ctx.user.wallet_address) {
    return true;
  }

  await prismaClient.user.update({
    where: {
      id: ctx.user.id,
    },
    data: {
      wallet_address: null,
    },
  });

  logger.info('Wallet disconnected', ctx);
  return true;
});

const changePassword = protectedProcedure
  .input(
    z
      .object({
        oldPassword: z.string().min(6),
        newPassword: z.string().min(6),
        disconnect: z.boolean().optional().default(true),
      })
      .strict(),
  )
  .mutation(async ({ ctx, input: { oldPassword, newPassword, disconnect } }) => {
    if (!(await compareHashedValue(oldPassword, ctx.user.password))) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Old password is incorrect',
      });
    }

    if (await compareHashedValue(newPassword, ctx.user.password)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'New password cannot be the same as the old one',
      });
    }

    await prismaClient.user.update({
      where: {
        id: ctx.user.id,
      },
      data: {
        password: await getHashedValue(newPassword),
      },
    });

    if (disconnect) {
      await prismaClient.session.deleteMany({
        where: {
          AND: [{ uid: ctx.user.id }, { id: { not: ctx.session?.id } }],
        },
      });
    }

    notify({
      to: ctx.user.email,
      subject: 'Password changed',
      view: 'change-password-success.view.njk',
      data: {},
    });

    logger.info('Password changed', ctx);

    return true;
  });

export default router({
  get,
  update,
  balance,
  sessions,
  disconnect,
  changePassword,
  disconnectWallet,
});
