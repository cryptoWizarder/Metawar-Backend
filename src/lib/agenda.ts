import { Asset, AssetCollection, AssetSource } from '@prisma/client';
import { Agenda, Job } from 'agenda';
import debug from 'debug';

import config from '~/config';
import { NewItem } from '~/helpers/typing.helpers';
import { all as allGS } from '~/services/gamestop.service';
import { all as allIMX } from '~/services/imx.service';
import { all as allOpenSea } from '~/services/opensea.service';

import { prismaClient } from './prisma';

const agenda = new Agenda({ db: { address: config.dbUrl, collection: 'jobs' } });
const log = debug('app:lib:agenda');

async function parseCollection(col: AssetCollection): Promise<NewItem<Asset>[]> {
  switch (col.type) {
    case AssetSource.GAMESTOP:
      log('Getting NFTs from GameStop');
      return allGS(col);
    case AssetSource.OPENSEA:
      log('Getting NFTs from OpenSea');
      return allOpenSea(col);
    case AssetSource.IMX:
      log('Getting NFTs from IMX');
      return allIMX(col);
  }
}

agenda.define('nfts:fetch', async (job: Job) => {
  if (job.attrs.disabled) return;
  await job.disable().save();
  try {
    const cols = await prismaClient.assetCollection.findMany();
    const nfts = (await Promise.all(cols.map(parseCollection))).flat();
    log('Got %d NFTs', nfts.length);
    log('Deleting old NFTs');
    await prismaClient.asset.deleteMany();
    log('Inserting new NFTs');
    await prismaClient.asset.createMany({ data: nfts });
  } catch (e) {
    console.error('Error while running the job', e);
  }
  log('Job finished');
  await job.enable().save();
});

export function getJob(name: string) {
  return agenda.jobs({ name }).then((j) => j[0]);
}

export async function start() {
  await agenda.start();
  await agenda.every(config.nft.syncInterval, 'nfts:fetch');
}
