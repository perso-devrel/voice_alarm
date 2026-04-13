import type { Context, Next } from 'hono';

const MAX_BODY_BYTES = 512 * 1024; // 512 KB

export async function bodyLimitMiddleware(c: Context, next: Next) {
  const contentLength = c.req.header('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return c.json({ error: 'Request body too large' }, 413);
  }
  await next();
}
