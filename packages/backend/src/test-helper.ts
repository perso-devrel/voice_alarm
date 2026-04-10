import { Hono } from 'hono';
import type { AppEnv } from './types';
import { vi } from 'vitest';

export interface MockDB {
  execute: ReturnType<typeof vi.fn>;
  batch: ReturnType<typeof vi.fn>;
}

export function createMockDB(): MockDB {
  return {
    execute: vi.fn().mockResolvedValue({ rows: [], rowsAffected: 0 }),
    batch: vi.fn().mockResolvedValue([]),
  };
}

export function createTestApp(routes: Hono<AppEnv>, basePath: string, userId = 'test-user-id') {
  const app = new Hono<AppEnv>();

  app.use('*', async (c, next) => {
    c.set('userId', userId);
    c.set('userEmail', 'test@example.com');
    c.set('userName', 'Test User');
    c.set('userPicture', '');
    await next();
  });

  app.route(basePath, routes);
  return app;
}

export function jsonReq(method: string, path: string, body?: Record<string, unknown>) {
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) init.body = JSON.stringify(body);
  return new Request(`http://localhost${path}`, init);
}
