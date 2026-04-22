import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { bodyLimitMiddleware } from '../src/middleware/bodyLimit';

function buildApp() {
  const app = new Hono();
  app.use('*', bodyLimitMiddleware);
  app.post('/upload', (c) => c.json({ ok: true }));
  return app;
}

describe('bodyLimitMiddleware', () => {
  it('Content-Length 미포함 시 통과', async () => {
    const app = buildApp();
    const res = await app.request(new Request('http://localhost/upload', { method: 'POST' }));
    expect(res.status).toBe(200);
  });

  it('25MB 이하 요청 통과', async () => {
    const app = buildApp();
    const res = await app.request(
      new Request('http://localhost/upload', {
        method: 'POST',
        headers: { 'Content-Length': String(25 * 1024 * 1024) },
      }),
    );
    expect(res.status).toBe(200);
  });

  it('25MB 초과 시 413', async () => {
    const app = buildApp();
    const res = await app.request(
      new Request('http://localhost/upload', {
        method: 'POST',
        headers: { 'Content-Length': String(25 * 1024 * 1024 + 1) },
      }),
    );
    expect(res.status).toBe(413);
    const data = await res.json();
    expect(data.error).toContain('too large');
  });
});
