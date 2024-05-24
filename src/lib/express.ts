import * as trpcExpress from '@trpc/server/adapters/express';
import cors from 'cors';
import debug from 'debug';
import express from 'express';
import morgan from 'morgan';
import nunjucks from 'nunjucks';
import { expressHandler } from 'trpc-playground/handlers/express';

import config from '~/config/index';
import router from '~/handlers/main.handler';
import proxy from './proxy';
import { appRouter } from '~/routers/index';
import { rootViews } from './nunjucks';
import { prismaClient } from './prisma';
import { createContext } from './trpc/context';

const log = debug('app:main');

export async function start() {
  const app = express();

  nunjucks.configure(rootViews, {
    autoescape: true,
    express: app,
  });

  if (config.cors.enabled) {
    log('cors enabled');
    app.use(cors(config.cors.options));
  }

  if (config.morgan.enabled) {
    log('configure logging');
    app.use(morgan(config.morgan.type));
  }

  log('set the public folder');
  app.use(express.static('public'));

  log('configure body parsers');
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  app.use(proxy);
  app.use(config.prefix, router);

  app.use(
    `${config.prefix}/trpc`,
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  if (config.trpc.playground.enabled) {
    log('enabling tRPC playground');
    app.use(
      `${config.prefix}/trpc-playground`,
      await expressHandler({
        trpcApiEndpoint: `${config.prefix}/trpc`,
        playgroundEndpoint: `${config.prefix}/trpc-playground`,
        router: appRouter,
      }),
    );
  }

  await prismaClient.$connect();

  log('configure fallbacks');
  app.get('/*', (req, res) =>
    res.status(404).json({ success: false, message: "API Doesn't Exist" }),
  );

  return app;
}
