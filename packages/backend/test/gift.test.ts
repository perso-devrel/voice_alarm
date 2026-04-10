import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '../src/types';
import { createMockDB, fakeAuthMiddleware, jsonReq } from './helpers';

const mockDB = createMockDB();

vi.mock('../src/lib/db', () => ({
  getDB: () => mockDB.client,
}));

import giftRoutes from '../src/routes/gift';

function buildApp(userId = 'user-1') {
  const app = new Hono<AppEnv>();
  app.use('*', fakeAuthMiddleware(userId));
  app.route('/gift', giftRoutes);
  return app;
}

beforeEach(() => {
  mockDB.calls.length = 0;
});

describe('POST /gift — 선물 보내기', () => {
  it('이메일 누락이면 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/gift', { message_id: 'm-1' }));
    expect(res.status).toBe(400);
  });

  it('message_id 누락이면 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/gift', { recipient_email: 'b@test.com' }));
    expect(res.status).toBe(400);
  });

  it('메모 200자 초과면 400', async () => {
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/gift', {
        recipient_email: 'b@test.com',
        message_id: 'm-1',
        note: 'x'.repeat(201),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('받는 사람이 존재하지 않으면 404', async () => {
    mockDB.pushResult([]); // recipient lookup
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/gift', { recipient_email: 'nobody@test.com', message_id: 'm-1' }),
    );
    expect(res.status).toBe(404);
  });

  it('자기 자신에게 선물하면 400', async () => {
    mockDB.pushResult([{ google_id: 'user-1' }]);
    const app = buildApp('user-1');
    const res = await app.request(
      jsonReq('POST', '/gift', { recipient_email: 'me@test.com', message_id: 'm-1' }),
    );
    expect(res.status).toBe(400);
  });

  it('친구가 아니면 403', async () => {
    mockDB.pushResult([{ google_id: 'user-2' }]); // recipient exists
    mockDB.pushResult([]); // areFriends returns false
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/gift', { recipient_email: 'b@test.com', message_id: 'm-1' }),
    );
    expect(res.status).toBe(403);
  });

  it('메시지가 존재하지 않으면 404', async () => {
    mockDB.pushResult([{ google_id: 'user-2' }]); // recipient
    mockDB.pushResult([{ id: 'f-1' }]); // areFriends
    mockDB.pushResult([]); // message lookup
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/gift', { recipient_email: 'b@test.com', message_id: 'm-bad' }),
    );
    expect(res.status).toBe(404);
  });

  it('정상 선물이면 201', async () => {
    mockDB.pushResult([{ google_id: 'user-2' }]); // recipient
    mockDB.pushResult([{ id: 'f-1' }]); // areFriends
    mockDB.pushResult([{ id: 'm-1' }]); // message exists
    mockDB.pushResult([], 1); // insert gift
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/gift', { recipient_email: 'b@test.com', message_id: 'm-1' }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.gift.status).toBe('pending');
    expect(body.gift.message_id).toBe('m-1');
  });
});

describe('GET /gift/received — 받은 선물', () => {
  it('빈 목록 반환', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/gift/received'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.gifts).toEqual([]);
  });
});

describe('GET /gift/sent — 보낸 선물', () => {
  it('빈 목록 반환', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/gift/sent'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.gifts).toEqual([]);
  });
});

describe('PATCH /gift/:id/accept — 수락', () => {
  it('존재하지 않으면 404', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.request(jsonReq('PATCH', '/gift/g-999/accept'));
    expect(res.status).toBe(404);
  });

  it('정상 수락 — 라이브러리에도 추가', async () => {
    mockDB.pushResult([{ id: 'g-1', message_id: 'm-1' }]); // existing pending
    mockDB.pushResult([], 1); // update gift status
    mockDB.pushResult([], 1); // insert message_library
    const app = buildApp();
    const res = await app.request(jsonReq('PATCH', '/gift/g-1/accept'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const libInsert = mockDB.calls.find((c) => c.sql.includes('message_library'));
    expect(libInsert).toBeDefined();
  });
});

describe('PATCH /gift/:id/reject — 거절', () => {
  it('존재하지 않으면 404', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.request(jsonReq('PATCH', '/gift/g-999/reject'));
    expect(res.status).toBe(404);
  });

  it('정상 거절', async () => {
    mockDB.pushResult([{ id: 'g-1' }]);
    mockDB.pushResult([], 1);
    const app = buildApp();
    const res = await app.request(jsonReq('PATCH', '/gift/g-1/reject'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
