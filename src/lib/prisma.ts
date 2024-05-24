import { PrismaClient } from '@prisma/client';

export const prismaClient = new PrismaClient();

(async () => {
  await prismaClient.$runCommandRaw({
    createIndexes: 'codes',
    indexes: [
      {
        key: { createdAt: 1 },
        name: 'created_at_index',
        expireAfterSeconds: 2 * 3600,
      },
    ],
  });
  await prismaClient.$runCommandRaw({
    createIndexes: 'users',
    indexes: [
      {
        key: { eos_pu_id: 1 },
        name: 'eos_pu_id_index',
        sparse: true,
      },
      {
        key: { wallet_address: 1 },
        name: 'wallet_address_index',
        sparse: true,
      },
    ],
  });
})();
