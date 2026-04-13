import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { rateLimitMiddleware } from './rateLimit';

let userCounter = 0;
function createApp(userId?: string) {
  const uid = userId ?? `test-user-${++userCounter}`;
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('userId', uid);
    await next();
  });
  app.use('*', rateLimitMiddleware);
  app.get('/test', (c) => c.json({ ok: true }));
  return app;
}

describe('rateLimitMiddleware', () => {
  it('allows requests under the limit', async () => {
    const app = createApp();
    const res = await app.request('/test');
    expect(res.status).toBe(200);
    expect(res.headers.get('X-RateLimit-Limit')).toBe('60');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('59');
  });

  it('sets all rate limit headers', async () => {
    const app = createApp();
    const res = await app.request('/test');
    expect(res.headers.get('X-RateLimit-Limit')).toBeDefined();
    expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
    expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
  });

  it('decrements remaining count per request', async () => {
    const app = createApp();
    await app.request('/test');
    const res = await app.request('/test');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('58');
  });

  it('returns 429 when limit exceeded', async () => {
    const app = createApp();
    for (let i = 0; i < 60; i++) {
      await app.request('/test');
    }
    const res = await app.request('/test');
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe('Too many requests');
    expect(body.retryAfter).toBeGreaterThan(0);
    expect(res.headers.get('Retry-After')).toBeDefined();
  });

  it('uses userId as rate limit key when available', async () => {
    const sharedId = `shared-${++userCounter}`;
    const app = createApp(sharedId);
    for (let i = 0; i < 60; i++) {
      await app.request('/test');
    }
    const res = await app.request('/test');
    expect(res.status).toBe(429);

    const ipApp = new Hono();
    ipApp.use('*', rateLimitMiddleware);
    ipApp.get('/test', (c) => c.json({ ok: true }));
    const ipRes = await ipApp.request('/test', {
      headers: { 'cf-connecting-ip': `unique-${++userCounter}` },
    });
    expect(ipRes.status).toBe(200);
  });

  it('uses IP as fallback key when no userId', async () => {
    const ipApp = new Hono();
    ipApp.use('*', rateLimitMiddleware);
    ipApp.get('/test', (c) => c.json({ ok: true }));

    const uniqueIp = `10.0.0.${++userCounter}`;
    const res = await ipApp.request('/test', {
      headers: { 'x-forwarded-for': uniqueIp },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('59');
  });
});
