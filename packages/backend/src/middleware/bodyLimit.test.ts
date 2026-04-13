import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { bodyLimitMiddleware } from './bodyLimit';

function createApp() {
  const app = new Hono();
  app.use('*', bodyLimitMiddleware);
  app.post('/test', (c) => c.json({ ok: true }));
  app.get('/test', (c) => c.json({ ok: true }));
  return app;
}

describe('bodyLimitMiddleware', () => {
  it('allows requests without content-length', async () => {
    const app = createApp();
    const res = await app.request('/test', { method: 'GET' });
    expect(res.status).toBe(200);
  });

  it('allows requests within size limit', async () => {
    const app = createApp();
    const body = JSON.stringify({ data: 'hello' });
    const res = await app.request('/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(body.length),
      },
      body,
    });
    expect(res.status).toBe(200);
  });

  it('rejects requests exceeding 512KB', async () => {
    const app = createApp();
    const res = await app.request('/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(600 * 1024),
      },
      body: 'x',
    });
    expect(res.status).toBe(413);
    const json = await res.json();
    expect(json.error).toContain('too large');
  });

  it('allows requests exactly at 512KB', async () => {
    const app = createApp();
    const res = await app.request('/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(512 * 1024),
      },
      body: '{}',
    });
    expect(res.status).toBe(200);
  });
});
