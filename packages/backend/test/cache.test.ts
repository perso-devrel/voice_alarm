import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { publicCache, privateCache, noStore } from '../src/middleware/cache';

function buildApp(mw: Parameters<typeof Hono.prototype.use>[1], status = 200) {
  const app = new Hono();
  app.use('*', mw);
  app.get('/ok', (c) => c.json({ ok: true }, status as 200));
  return app;
}

function req() {
  return new Request('http://localhost/ok');
}

describe('publicCache', () => {
  it('200 응답에 Cache-Control public 설정', async () => {
    const app = buildApp(publicCache);
    const res = await app.request(req());
    expect(res.headers.get('Cache-Control')).toContain('public');
    expect(res.headers.get('Cache-Control')).toContain('max-age=3600');
    expect(res.headers.get('Vary')).toBeNull();
  });
});

describe('privateCache', () => {
  it('200 응답에 Cache-Control private + Vary: Authorization', async () => {
    const app = buildApp(privateCache);
    const res = await app.request(req());
    expect(res.headers.get('Cache-Control')).toContain('private');
    expect(res.headers.get('Vary')).toBe('Authorization');
  });
});

describe('noStore', () => {
  it('200 응답에 Cache-Control no-store', async () => {
    const app = buildApp(noStore);
    const res = await app.request(req());
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('에러 응답 시 캐시 헤더 미설정', () => {
  it('500 응답에는 Cache-Control 미설정', async () => {
    const app = new Hono();
    app.use('*', publicCache);
    app.get('/ok', (c) => c.json({ error: 'fail' }, 500));
    const res = await app.request(req());
    expect(res.headers.get('Cache-Control')).toBeNull();
  });
});
