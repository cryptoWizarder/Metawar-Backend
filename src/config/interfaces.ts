export type EnvVars = Partial<{
  PORT: number;
  HOST: string;
  APP_NAME: string;
  API_PREFIX: string;
  PUBLIC_URL: string;
  MORGAN_ENABLED: boolean;
  MORGAN_TYPE: string;
  DATABASE_URL: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  JWT_EXPIRATION: string;
  JWT_PUBLIC_KEY: string;
  JWT_PRIVATE_KEY: string;
  CORS_ENABLED: boolean;
  CORS_ORIGIN: string;
  NODE_ENV: string;
  TRPC_PLAYGROUND_ENABLED: boolean;
  SECURITY_DELAY: number;
  SECURITY_CODE_LENGTH: number;
  SECURITY_TRY_DELAY: number;
  SECURITY_CODE_TTL: number;
  SECURITY_CODE_DELAY: number;
  SECURITY_MAX_SENDS: number;
  SECURITY_MAX_TRIES: number;
  NFT_SYNC_INTERVAL: string;
  IMX_API_URL: string;
  GS_API_URL: string;
  OPENSEA_API_URL: string;
  OPENSEA_API_KEY: string;
  OPENSEA_API_DELAY: number;
  /**
   * @start Maing
   */
  MAILER_TYPE: string;
  MAILER_FROM: string;
  BREVO_API_KEY: string;
  SENDGRID_API_KEY: string;
  POSTMARK_API_KEY: string;
  /**
   * @end
   */
  SPACES_STATIC_DOMAIN: string;
  SPACES_REGION: string;
  SPACES_ENDPOINT: string;
  SPACES_BUCKET: string;
  SPACES_CLIENT_ID: string;
  SPACES_CHUNK_SIZE: number;
  SPACES_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_KEY: string;
  /**
   * @start Google reCaptcha
   */
  GOOGLE_RECAPTCHA_ENABLED: boolean;
  GOOGLE_RECAPTCHA_SECRET_KEY: string;
  GOOGLE_RECAPTCHA_MIN_SCORE: number;
  /**
   * @end
   */
  /**
   * @start Loopring
   */
  LOOPRING_BASE_URL: string;
  LOOPRING_API_KEY: string;
  /**
   * @end
   */
  NONCE_TTL: number;
  APP_TOS: string;
}>;

export type EnvKeys = keyof EnvVars;
