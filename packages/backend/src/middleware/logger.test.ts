import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { loggerMiddleware } from './logger';

describe('loggerMiddleware', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createApp(handler?: (c: { json: (b: unknown, s?: number) => Response }) => Response) {
    const app = new Hono();
    app.use('*', loggerMiddleware);
    app.get('/test', handler ?? ((c) => c.json({ ok: true })));
    app.get('/error', (c) => c.json({ error: 'fail' }, 500));
    app.get('/not-found', (c) => c.json({ error: 'not found' }, 404));
    return app;
  }

  it('sets X-Request-Id header', async () => {
    const app = createApp();
    const res = await app.request('/test');
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Request-Id')).toBeTruthy();
    expect(res.headers.get('X-Request-Id')!.length).toBe(8);
  });

  it('logs structured JSON for successful requests', async () => {
    const app = createApp();
    await app.request('/test');
    expect(logSpy).toHaveBeenCalledOnce();
    const logged = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(logged.method).toBe('GET');
    expect(logged.path).toBe('/test');
    expect(logged.status).toBe(200);
    expect(logged.duration_ms).toBeGreaterThanOrEqual(0);
    expect(logged.rid).toBeTruthy();
    expect(logged.perf).toBe('fast');
  });

  it('uses console.warn for 4xx responses', async () => {
    const app = createApp();
    await app.request('/not-found');
    expect(warnSpy).toHaveBeenCalledOnce();
    const logged = JSON.parse(warnSpy.mock.calls[0][0] as string);
    expect(logged.status).toBe(404);
  });

  it('uses console.error for 5xx responses', async () => {
    const app = createApp();
    await app.request('/error');
    expect(errorSpy).toHaveBeenCalledOnce();
    const logged = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(logged.status).toBe(500);
  });

  it('includes userId when available', async () => {
    const app = new Hono();
    app.use('*', async (c, next) => {
      c.set('userId', 'user-123');
      await next();
    });
    app.use('*', loggerMiddleware);
    app.get('/test', (c) => c.json({ ok: true }));
    await app.request('/test');
    const logged = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(logged.uid).toBe('user-123');
  });

  it('omits userId when not set', async () => {
    const app = createApp();
    await app.request('/test');
    const logged = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(logged.uid).toBeUndefined();
  });
});
