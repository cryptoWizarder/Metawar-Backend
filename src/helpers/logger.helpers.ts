import { LogType, Prisma } from '@prisma/client';
import { getClientIp } from 'request-ip';

import { prismaClient } from '~/lib/prisma';

type TMeta = Prisma.InputJsonObject;

export default function logger(scope: string) {
  const log = ({
    type,
    message,
    ctx,
    meta = {},
    level = 0,
  }: {
    type: LogType;
    message: string;
    ctx?: TContext;
    meta?: TMeta;
    level?: number;
  }) =>
    prismaClient.log
      .create({
        data: {
          uid: ctx?.user?.id,
          sid: ctx?.session?.id,
          scope,
          type,
          message,
          level,
          meta: {
            ...meta,
            ua: ctx?.req?.headers?.['user-agent'],
            ip: ctx?.req ? getClientIp(ctx?.req) : '0.0.0.0',
          },
        },
      })
      .catch(() => {
        // Do nothing
      });

  return {
    async info(message: string, ctx?: TContext, level?: number, meta?: TMeta) {
      return log({ type: LogType.INFO, message, ctx, meta, level });
    },
    async error(message: string, ctx?: TContext, level?: number, meta?: TMeta) {
      return log({ type: LogType.ERROR, message, ctx, meta, level });
    },
    async warn(message: string, ctx?: TContext, level?: number, meta?: TMeta) {
      return log({ type: LogType.WARNING, message, ctx, meta, level });
    },
  };
}
