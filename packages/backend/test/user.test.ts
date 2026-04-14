import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '../src/types';
import { createMockDB, fakeAuthMiddleware, jsonReq } from './helpers';

const mockDB = createMockDB();

vi.mock('../src/lib/db', () => ({
  getDB: () => mockDB.client,
}));

import userRoutes from '../src/routes/user';

function buildApp(userId = 'user-1') {
  const app = new Hono<AppEnv>();
  app.use('*', fakeAuthMiddleware(userId));
  app.route('/user', userRoutes);
  return app;
}

beforeEach(() => {
  mockDB.calls.length = 0;
});

describe('GET /user/me', () => {
  it('기존 사용자 반환', async () => {
    mockDB.pushResult([{ id: 'u-1', google_id: 'user-1', email: 'user@test.com', name: 'Test', plan: 'free' }]);
    mockDB.pushResult([{ count: 3 }]);
    mockDB.pushResult([{ count: 2 }]);

    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/user/me'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.google_id).toBe('user-1');
    expect(body.stats.voice_profiles).toBe(3);
    expect(body.stats.alarms).toBe(2);
  });

  it('신규 사용자 자동 생성', async () => {
    mockDB.pushResult([]);
    mockDB.pushResult([], 1);
    mockDB.pushResult([{ id: 'new-id', google_id: 'user-1', email: 'user@test.com', name: 'Test', plan: 'free' }]);
    mockDB.pushResult([{ count: 0 }]);
    mockDB.pushResult([{ count: 0 }]);

    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/user/me'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.google_id).toBe('user-1');
    expect(mockDB.calls[1].sql).toContain('INSERT INTO users');
  });
});

describe('PATCH /user/plan', () => {
  it('유효한 플랜 변경', async () => {
    mockDB.pushResult([], 1);
    const app = buildApp();
    const res = await app.request(jsonReq('PATCH', '/user/plan', { plan: 'plus' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plan).toBe('plus');
  });

  it('잘못된 플랜 → 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('PATCH', '/user/plan', { plan: 'enterprise' }));
    expect(res.status).toBe(400);
  });

  it('존재하지 않는 사용자 → 404', async () => {
    mockDB.pushResult([], 0);
    const app = buildApp();
    const res = await app.request(jsonReq('PATCH', '/user/plan', { plan: 'free' }));
    expect(res.status).toBe(404);
  });
});

describe('GET /user/search', () => {
  it('검색어 2자 미만이면 빈 배열', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/user/search?q=a'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.users).toEqual([]);
  });

  it('이메일 검색 결과 반환', async () => {
    mockDB.pushResult([
      { google_id: 'u-2', email: 'friend@test.com', name: 'Friend', picture: '' },
    ]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/user/search?q=friend'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.users).toHaveLength(1);
    expect(body.users[0].email).toBe('friend@test.com');
  });

  it('자기 자신은 제외', async () => {
    mockDB.pushResult([
      { google_id: 'u-2', email: 'other@test.com', name: 'Other', picture: '' },
    ]);
    const app = buildApp();
    await app.request(jsonReq('GET', '/user/search?q=test'));
    expect(mockDB.calls[0].args[0]).toBe('user-1');
  });
});

describe('DELETE /user/me', () => {
  it('모든 관련 데이터 삭제 후 성공', async () => {
    for (let i = 0; i < 7; i++) mockDB.pushResult([], 1);
    const app = buildApp();
    const res = await app.request(jsonReq('DELETE', '/user/me'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const sqls = mockDB.calls.map((c) => c.sql);
    expect(sqls[0]).toContain('DELETE FROM alarms');
    expect(sqls[1]).toContain('DELETE FROM message_library');
    expect(sqls[2]).toContain('DELETE FROM messages');
    expect(sqls[3]).toContain('DELETE FROM voice_profiles');
    expect(sqls[4]).toContain('DELETE FROM friendships');
    expect(sqls[5]).toContain('DELETE FROM gifts');
    expect(sqls[6]).toContain('DELETE FROM users');
  });

  it('friendships/gifts는 양방향 삭제 (OR 조건)', async () => {
    for (let i = 0; i < 7; i++) mockDB.pushResult([], 0);
    const app = buildApp();
    await app.request(jsonReq('DELETE', '/user/me'));
    const friendshipCall = mockDB.calls[4];
    expect(friendshipCall.args).toEqual(['user-1', 'user-1']);
    const giftCall = mockDB.calls[5];
    expect(giftCall.args).toEqual(['user-1', 'user-1']);
  });
});
