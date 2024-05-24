import zod from 'zod';

import TOKENS from '~/assets/tokens';
import { getResizedImage } from '~/helpers/misc.helpers';
import { prismaClient } from '~/lib/prisma';
import { router } from '~/lib/trpc';
import { publicProcedure } from '~/middlewares/access.middlewares';

const list = publicProcedure
  .input(
    zod
      .object({
        top: zod.number().int().min(0).max(100).default(10).nullable(),
        skip: zod.number().int().min(0).default(0).nullable(),
        collection: zod.string().nullable().nullish(),
      })
      .strict(),
  )
  .query(async ({ input: { collection, top, skip } }) => {
    const query = collection ? { colId: collection } : {};
    return (
      await prismaClient.asset.findMany({
        where: query,
        take: top!,
        skip: skip!,
        orderBy: {
          updatedAt: 'desc',
        },
      })
    ).map((item) => ({ ...item, image: getResizedImage(item.image) }));
  });

const tokens = publicProcedure.query(() => TOKENS);
const collections = publicProcedure.query(() => prismaClient.assetCollection.findMany());

export default router({ list, tokens, collections });
