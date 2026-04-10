import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '../src/types';
import { createMockDB, fakeAuthMiddleware, jsonReq, ID } from './helpers';

const V1 = '40000000-0000-4000-8000-000000000001';
const V404 = '40000000-0000-4000-8000-0000000000ff';

const mockDB = createMockDB();

vi.mock('../src/lib/db', () => ({
  getDB: () => mockDB.client,
}));

import voiceRoutes from '../src/routes/voice';

function buildApp(userId = 'user-1') {
  const app = new Hono<AppEnv>();
  app.use('*', fakeAuthMiddleware(userId));
  app.route('/voice', voiceRoutes);
  return app;
}

beforeEach(() => {
  mockDB.calls.length = 0;
});

describe('GET /voice — 음성 프로필 목록', () => {
  it('빈 목록 반환', async () => {
    mockDB.pushResult([{ total: 0 }]);
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/voice'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profiles).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it('프로필 목록 반환', async () => {
    mockDB.pushResult([{ total: 2 }]);
    mockDB.pushResult([
      { id: V1, name: 'Voice A', status: 'ready' },
      { id: V404, name: 'Voice B', status: 'processing' },
    ]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/voice'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profiles).toHaveLength(2);
    expect(body.total).toBe(2);
  });

  it('status 필터 적용', async () => {
    mockDB.pushResult([{ total: 1 }]);
    mockDB.pushResult([{ id: V1, name: 'Voice A', status: 'ready' }]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/voice?status=ready'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profiles).toHaveLength(1);
  });
});

describe('GET /voice/:id — 음성 프로필 상세', () => {
  it('잘못된 UUID 형식이면 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/voice/bad-id'));
    expect(res.status).toBe(400);
  });

  it('존재하지 않으면 404', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', `/voice/${V404}`));
    expect(res.status).toBe(404);
  });

  it('프로필 반환', async () => {
    mockDB.pushResult([{ id: V1, name: 'Voice A', status: 'ready' }]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', `/voice/${V1}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile.id).toBe(V1);
    expect(body.profile.name).toBe('Voice A');
  });
});

describe('GET /voice/:id/stats — 음성 프로필 통계', () => {
  it('잘못된 UUID 형식이면 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/voice/bad-id/stats'));
    expect(res.status).toBe(400);
  });

  it('존재하지 않으면 404', async () => {
    mockDB.pushResult([]);
    mockDB.pushResult([{ count: 0 }]);
    mockDB.pushResult([{ count: 0 }]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', `/voice/${V404}/stats`));
    expect(res.status).toBe(404);
  });

  it('통계 반환', async () => {
    mockDB.pushResult([{ id: V1, name: 'Voice A' }]);
    mockDB.pushResult([{ count: 5 }]);
    mockDB.pushResult([{ count: 3 }]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', `/voice/${V1}/stats`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.voice_profile_id).toBe(V1);
    expect(body.messages).toBe(5);
    expect(body.alarms).toBe(3);
  });
});

describe('DELETE /voice/:id — 음성 프로필 삭제', () => {
  it('잘못된 UUID 형식이면 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('DELETE', '/voice/bad-id'));
    expect(res.status).toBe(400);
  });

  it('존재하지 않으면 404', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.request(jsonReq('DELETE', `/voice/${V404}`));
    expect(res.status).toBe(404);
  });

  it('연관 메시지 있으면 409 경고', async () => {
    mockDB.pushResult([{ id: V1, name: 'Voice A', perso_voice_id: null, elevenlabs_voice_id: null }]);
    mockDB.pushResult([{ cnt: 3 }]);
    const app = buildApp();
    const res = await app.request(jsonReq('DELETE', `/voice/${V1}`));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.warning).toBe(true);
    expect(body.message_count).toBe(3);
  });

  it('force=true로 연관 메시지 있어도 삭제', async () => {
    mockDB.pushResult([{ id: V1, name: 'Voice A', perso_voice_id: null, elevenlabs_voice_id: null }]);
    mockDB.pushResult([{ cnt: 3 }]);
    mockDB.pushResult([], 1);
    const app = buildApp();
    const res = await app.request(jsonReq('DELETE', `/voice/${V1}?force=true`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('연관 메시지 없으면 바로 삭제', async () => {
    mockDB.pushResult([{ id: V1, name: 'Voice A', perso_voice_id: null, elevenlabs_voice_id: null }]);
    mockDB.pushResult([{ cnt: 0 }]);
    mockDB.pushResult([], 1);
    const app = buildApp();
    const res = await app.request(jsonReq('DELETE', `/voice/${V1}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
