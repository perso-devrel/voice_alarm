import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '../src/types';
import { createMockDB, fakeAuthMiddleware, jsonReq } from './helpers';

const mockDB = createMockDB();

vi.mock('../src/lib/db', () => ({
  getDB: () => mockDB.client,
}));

import alarmRoutes from '../src/routes/alarm';

function buildApp(userId = 'user-1') {
  const app = new Hono<AppEnv>();
  app.use('*', fakeAuthMiddleware(userId));
  app.route('/alarm', alarmRoutes);
  return app;
}

beforeEach(() => {
  mockDB.calls.length = 0;
});

describe('GET /alarm — 알람 목록', () => {
  it('빈 목록 반환', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/alarm'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alarms).toEqual([]);
  });

  it('알람 목록 반환', async () => {
    mockDB.pushResult([
      { id: 'a-1', time: '07:00', is_active: 1, message_text: '좋은 아침!', category: 'morning', voice_name: 'Mom' },
    ]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/alarm'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alarms).toHaveLength(1);
    expect(body.alarms[0].time).toBe('07:00');
  });
});

describe('POST /alarm — 알람 생성', () => {
  it('message_id 누락이면 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/alarm', { time: '07:00' }));
    expect(res.status).toBe(400);
  });

  it('time 누락이면 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/alarm', { message_id: 'm-1' }));
    expect(res.status).toBe(400);
  });

  it('잘못된 time 형식이면 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/alarm', { message_id: 'm-1', time: '7pm' }));
    expect(res.status).toBe(400);
  });

  it('시간 범위 초과 (25:00) 면 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/alarm', { message_id: 'm-1', time: '25:00' }));
    expect(res.status).toBe(400);
  });

  it('잘못된 repeat_days 면 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/alarm', { message_id: 'm-1', time: '07:00', repeat_days: [7] }));
    expect(res.status).toBe(400);
  });

  it('snooze_minutes 범위 초과면 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/alarm', { message_id: 'm-1', time: '07:00', snooze_minutes: 60 }));
    expect(res.status).toBe(400);
  });

  it('target_user_id 에 친구가 아닌 사용자면 403', async () => {
    mockDB.pushResult([]); // friendship check
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/alarm', { message_id: 'm-1', time: '07:00', target_user_id: 'user-2' }));
    expect(res.status).toBe(403);
  });

  it('무료 플랜 알람 2개 초과면 403', async () => {
    // No target_user_id, skip friendship check
    mockDB.pushResult([{ plan: 'free' }]); // user plan
    mockDB.pushResult([{ count: 2 }]); // alarm count
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/alarm', { message_id: 'm-1', time: '07:00' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('무료 플랜');
  });

  it('메시지가 존재하지 않으면 404', async () => {
    mockDB.pushResult([{ plan: 'plus' }]); // user plan (not free, skip count)
    mockDB.pushResult([]); // message lookup
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/alarm', { message_id: 'm-bad', time: '07:00' }));
    expect(res.status).toBe(404);
  });

  it('정상 생성이면 201', async () => {
    mockDB.pushResult([{ plan: 'plus' }]); // user plan
    mockDB.pushResult([{ id: 'm-1' }]); // message exists
    mockDB.pushResult([], 1); // insert alarm
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/alarm', { message_id: 'm-1', time: '07:00', repeat_days: [1, 3, 5] }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.alarm.time).toBe('07:00');
    expect(body.alarm.repeat_days).toEqual([1, 3, 5]);
  });

  it('target_user_id 있고 친구이면 201', async () => {
    mockDB.pushResult([{ id: 'f-1' }]); // friendship exists
    mockDB.pushResult([{ plan: 'plus' }]); // target user plan
    mockDB.pushResult([{ id: 'm-1' }]); // message exists
    mockDB.pushResult([], 1); // insert
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/alarm', { message_id: 'm-1', time: '08:00', target_user_id: 'user-2' }));
    expect(res.status).toBe(201);
  });
});

describe('PATCH /alarm/:id — 알람 수정', () => {
  it('소유하지 않은 알람이면 404', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.request(jsonReq('PATCH', '/alarm/a-999', { time: '08:00' }));
    expect(res.status).toBe(404);
  });

  it('업데이트 필드가 없으면 400', async () => {
    mockDB.pushResult([{ id: 'a-1' }]);
    const app = buildApp();
    const res = await app.request(jsonReq('PATCH', '/alarm/a-1', {}));
    expect(res.status).toBe(400);
  });

  it('잘못된 time 형식이면 400', async () => {
    mockDB.pushResult([{ id: 'a-1' }]);
    const app = buildApp();
    const res = await app.request(jsonReq('PATCH', '/alarm/a-1', { time: 'bad' }));
    expect(res.status).toBe(400);
  });

  it('정상 수정', async () => {
    mockDB.pushResult([{ id: 'a-1' }]); // existing
    mockDB.pushResult([], 1); // update
    const app = buildApp();
    const res = await app.request(jsonReq('PATCH', '/alarm/a-1', { time: '09:30', is_active: false }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

describe('DELETE /alarm/:id — 알람 삭제', () => {
  it('존재하지 않으면 404', async () => {
    mockDB.pushResult([], 0);
    const app = buildApp();
    const res = await app.request(jsonReq('DELETE', '/alarm/a-999'));
    expect(res.status).toBe(404);
  });

  it('정상 삭제', async () => {
    mockDB.pushResult([], 1);
    const app = buildApp();
    const res = await app.request(jsonReq('DELETE', '/alarm/a-1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
