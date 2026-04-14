import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { cacheControl, publicCache, privateCache, noStore } from './cache';

function createApp(middleware: Parameters<Hono['use']>[1]) {
  const app = new Hono();
  app.use('*', middleware);
  app.get('/ok', (c) => c.json({ ok: true }));
  app.get('/error', (c) => c.json({ error: 'fail' }, 500));
  return app;
}

describe('cache middleware', () => {
  describe('cacheControl', () => {
    it('sets Cache-Control header on success', async () => {
      const app = createApp(cacheControl('max-age=60'));
      const res = await app.request('/ok');
      expect(res.headers.get('Cache-Control')).toBe('max-age=60');
    });

    it('does not set header on error responses', async () => {
      const app = createApp(cacheControl('max-age=60'));
      const res = await app.request('/error');
      expect(res.headers.get('Cache-Control')).toBeNull();
    });

    it('sets Vary header when provided', async () => {
      const app = createApp(cacheControl('private', 'Authorization'));
      const res = await app.request('/ok');
      expect(res.headers.get('Vary')).toBe('Authorization');
    });

    it('omits Vary header when not provided', async () => {
      const app = createApp(cacheControl('max-age=60'));
      const res = await app.request('/ok');
      expect(res.headers.get('Vary')).toBeNull();
    });
  });

  describe('preset middlewares', () => {
    it('publicCache sets long public cache', async () => {
      const app = createApp(publicCache);
      const res = await app.request('/ok');
      const cc = res.headers.get('Cache-Control')!;
      expect(cc).toContain('public');
      expect(cc).toContain('max-age=3600');
      expect(cc).toContain('s-maxage=86400');
    });

    it('privateCache sets short private cache with Vary', async () => {
      const app = createApp(privateCache);
      const res = await app.request('/ok');
      const cc = res.headers.get('Cache-Control')!;
      expect(cc).toContain('private');
      expect(cc).toContain('max-age=30');
      expect(res.headers.get('Vary')).toBe('Authorization');
    });

    it('noStore disables caching', async () => {
      const app = createApp(noStore);
      const res = await app.request('/ok');
      expect(res.headers.get('Cache-Control')).toBe('no-store');
    });
  });
});
