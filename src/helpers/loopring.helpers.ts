import { Prisma } from '@prisma/client';
import config from '~/config';
import { fetch } from '~/lib/fetch';
import { prismaClient } from '~/lib/prisma';

const { url, apiKey } = config.loopring;

type GetBalanceResponse = {
  totalNum: number;
  data: unknown[];
};

export async function getBalance(address: string): Promise<GetBalanceResponse> {
  const nfts = await prismaClient.nFT.findMany({
    where: {
      active: true,
    },
    select: {
      nftData: true,
      tokenAddress: true,
    },
  });

  if (nfts.length === 0) {
    throw new Error('No NFTs found');
  }

  const nftDatas: string[] = [];
  const tokenAddrs: string[] = [];

  nfts.forEach(({ nftData, tokenAddress }) => {
    if (nftData && !nftDatas.includes(nftData)) {
      nftDatas.push(nftData);
    }

    if (tokenAddress && !tokenAddrs.includes(tokenAddress)) {
      tokenAddrs.push(tokenAddress);
    }
  });

  const { data, status } = await fetch<{ accountId: string }>(
    `${url}/api/v3/account?owner=${encodeURIComponent(address)}`,
  );

  if (status !== 200) {
    throw new Error('Error while fetching Loopring account ID');
  }

  const { status: status2, data: data2 } = await fetch<GetBalanceResponse>(
    `${url}/api/v3/user/nft/balances?accountId=${encodeURIComponent(
      data.accountId,
    )}&nftDatas=${nftDatas.join(',')}&tokenAddrs=${tokenAddrs.join(',')}`,
    {
      headers: {
        'X-API-KEY': apiKey,
      },
    },
  );

  if (status2 !== 200) {
    throw new Error('Error while fetching Loopring account ID');
  }

  return data2;
}

export async function updateNFTs() {
  const filter: Prisma.NFTWhereInput = {
    active: true,
    nftId: {
      isSet: true,
      not: '',
    },
    minter: {
      isSet: true,
      not: '',
    },
    tokenAddress: {
      not: '',
    },
  };
  const items = await prismaClient.nFT.findMany({
    where: {
      OR: [
        {
          ...filter,
          nftData: {
            isSet: false,
          },
        },
        {
          ...filter,
          nftData: {
            equals: '',
          },
        },
      ],
    },
  });

  if (items.length === 0) {
    return true;
  }

  const results = await Promise.all(
    items.map(({ nftId, tokenAddress, minter }) =>
      fetch<{
        nftId: string;
        nftData: string;
        minter: string;
        tokenAddress: string;
      }>(
        `${url}/api/v3/nft/info/nftData?nftId=${nftId}&tokenAddress=${tokenAddress}&minter=${minter}`,
        {
          headers: {
            'X-API-KEY': apiKey,
          },
        },
      ),
    ),
  );

  await Promise.all(
    results
      .map(({ status, data }) => {
        if (status === 200) {
          const found = items.find(
            ({ nftId, tokenAddress, minter }) =>
              nftId?.toLowerCase() === data.nftId.toLowerCase() &&
              tokenAddress.toLowerCase() === data.tokenAddress.toLowerCase() &&
              minter?.toLowerCase() === data.minter.toLowerCase(),
          );
          return prismaClient.nFT.update({
            where: {
              id: found?.id,
            },
            data: {
              nftData: data.nftData,
            },
          });
        }
      })
      .filter(Boolean),
  );

  return true;
}
