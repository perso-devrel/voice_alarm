import type { Context, Next } from 'hono';

export async function loggerMiddleware(c: Context, next: Next) {
  const requestId = crypto.randomUUID().slice(0, 8);
  c.set('requestId', requestId);
  c.header('X-Request-Id', requestId);

  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const ms = Date.now() - start;
  const status = c.res.status;
  const logFn = status >= 500 ? console.error : status >= 400 ? console.warn : console.log;

  logFn(
    JSON.stringify({
      rid: requestId,
      method,
      path,
      status,
      ms,
      uid: (c.get('userId') as string | undefined) || undefined,
    }),
  );
}
