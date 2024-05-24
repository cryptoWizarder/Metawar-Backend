import { Asset as NFTAsset, AssetCollection } from '@prisma/client';
import debug from 'debug';

import config from '~/config';
import { wait as wait$ } from '~/helpers/misc.helpers';
import { NewItem } from '~/helpers/typing.helpers';
import { fetch } from '~/lib/fetch';

const { gamestop } = config.nft;
const log = debug('app:services:gamestop');

type Navigable<T> = {
  data: T[];
  limit: number;
  offset: number;
  totalNum: number;
};

type Asset = {
  nftId: string;
  tokenId: string;
  contractAddress: string;
  creatorEthAddress: string;
  name: string;
  description: string;
  amount: number;
  royaltyFeeBips: number;
  copyright: string | null;
  nftType: string;
  nativeLayer: string;
  mutable: boolean;
  metadataUri: string;
  metadataJson: {
    dna: string;
    Body: string;
    Mask: string;
    date: number;
    name: string;
    image: string;
    edition: number;
    Clothing: string;
    Background: string;
    Foundation: string;
    description: string;
  };
  mediaType: string;
  mediaUri: string;
  mediaThumbnailUri: string;
  preRevealMediaType: string | null;
  preRevealMediaUri: string | null;
  preRevealMediaThumbnailUri: string | null;
  collectionId: string;
  revealed: boolean;
  state: string;
  firstMintedAt: string;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
};

function getPublicLink(link: string): string {
  switch (true) {
    case link.startsWith('public/'):
      return link.replace(/^public/, 'https://static.gstop-content.com');
    case link.startsWith('ipfs://'):
      return link.replace(/^ipfs:\/\//, 'https://www.gstop-content.com/ipfs/');
    default:
      return link;
  }
}

function assetToNFT(asset: Asset, collection: AssetCollection): NewItem<NFTAsset> {
  const result: NewItem<NFTAsset> = {
    iid: asset.tokenId,
    image: getPublicLink(asset.mediaThumbnailUri || asset.mediaUri || ''),
    address: asset.contractAddress,
    name: asset.name || '',
    description: asset.description,
    owner: '',
    meta: asset.metadataJson,
    colId: collection.id,
    url: `https://nft.gamestop.com/token/${collection.address}/${asset.tokenId}`,
    updatedAt: new Date(asset.updatedAt),
    createdAt: new Date(asset.createdAt),
  };

  (['updatedAt', 'createdAt'] as const).forEach((key) => {
    if (isNaN(result[key] as unknown as number)) {
      result[key] = new Date();
    }
  });

  return result;
}

export async function all(collection: AssetCollection): Promise<NewItem<NFTAsset>[]> {
  const baseUrl = `${gamestop.baseUrl}/nft-svc-marketplace/getNftsPaginated?collectionId=${
    collection.iid
  }&limit=100&sortBy=price&sortOrder=asc&nativeLayer=${
    (collection.meta as Record<string, string>)?.layer || 'Immutable'
  }`;
  const result: NewItem<NFTAsset>[] = [];
  let offset = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    log(`Getting NFTs from GameStop, offset=${offset}`);
    const { status, data } = await fetch<Navigable<Asset>>(`${baseUrl}&offset=${offset}`);

    if (status === 200) {
      log(`Got ${data.data.length} NFTs`);

      if (data.data.length === 0) {
        break;
      }

      result.push(...data.data.map((item) => assetToNFT(item, collection)));

      if (data.offset + data.limit >= data.totalNum) {
        break;
      }

      offset = data.offset + data.limit;
    }

    await wait$(600);
  }

  return result;
}
