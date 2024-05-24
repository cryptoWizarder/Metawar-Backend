import { inferAsyncReturnType } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { createHmac } from 'crypto';
import jwt from 'jsonwebtoken';
import { minimatch } from 'minimatch';

import config from '~/config';

import { getSessionFromApp } from '~/helpers/jwt.helpers';
import { prismaClient } from '../prisma';

type CtxOptions = Pick<CreateExpressContextOptions, 'req'> &
  Partial<Pick<CreateExpressContextOptions, 'res'>>;
type CreateContextOpts = CtxOptions & {
  path: string;
};

async function checkToken(opts: CreateContextOpts): Promise<TContext | false> {
  const token = opts.req.headers['authorization'] || '';

  if (!token) return false;

  const [type, value] = token.split(' ').filter(Boolean);

  if (type !== 'Bearer') return false;

  let decrypted: jwt.JwtPayload;

  try {
    decrypted = jwt.verify(value, config.jwt.publicKey, {
      algorithms: ['ES512'],
      audience: config.jwt.aud,
      issuer: config.jwt.iss,
    }) as jwt.JwtPayload;
  } catch (e) {
    return false;
  }

  const session = await prismaClient.session.findUnique({
    where: {
      id: decrypted.jti,
    },
  });

  if (!session || session.uid !== decrypted.sub) return false;

  const user = await prismaClient.user.findUnique({
    where: {
      id: decrypted.sub,
    },
  });

  if (!user || !user.active) return false;

  return {
    user,
    session,
    token: value,
    req: opts.req,
    res: opts.res,
  };
}

export async function checkApp(opts: CreateContextOpts): Promise<TContext | false> {
  const id = opts.req.headers['x-app-id']?.toString() || '';
  const secretKey = opts.req.headers['x-app-secret']?.toString() || '';

  if (!id || !secretKey) return false;

  const app = await prismaClient.app.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
    },
  });

  if (!app) return false;

  const secret = createHmac(app.alg, secretKey).digest('hex');

  if (app.secret !== secret) return false;

  const found = opts.path ? app.access.find((p) => minimatch(opts.path, p)) : null;

  if (!found || !app.user?.active) return false;

  const session = await getSessionFromApp(app);

  if (!session) return false;

  return {
    session,
    token: secret,
    req: opts.req,
    res: opts.res,
  };
}

/**
 * Creates context for an incoming request
 */
export async function createContext(opts: CtxOptions): Promise<TContext> {
  let result = await checkToken(opts as CreateContextOpts);

  if (result) {
    return result as TContext;
  }

  result = await checkApp(opts as CreateContextOpts);

  if (result) {
    return result as TContext;
  }

  return {
    req: opts.req,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
