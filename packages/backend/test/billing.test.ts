import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '../src/types';
import { createMockDB, fakeAuthMiddleware, jsonReq } from './helpers';

const mockDB = createMockDB();

vi.mock('../src/lib/db', () => ({
  getDB: () => mockDB.client,
}));

import billingRoutes from '../src/routes/billing';

const PLAN_PLUS = {
  id: '70000000-0000-4000-8000-000000000002',
  key: 'plus_personal',
  name: '플러스 개인',
  plan_type: 'personal',
  period_days: 30,
  max_members: 1,
  price_krw: 4900,
  is_active: 1,
};

const PLAN_FAMILY = {
  id: '70000000-0000-4000-8000-000000000003',
  key: 'family',
  name: '가족',
  plan_type: 'family',
  period_days: 30,
  max_members: 6,
  price_krw: 9900,
  is_active: 1,
};

const PLAN_FREE = {
  id: '70000000-0000-4000-8000-000000000001',
  key: 'free',
  name: '무료',
  plan_type: 'free',
  period_days: 36500,
  max_members: 1,
  price_krw: 0,
  is_active: 1,
};

function buildApp(userId = 'google-1') {
  const app = new Hono<AppEnv>();
  app.use('*', fakeAuthMiddleware(userId));
  app.route('/billing', billingRoutes);
  return app;
}

beforeEach(() => {
  mockDB.reset();
});

describe('POST /billing/checkout', () => {
  it('plus_personal → 200, subscription 생성 + users.plan=plus', async () => {
    mockDB.pushResult([PLAN_PLUS]); // SELECT plan
    mockDB.pushResult([{ id: 'user-pk-1' }]); // SELECT user
    mockDB.pushResult([], 1); // INSERT subscription
    mockDB.pushResult([], 1); // UPDATE users.plan

    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/billing/checkout', { plan_key: 'plus_personal' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.checkout_stub).toBe(true);
    expect(body.subscription.status).toBe('active');
    expect(body.subscription.user_id).toBe('user-pk-1');
    expect(body.plan.key).toBe('plus_personal');
    expect(body.plan.price_krw).toBe(4900);

    const updateCall = mockDB.calls.find((c) => c.sql.includes('UPDATE users SET plan'));
    expect(updateCall?.args[0]).toBe('plus');
    expect(updateCall?.args[1]).toBe('user-pk-1');
  });

  it('family → 200, users.plan=family', async () => {
    mockDB.pushResult([PLAN_FAMILY]);
    mockDB.pushResult([{ id: 'user-pk-1' }]);
    mockDB.pushResult([], 1);
    mockDB.pushResult([], 1);

    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/billing/checkout', { plan_key: 'family' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plan.plan_type).toBe('family');
    const updateCall = mockDB.calls.find((c) => c.sql.includes('UPDATE users SET plan'));
    expect(updateCall?.args[0]).toBe('family');
  });

  it('subscription.expires_at 는 starts_at + period_days 후', async () => {
    mockDB.pushResult([PLAN_PLUS]);
    mockDB.pushResult([{ id: 'user-pk-1' }]);
    mockDB.pushResult([], 1);
    mockDB.pushResult([], 1);

    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/billing/checkout', { plan_key: 'plus_personal' }),
    );
    const body = await res.json();
    const starts = new Date(body.subscription.starts_at).getTime();
    const expires = new Date(body.subscription.expires_at).getTime();
    expect(expires - starts).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it('없는 plan_key → 400', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/billing/checkout', { plan_key: 'nonexistent' }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('존재하지 않는');
  });

  it('free plan_key → 400 (결제 대상 아님)', async () => {
    mockDB.pushResult([PLAN_FREE]);
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/billing/checkout', { plan_key: 'free' }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('free');
  });

  it('plan_key 미지정 → 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/billing/checkout', {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('plan_key');
  });

  it('비활성(is_active=0) 플랜 → 400', async () => {
    mockDB.pushResult([{ ...PLAN_PLUS, is_active: 0 }]);
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/billing/checkout', { plan_key: 'plus_personal' }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('비활성');
  });

  it('사용자 행 없음 → 404', async () => {
    mockDB.pushResult([PLAN_PLUS]);
    mockDB.pushResult([]); // no user
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/billing/checkout', { plan_key: 'plus_personal' }),
    );
    expect(res.status).toBe(404);
  });
});

describe('GET /billing/subscription', () => {
  it('활성 구독 있을 때 subscription + plan 반환', async () => {
    mockDB.pushResult([
      {
        sub_id: 'sub-1',
        user_id: 'user-pk-1',
        plan_id: PLAN_PLUS.id,
        plan_group_id: null,
        status: 'active',
        starts_at: '2026-04-21T00:00:00.000Z',
        expires_at: '2026-05-21T00:00:00.000Z',
        plan_key: 'plus_personal',
        plan_name: '플러스 개인',
        plan_type: 'personal',
        period_days: 30,
        max_members: 1,
        price_krw: 4900,
      },
    ]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/billing/subscription'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.subscription.id).toBe('sub-1');
    expect(body.subscription.status).toBe('active');
    expect(body.plan.key).toBe('plus_personal');
    expect(body.plan.max_members).toBe(1);
  });

  it('활성 구독 없을 때 { subscription: null, plan: null }', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/billing/subscription'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.subscription).toBeNull();
    expect(body.plan).toBeNull();
  });

  it('SQL 에 expires_at > datetime(now) 와 status active 조건 포함', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    await app.request(jsonReq('GET', '/billing/subscription'));
    const sql = mockDB.calls[0].sql;
    expect(sql).toContain("s.status = 'active'");
    expect(sql).toContain("s.expires_at > datetime('now')");
  });
});
