import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const jwkClient = jwksClient({
  jwksUri: 'https://api.epicgames.dev/auth/v1/oauth/jwks',
  requestHeaders: {}, // Optional
  timeout: 30000, // Defaults to 30s
});

export async function getPlayerFromEOSToken(token: string) {
  try {
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded) return null;

    const { header } = decoded;

    if (header && header.alg !== '') {
      const { kid } = header;

      const key = await jwkClient.getSigningKey(kid);
      const publicKey = key.getPublicKey();
      const verified = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

      if (!verified || typeof verified !== 'object') return null;

      const { iss, sub } = verified;

      if (iss !== 'https://api.epicgames.dev/auth/v1/oauth')
        throw new Error('UnauthorizedException');

      return sub;
    }
  } catch (e) {
    return null;
  }

  return null;
}
