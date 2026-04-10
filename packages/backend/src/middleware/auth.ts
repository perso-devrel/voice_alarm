import type { Context, Next } from 'hono';
import type { AppEnv } from '../types';

interface TokenPayload {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  iss: string;
  aud: string;
  exp: number;
}

/**
 * Google / Apple ID Token 검증 미들웨어
 * Firebase 없이 직접 검증
 */
export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.slice(7);

  try {
    // JWT 헤더에서 issuer 판별
    const payload = decodeJwtPayload(token);

    let verified: TokenPayload;

    if (payload.iss === 'https://appleid.apple.com') {
      // Apple ID Token
      verified = await verifyAppleToken(token);
    } else {
      // Google ID Token
      verified = await verifyGoogleToken(token, c.env.GOOGLE_CLIENT_ID);
    }

    c.set('userId', verified.sub);
    c.set('userEmail', verified.email || '');
    c.set('userName', verified.name || '');
    c.set('userPicture', verified.picture || '');
    await next();
  } catch (err) {
    return c.json({
      error: 'Invalid or expired token',
      detail: err instanceof Error ? err.message : 'Unknown',
    }, 401);
  }
}

function decodeJwtPayload(token: string): TokenPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(b64));
}

async function verifyGoogleToken(idToken: string, expectedClientId: string): Promise<TokenPayload> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!res.ok) throw new Error('Google token verification failed');

  const payload = await res.json() as TokenPayload;

  if (expectedClientId && payload.aud !== expectedClientId) {
    throw new Error('Token audience mismatch');
  }
  if (Number(payload.exp) < Date.now() / 1000) {
    throw new Error('Token expired');
  }

  return payload;
}

async function verifyAppleToken(idToken: string): Promise<TokenPayload> {
  // Apple의 공개 키로 검증
  // 간이 검증: Apple의 tokeninfo는 없으므로 JWT payload 디코딩 + 만료 체크
  // 프로덕션에서는 Apple의 JWKS로 서명 검증 필요
  const payload = decodeJwtPayload(idToken);

  if (payload.iss !== 'https://appleid.apple.com') {
    throw new Error('Invalid Apple token issuer');
  }
  if (Number(payload.exp) < Date.now() / 1000) {
    throw new Error('Token expired');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: undefined,
    picture: undefined,
    iss: payload.iss,
    aud: payload.aud,
    exp: payload.exp,
  };
}
