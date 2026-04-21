import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '../src/types';
import { createMockDB, fakeAuthMiddleware, jsonReq } from './helpers';

const mockDB = createMockDB();

vi.mock('../src/lib/db', () => ({
  getDB: () => mockDB.client,
}));

vi.mock('../src/lib/perso', () => ({
  PersoClient: vi.fn().mockImplementation(() => ({
    listLanguages: vi.fn().mockResolvedValue({ result: { languages: [{ code: 'ko', name: 'Korean' }] } }),
    listSpaces: vi.fn().mockResolvedValue({ result: [{ spaceSeq: 1 }] }),
  })),
}));

import dubRoutes from '../src/routes/dub';

function buildApp(userId = 'user-1') {
  const app = new Hono<AppEnv>();
  app.use('*', fakeAuthMiddleware(userId));
  app.route('/dub', dubRoutes);
  return app;
}

beforeEach(() => {
  mockDB.reset();
});

describe('GET /dub/jobs', () => {
  it('빈 목록 반환', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/dub/jobs'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.jobs).toEqual([]);
  });

  it('작업 목록 반환', async () => {
    mockDB.pushResult([
      { id: 'job-1', source_language: 'ko', target_language: 'en', status: 'ready', progress: 100 },
    ]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/dub/jobs'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.jobs).toHaveLength(1);
  });
});

describe('GET /dub/:id', () => {
  it('잘못된 UUID 포맷 → 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/dub/not-a-uuid'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid');
  });

  it('존재하지 않는 작업 → 404', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/dub/12345678-1234-1234-1234-123456789012'));
    expect(res.status).toBe(404);
  });

  it('완료된 작업(ready) 반환', async () => {
    mockDB.pushResult([{
      id: '12345678-1234-1234-1234-123456789012',
      user_id: 'user-1',
      status: 'ready',
      progress: 100,
      result_message_id: 'msg-1',
      error_message: null,
    }]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/dub/12345678-1234-1234-1234-123456789012'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ready');
    expect(data.progress).toBe(100);
  });

  it('실패한 작업(failed) 반환', async () => {
    mockDB.pushResult([{
      id: '12345678-1234-1234-1234-123456789012',
      user_id: 'user-1',
      status: 'failed',
      progress: 30,
      error_message: 'Dubbing failed',
      result_message_id: null,
    }]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/dub/12345678-1234-1234-1234-123456789012'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('failed');
    expect(data.error_message).toBe('Dubbing failed');
  });

  it('업로딩 중(uploading) → progress 0', async () => {
    mockDB.pushResult([{
      id: '12345678-1234-1234-1234-123456789012',
      user_id: 'user-1',
      status: 'uploading',
      progress: 0,
      error_message: null,
      result_message_id: null,
    }]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/dub/12345678-1234-1234-1234-123456789012'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('uploading');
    expect(data.progress).toBe(0);
  });
});
