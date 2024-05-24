import dotenv from 'dotenv';

import { EnvKeys } from './interfaces';

dotenv.config({
  path: '.env/.common.env',
});

dotenv.config({
  path: `.env/.${process.env.NODE_ENV || 'local'}.env`,
});

export type VariableValue = string | boolean | number;

export type GVariable<T extends VariableValue> = {
  defaultValue?: T;
  group?: string;
  log?: boolean;
  description?: string;
  name: string;
};

export type StringVariable = GVariable<string> & {
  type: 'string';
};

export type BooleanVariable = GVariable<boolean> & {
  type: 'boolean';
};

export type NumberVariable = GVariable<number> & {
  type: 'number';
};

export type Variable = StringVariable | BooleanVariable | NumberVariable;

const ENV = process.env.NODE_ENV || 'local';
const publicUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;

const variables: Record<EnvKeys, Variable> = {
  NODE_ENV: {
    name: 'Env Type',
    type: 'string',
    defaultValue: 'local',
  },
  /**
   * App
   */
  PORT: {
    name: 'Port',
    type: 'number',
    defaultValue: 3000,
  },
  API_PREFIX: {
    name: 'API Prefix',
    type: 'string',
    defaultValue: '/api/v1',
  },
  PUBLIC_URL: {
    type: 'string',
    name: 'Public URL',
    defaultValue: publicUrl,
  },
  HOST: {
    type: 'string',
    name: 'Host',
    defaultValue: '0.0.0.0',
  },
  APP_NAME: {
    type: 'string',
    name: 'App Name',
    defaultValue: 'Param Labs Launcher',
  },
  CORS_ORIGIN: {
    type: 'string',
    name: 'Origin',
    group: 'CORS',
    defaultValue: publicUrl,
  },
  CORS_ENABLED: {
    name: 'Enabled',
    group: 'CORS',
    defaultValue: false,
    type: 'boolean',
  },
  MORGAN_ENABLED: {
    name: 'Enable logging',
    group: 'morgan',
    defaultValue: false,
    type: 'boolean',
  },
  MORGAN_TYPE: {
    type: 'string',
    name: 'Type',
    group: 'morgan',
    defaultValue: 'dev',
  },
  NONCE_TTL: {
    name: 'TTL (in seconds)',
    group: 'Nonce',
    defaultValue: 120,
    type: 'number',
  },
  APP_TOS: {
    type: 'string',
    name: 'Terms Of Service',
    defaultValue: 'https://drive.google.com/file/d/1LYdVXf5ryvonvtm0RfJgcukQIitzUv-K/view',
  },
  /**
   * Mailer
   */
  MAILER_FROM: {
    type: 'string',
    name: 'From',
    group: 'Mailer',
    defaultValue: 'noreply@example.com',
  },
  MAILER_TYPE: {
    type: 'string',
    name: 'Type',
    group: 'Mailer',
    defaultValue: 'brevo',
  },
  SENDGRID_API_KEY: {
    type: 'string',
    name: 'SendGrid API Key',
    group: 'Mailer',
  },
  POSTMARK_API_KEY: {
    type: 'string',
    name: 'Postmark API Key',
    group: 'Mailer',
  },
  BREVO_API_KEY: {
    type: 'string',
    name: 'Brevo API Key',
    group: 'Mailer',
  },
  /**
   * IMX
   */
  IMX_API_URL: {
    type: 'string',
    name: 'API URL',
    group: 'IMX',
    defaultValue: 'https://api.x.immutable.com',
  },
  /**
   * GameStop
   */
  GS_API_URL: {
    type: 'string',
    name: 'API URL',
    group: 'GameStop',
    defaultValue: 'https://api.nft.gamestop.com',
  },
  /**
   * NFT
   */
  NFT_SYNC_INTERVAL: {
    type: 'string',
    name: 'Sync Interval',
    group: 'NFT',
    defaultValue: '0 0 * * *',
  },
  /**
   * OpenSea
   */
  OPENSEA_API_URL: {
    type: 'string',
    name: 'API URL',
    group: 'OpenSea',
    defaultValue: 'https://api.opensea.io',
  },
  OPENSEA_API_KEY: {
    type: 'string',
    name: 'API Key',
    group: 'OpenSea',
  },
  OPENSEA_API_DELAY: {
    type: 'number',
    name: 'API DELAY',
    group: 'OpenSea',
    defaultValue: 300,
  },
  /**
   * Security
   */
  SECURITY_DELAY: {
    name: 'Delay',
    group: 'security',
    type: 'number',
    defaultValue: 30000,
  },
  SECURITY_MAX_TRIES: {
    name: 'Max Tries',
    group: 'security',
    type: 'number',
    defaultValue: 5,
  },
  SECURITY_CODE_LENGTH: {
    name: 'Code Length',
    group: 'Security',
    defaultValue: 6,
    type: 'number',
  },
  SECURITY_CODE_DELAY: {
    name: 'Verification Delay',
    group: 'Security',
    defaultValue: 30000, // 30s
    type: 'number',
  },
  SECURITY_TRY_DELAY: {
    name: 'Retry Delay',
    group: 'Security',
    defaultValue: 5000, // 5s
    type: 'number',
  },
  SECURITY_CODE_TTL: {
    name: 'Verification Delay',
    group: 'Security',
    defaultValue: 7200000, // 2h
    type: 'number',
  },
  SECURITY_MAX_SENDS: {
    name: 'Max Resends',
    group: 'Security',
    defaultValue: 5,
    type: 'number',
  },
  /**
   * MongoDB
   */
  DATABASE_URL: {
    type: 'string',
    name: 'URI',
    group: 'MongoDB',
    defaultValue: `mongodb://127.0.0.1:27017/app-${ENV}`,
  },
  /**
   * tRPC
   */
  TRPC_PLAYGROUND_ENABLED: {
    type: 'boolean',
    name: 'Enable',
    group: 'tRPC',
    defaultValue: false,
  },
  /**
   * JWT
   */
  JWT_ISSUER: {
    type: 'string',
    name: 'Issuer',
    log: false,
    group: 'JWT',
    defaultValue: publicUrl,
  },
  JWT_AUDIENCE: {
    type: 'string',
    name: 'Audience',
    log: false,
    group: 'JWT',
    defaultValue: new URL(publicUrl).host,
  },
  JWT_EXPIRATION: {
    name: 'Expiration',
    log: false,
    group: 'JWT',
    defaultValue: 2592000, // 30 days
    type: 'number',
  },
  JWT_PUBLIC_KEY: {
    type: 'string',
    name: 'Private Key',
    log: false,
    group: 'JWT',
    defaultValue: 'certs/es512-public.pem',
  },
  JWT_PRIVATE_KEY: {
    type: 'string',
    name: 'Private Key',
    log: false,
    group: 'JWT',
    defaultValue: 'certs/es512-private.pem',
  },
  /**
   * Stripe
   */
  STRIPE_PUBLISHABLE_KEY: {
    type: 'string',
    name: 'Publishable Key',
    group: 'stripe',
    defaultValue: '',
  },
  STRIPE_SECRET_KEY: {
    type: 'string',
    name: 'Secret Key',
    group: 'stripe',
    defaultValue: '',
  },
  STRIPE_WEBHOOK_KEY: {
    type: 'string',
    name: 'Webhook Key',
    group: 'stripe',
    defaultValue: '',
  },
  /**
   * ReCaptcha
   */
  GOOGLE_RECAPTCHA_ENABLED: {
    type: 'boolean',
    name: 'Enabled',
    group: 'ReCaptcha',
    defaultValue: false,
  },
  GOOGLE_RECAPTCHA_SECRET_KEY: {
    type: 'string',
    name: 'Secret Key',
    group: 'ReCaptcha',
    defaultValue: '',
  },
  GOOGLE_RECAPTCHA_MIN_SCORE: {
    type: 'number',
    name: 'Min Score',
    group: 'ReCaptcha',
    defaultValue: 0.5,
  },
  /**
   * Loopring
   */
  LOOPRING_BASE_URL: {
    type: 'string',
    group: 'loopring',
    name: 'Base Url',
    defaultValue: 'https://api3.loopring.io',
  },
  LOOPRING_API_KEY: {
    type: 'string',
    group: 'loopring',
    name: 'API Key',
    defaultValue: 'LOOPRING_API_KEY',
  },
  /**
   * Spaces
   */
  SPACES_REGION: {
    type: 'string',
    name: 'Region',
    group: 'aws:spaces',
    defaultValue: 'fra1',
  },
  SPACES_ENDPOINT: {
    type: 'string',
    name: 'Endpoint',
    group: 'aws:spaces',
    defaultValue: 'https://fra1.digitaloceanspaces.com',
  },
  SPACES_STATIC_DOMAIN: {
    type: 'string',
    name: 'Static Domain',
    group: 'aws:spaces',
    defaultValue: 'cdn.kiraverse.game',
  },
  SPACES_BUCKET: {
    type: 'string',
    name: 'Bucket',
    group: 'aws:spaces',
    defaultValue: 'launcher',
  },
  SPACES_CHUNK_SIZE: {
    type: 'number',
    name: 'Chunk size',
    group: 'aws:spaces',
    defaultValue: 100_000_000,
  },
  SPACES_CLIENT_ID: {
    type: 'string',
    name: 'Client ID',
    group: 'aws:spaces',
    defaultValue: 'SPACES_CLIENT_ID',
  },
  SPACES_SECRET_KEY: {
    type: 'string',
    name: 'Secret Key',
    group: 'aws:spaces',
    defaultValue: 'SPACES_SECRET_KEY',
  },
} as const;

export default variables;
