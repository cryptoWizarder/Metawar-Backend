import { UserRole } from '@prisma/client';
import { initTRPC } from '@trpc/server';

import { Context } from './context';

const t = initTRPC
  .meta<{
    allowed?: UserRole[];
  }>()
  .context<Context>()
  .create({
    errorFormatter({
      shape: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        data: { stack, ...data },
        ...shape
      },
      error,
    }) {
      console.error(shape, error);
      return { ...shape, data };
    },
  });

export const { middleware, router, procedure } = t;
