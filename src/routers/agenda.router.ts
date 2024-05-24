import { UserRole } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import debug from 'debug';
import zod from 'zod';

import { getJob } from '~/lib/agenda';
import { router } from '~/lib/trpc';
import { publicProcedure } from '~/middlewares/access.middlewares';

const log = debug('app:router:agenda');

const run = publicProcedure
  .meta({ allowed: [UserRole.ADMIN] })
  .input(
    zod
      .object({
        name: zod.enum(['nfts:fetch']),
      })
      .strict(),
  )
  .mutation(async ({ input: { name } }) => {
    const job = await getJob(name);
    if (!job) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Job not found',
      });
    }

    log(`Request running the job ${name}`);
    job.run();
    return true;
  });

export default router({ run });
