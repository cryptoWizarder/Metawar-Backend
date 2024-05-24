import { App, Session } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { getClientIp } from 'request-ip';

import config from '~/config';
import { prismaClient } from '~/lib/prisma';
import Logger from './logger.helpers';

const jwtConfig = config.jwt;
const logger = Logger('helpers:jwt');

/**
 * Create signed token
 * @param {object} payload the payload
 * @returns {string} the token
 */
export const signSession = async (uid: string, ctx: TContext, payload: object = {}) => {
  const session = await prismaClient.session.create({
    data: {
      uid: uid,
      desc: '',
      meta: {
        ua: ctx.req.headers['user-agent'],
        ip: getClientIp(ctx.req),
      },
    },
  });

  if (!session) return null;

  logger.info('Signed in', {
    ...ctx,
    session,
    user: (await prismaClient.user.findUnique({
      where: {
        id: uid,
      },
    }))!,
  });

  const iat = Math.floor((session.createdAt || new Date()).getTime() / 1000);

  return jwt.sign(
    {
      iss: jwtConfig.iss,
      aud: jwtConfig.aud,
      exp: iat + jwtConfig.exp,
      ...payload,
      sub: session.uid,
      jti: session.id,
      iat,
    },
    jwtConfig.privateKey,
    {
      algorithm: 'ES512',
    },
  );
};

export async function getSessionFromApp(app: App) {
  const user = {
    blocked: false,
    email: 'tmp@kiraverse.game',
    email_verified: true,
    created_at: new Date(),
    updated_at: new Date(),
    last_login: new Date(),
    _id: app.uid,
  };

  if (!user || user.blocked) return null;

  const session: Session = {
    id: app.uid,
    createdAt: user.created_at ? new Date(user.created_at) : new Date(),
    updatedAt: user.updated_at ? new Date(user.updated_at) : new Date(),
    desc: `Session for the app ${app.id}`,
    uid: user._id || app.uid,
    meta: {},
  };

  return session;
}
