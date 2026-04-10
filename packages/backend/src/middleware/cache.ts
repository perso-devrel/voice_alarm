import type { MiddlewareHandler } from 'hono';

export function cacheControl(directive: string): MiddlewareHandler {
  return async (c, next) => {
    await next();
    if (c.res.status < 300) {
      c.res.headers.set('Cache-Control', directive);
    }
  };
}

export const publicCache: MiddlewareHandler = cacheControl('public, max-age=3600, s-maxage=3600');
export const privateCache: MiddlewareHandler = cacheControl('private, max-age=30');
export const noStore: MiddlewareHandler = cacheControl('no-store');
