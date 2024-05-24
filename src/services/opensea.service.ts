import { Asset as NFTAsset, AssetCollection } from '@prisma/client';
import debug from 'debug';

import config from '~/config';
import { wait as wait$ } from '~/helpers/misc.helpers';
import { NewItem } from '~/helpers/typing.helpers';
import { fetch } from '~/lib/fetch';

const { opensea } = config.nft;
const log = debug('app:services:opensea');

type Navigable<T> = {
  nfts: T[];
  next: string;
};

type Asset = {
  identifier: string;
  collection: string;
  contract: string;
  token_standard: string;
  name: string;
  description: string;
  image_url: string;
  metadata_url: string;
  created_at: string;
  updated_at: string;
  is_disabled: boolean;
  is_nsfw: boolean;
};

function assetToNFT(asset: Asset, collection: AssetCollection): NewItem<NFTAsset> {
  const result: NewItem<NFTAsset> = {
    iid: asset.identifier,
    image: asset.image_url || '',
    address: asset.contract,
    name: asset.name || '',
    description: asset.description,
    owner: '',
    meta: {
      token_standard: asset.token_standard,
      metadata_url: asset.metadata_url,
      is_disabled: asset.is_disabled,
      is_nsfw: asset.is_nsfw,
    },
    colId: collection.id,
    url: `https://opensea.io/assets/ethereum/${collection.address}/${asset.identifier}`,
    updatedAt: new Date(asset.updated_at),
    createdAt: new Date(asset.created_at),
  };

  (['updatedAt', 'createdAt'] as const).forEach((key) => {
    if (isNaN(result[key] as unknown as number)) {
      result[key] = new Date();
    }
  });

  return result;
}

export async function all(collection: AssetCollection): Promise<NewItem<NFTAsset>[]> {
  const baseUrl = `${opensea.baseUrl}/v2/collection/${collection.slug}/nfts?limit=50`;
  const result: NewItem<NFTAsset>[] = [];
  let next = '';

  // eslint-disable-next-line no-constant-condition
  while (true) {
    log(`Getting NFTs from OpenSea, next=${next}`);
    const { data, status } = await fetch<Navigable<Asset>>(`${baseUrl}&next=${next}`, {
      headers: {
        'X-API-KEY': opensea.apiKey,
      },
    });

    if (status === 200) {
      log(`Got ${data.nfts.length} NFTs`);

      result.push(...data.nfts.map((item) => assetToNFT(item, collection)));

      if (!data.next) {
        break;
      }

      next = data.next;
    }

    await wait$(opensea.delay);
  }

  return result;
}
