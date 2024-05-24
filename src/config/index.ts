import { readFileSync } from 'node:fs';
import { CorsOptionsDelegate } from 'cors';

import { get } from './tools';
import { Request } from 'express';

const jwtCerts = (
  [
    {
      name: 'Public Key',
      key: 'publicKey',
      envVar: 'JWT_PUBLIC_KEY',
    },
    {
      name: 'Private Key',
      key: 'privateKey',
      envVar: 'JWT_PRIVATE_KEY',
    },
  ] as {
    name: string;
    key: string;
    envVar: 'JWT_PRIVATE_KEY' | 'JWT_PUBLIC_KEY';
  }[]
).reduce((prev, curr) => {
  const path = get(curr.envVar);

  if (path.startsWith('-----BEGIN')) {
    return { ...prev, [curr.key]: path };
  }

  try {
    const content = readFileSync(path, { encoding: 'utf-8' });
    return { ...prev, [curr.key]: content };
  } catch (e) {
    console.warn('Cannot find the "%s". please check the "%s" file', curr.name, path);
  }

  return prev;
}, {});

const publicUrl = get('PUBLIC_URL');

export default {
  env: get('NODE_ENV'),
  port: get('PORT'),
  prefix: get('API_PREFIX'),
  host: get('HOST'),
  appName: get('APP_NAME'),
  publicUrl,
  domain: new URL(publicUrl).host,
  morgan: {
    enabled: get('MORGAN_ENABLED'),
    type: get('MORGAN_TYPE'),
  },
  nonce: {
    ttl: get('NONCE_TTL') * 1000, // Convert to ms
    tos: get('APP_TOS'),
  },
  nft: {
    syncInterval: get('NFT_SYNC_INTERVAL'),
    imx: {
      baseUrl: get('IMX_API_URL'),
    },
    gamestop: {
      baseUrl: get('GS_API_URL'),
    },
    opensea: {
      baseUrl: get('OPENSEA_API_URL'),
      apiKey: get('OPENSEA_API_KEY'),
      delay: get('OPENSEA_API_DELAY'),
    },
  },
  cors: {
    enabled: get('CORS_ENABLED'),
    options(req: Request, done) {
      const value = get('CORS_ORIGIN');
      const origin = req.get('origin');

      if (value === '*') return done(null, { origin: '*' });

      if (!origin) return done(null, { origin: false });

      const whitelist: string[] = value.split(',');
      const found = whitelist.find((o) => origin.startsWith(o));
      return done(null, { origin: !!found });
    },
  } as {
    enabled: boolean;
    options: CorsOptionsDelegate;
  },
  recaptcha: {
    enabled: get('GOOGLE_RECAPTCHA_ENABLED'),
    secretKey: get('GOOGLE_RECAPTCHA_SECRET_KEY'),
    minScore: get('GOOGLE_RECAPTCHA_MIN_SCORE'),
  },
  loopring: {
    url: get('LOOPRING_BASE_URL'),
    apiKey: get('LOOPRING_API_KEY'),
  },
  security: {
    code: {
      min: 10 ** (get('SECURITY_CODE_LENGTH') - 1),
      max: 10 ** get('SECURITY_CODE_LENGTH') - 1,
      delay: get('SECURITY_CODE_DELAY'),
      tryDelay: get('SECURITY_TRY_DELAY'),
      ttl: get('SECURITY_CODE_TTL'),
      maxTries: get('SECURITY_MAX_TRIES'),
      maxSends: get('SECURITY_MAX_SENDS'),
    },
  },
  dbUrl: get('DATABASE_URL'),
  trpc: {
    playground: {
      enabled: get('TRPC_PLAYGROUND_ENABLED'),
    },
  },
  mailer: {
    type: get('MAILER_TYPE'),
    from: get('MAILER_FROM'),
    sendgrid: {
      apiKey: get('SENDGRID_API_KEY'),
    },
    postmark: {
      apiKey: get('POSTMARK_API_KEY'),
    },
    brevo: {
      apiKey: get('BREVO_API_KEY'),
    },
  },
  jwt: {
    publicKey: '',
    privateKey: '',
    ...jwtCerts,
    aud: get('JWT_AUDIENCE')?.split(','),
    iss: get('JWT_ISSUER'),
    exp: get('JWT_EXPIRATION'),
  },
};
