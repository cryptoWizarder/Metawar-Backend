import { Asset as NFTAsset, AssetCollection } from '@prisma/client';
import debug from 'debug';

import config from '~/config';
import { NewItem } from '~/helpers/typing.helpers';
import { fetch } from '~/lib/fetch';

const { imx } = config.nft;
const log = debug('app:services:imx');

type Navigable<T> = {
  result: T[];
  cursor: string;
  remaining: number;
};

type Asset = {
  token_address: string;
  token_id: string;
  id: string;
  user: string;
  status: string;
  uri: string | null;
  name: string;
  description: string;
  image_url: string;
  metadata: {
    [name: string]: string;
  };
  collection: {
    name: string;
    icon_url: string;
  };
  created_at: string;
  updated_at: string;
};

function assetToNFT(asset: Asset, collection: AssetCollection): NewItem<NFTAsset> {
  const result: NewItem<NFTAsset> = {
    iid: asset.token_id,
    image: asset.image_url || '',
    address: asset.token_address,
    name: asset.name || '',
    description: asset.description,
    owner: asset.user,
    meta: asset.metadata,
    colId: collection.id,
    url: `https://market.immutable.com/collections/${collection.address}/assets/${asset.token_id}`,
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
  const baseUrl = `${imx.baseUrl}/v1/assets?collection=${collection.address}&page_size=200`;
  const result: NewItem<NFTAsset>[] = [];
  let next = '';

  // eslint-disable-next-line no-constant-condition
  while (true) {
    log(`Getting NFTs from IMX, next=${next}`);
    const { data } = await fetch<Navigable<Asset>>(`${baseUrl}&cursor=${next}`);

    if (data.result.length === 0) {
      break;
    }

    log(`Got ${data.result.length} NFTs`);

    result.push(...data.result.map((item) => assetToNFT(item, collection)));
    next = data.cursor;
  }

  return result;
}
