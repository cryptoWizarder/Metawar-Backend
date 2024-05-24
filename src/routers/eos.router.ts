import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getPlayerFromEOSToken } from '~/helpers/eos.helpres';
import { signSession } from '~/helpers/jwt.helpers';
import Logger from '~/helpers/logger.helpers';
import { prismaClient } from '~/lib/prisma';
import { getPublicSession } from '~/lib/session';

import { router } from '~/lib/trpc';
import { protectedProcedure, publicProcedure } from '~/middlewares/access.middlewares';

const logger = Logger('eos');

const login = publicProcedure
  .input(
    z
      .object({
        token: z.string().min(10),
      })
      .strict(),
  )
  .mutation(async ({ input: { token }, ctx }) => {
    const EOSPlayerId = await getPlayerFromEOSToken(token);

    if (!EOSPlayerId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const user = await prismaClient.user.findFirst({
      where: { eos_pu_id: EOSPlayerId },
    });

    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Player not found' });

    const jwt = await signSession(user.id, ctx);

    const account = getPublicSession(user);

    return {
      ...account,
      token: jwt,
    };
  });

const link = protectedProcedure
  .input(
    z
      .object({
        token: z.string().min(10),
      })
      .strict(),
  )
  .mutation(async ({ ctx, input: { token } }) => {
    const EOSPlayerId = await getPlayerFromEOSToken(token);

    if (!EOSPlayerId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    await prismaClient.user.update({
      where: { id: ctx.user.id },
      data: { eos_pu_id: EOSPlayerId },
    });

    logger.info('Linked EOS account', ctx);

    return true;
  });

const unlink = protectedProcedure.mutation(async ({ ctx }) => {
  await prismaClient.user.update({
    where: { id: ctx.user.id },
    data: { eos_pu_id: null },
  });

  logger.info('Unlinked EOS account', ctx);

  return true;
});

export default router({
  link,
  login,
  unlink,
});
