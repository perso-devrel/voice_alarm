import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '../src/types';
import { createMockDB, fakeAuthMiddleware, jsonReq } from './helpers';

const mockDB = createMockDB();

vi.mock('../src/lib/db', () => ({
  getDB: () => mockDB.client,
}));

import familyRoutes from '../src/routes/family';

function buildApp(userId = 'google-owner') {
  const app = new Hono<AppEnv>();
  app.use('*', fakeAuthMiddleware(userId));
  app.route('/family', familyRoutes);
  return app;
}

const FUTURE = '2027-12-31T00:00:00.000Z';
const PAST = '2020-01-01T00:00:00.000Z';
const VALID_CODE = '123456';

beforeEach(() => {
  mockDB.reset();
});

describe('POST /family/invites', () => {
  it('plan_group_id 생략 → owner 의 활성 그룹 자동 resolve, 초대 발급', async () => {
    mockDB.pushResult([{ id: 'user-owner' }]); // SELECT user
    mockDB.pushResult([{ id: 'group-1' }]); // resolve group
    mockDB.pushResult([{ id: 'group-1', owner_user_id: 'user-owner', max_members: 6 }]); // group lookup
    mockDB.pushResult([{ member_count: 1, pending_count: 0 }]); // counts
    mockDB.pushResult([], 1); // INSERT invite

    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/family/invites', {}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.invite.plan_group_id).toBe('group-1');
    expect(body.invite.status).toBe('pending');
    expect(body.invite.code).toMatch(/^[0-9]{6}$/);
    expect(body.invite.deep_link).toBe(`voicealarm://invite/${body.invite.code}`);
    expect(body.invite.web_url).toContain(body.invite.code);

    const insertInvite = mockDB.calls.find((c) =>
      c.sql.includes('INSERT INTO plan_group_invites'),
    );
    expect(insertInvite).toBeDefined();
    expect(insertInvite?.args[1]).toBe('group-1');
    expect(insertInvite?.args[2]).toBe('user-owner');
  });

  it('소유하지 않은 그룹 → 403', async () => {
    mockDB.pushResult([{ id: 'user-x' }]);
    mockDB.pushResult([{ id: 'group-1', owner_user_id: 'user-other', max_members: 6 }]);

    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/family/invites', { plan_group_id: 'group-1' }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('소유자');
  });

  it('정원 초과 (멤버 + pending 이 max_members 이상) → 409', async () => {
    mockDB.pushResult([{ id: 'user-owner' }]);
    mockDB.pushResult([{ id: 'group-1', owner_user_id: 'user-owner', max_members: 2 }]);
    mockDB.pushResult([{ member_count: 1, pending_count: 1 }]);

    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/family/invites', { plan_group_id: 'group-1' }),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('정원');
  });

  it('활성 가족 그룹이 없음 (plan_group_id 생략) → 404', async () => {
    mockDB.pushResult([{ id: 'user-owner' }]);
    mockDB.pushResult([]); // resolve group empty

    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/family/invites', {}));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('가족');
  });
});

describe('GET /family/invites', () => {
  it('owner 그룹의 초대 목록을 반환한다 (딥링크 포함)', async () => {
    mockDB.pushResult([{ id: 'user-owner' }]);
    mockDB.pushResult([
      {
        id: 'inv-1',
        plan_group_id: 'group-1',
        code: '111222',
        status: 'pending',
        created_at: '2026-04-21T00:00:00.000Z',
        expires_at: FUTURE,
        used_by_user_id: null,
        used_at: null,
      },
      {
        id: 'inv-2',
        plan_group_id: 'group-1',
        code: '333444',
        status: 'used',
        created_at: '2026-04-20T00:00:00.000Z',
        expires_at: FUTURE,
        used_by_user_id: 'user-member-1',
        used_at: '2026-04-20T00:05:00.000Z',
      },
    ]);

    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/family/invites'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.invites).toHaveLength(2);
    expect(body.invites[0].deep_link).toBe('voicealarm://invite/111222');
    expect(body.invites[1].used_by_user_id).toBe('user-member-1');
  });

  it('사용자 미등록 → 빈 배열', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/family/invites'));
    const body = await res.json();
    expect(body.invites).toEqual([]);
  });
});

describe('POST /family/invites/:code/accept', () => {
  it('유효 코드 → 200, 멤버 추가 + invite status=used', async () => {
    mockDB.pushResult([{ id: 'user-member' }]); // SELECT user
    mockDB.pushResult([
      {
        id: 'inv-1',
        plan_group_id: 'group-1',
        inviter_user_id: 'user-owner',
        status: 'pending',
        expires_at: FUTURE,
      },
    ]); // SELECT invite
    mockDB.pushResult([]); // member lookup (not yet a member)
    mockDB.pushResult([{ max_members: 6 }]); // group lookup
    mockDB.pushResult([{ c: 1 }]); // member count
    mockDB.pushResult([], 1); // INSERT member
    mockDB.pushResult([], 1); // UPDATE invite

    const app = buildApp('google-member');
    const res = await app.request(
      jsonReq('POST', `/family/invites/${VALID_CODE}/accept`),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.membership.plan_group_id).toBe('group-1');
    expect(body.membership.user_id).toBe('user-member');
    expect(body.membership.role).toBe('member');
    expect(body.invite.status).toBe('used');

    const insertMember = mockDB.calls.find((c) =>
      c.sql.includes('INSERT INTO plan_group_members'),
    );
    expect(insertMember?.args[1]).toBe('group-1');
    expect(insertMember?.args[2]).toBe('user-member');

    const updInvite = mockDB.calls.find((c) =>
      c.sql.includes('UPDATE plan_group_invites') && c.sql.includes("status = 'used'"),
    );
    expect(updInvite?.args[0]).toBe('user-member');
  });

  it('잘못된 포맷 → 400', async () => {
    const app = buildApp('google-member');
    const res = await app.request(jsonReq('POST', '/family/invites/12345/accept'));
    expect(res.status).toBe(400);
  });

  it('존재하지 않는 코드 → 404', async () => {
    mockDB.pushResult([{ id: 'user-member' }]);
    mockDB.pushResult([]);
    const app = buildApp('google-member');
    const res = await app.request(jsonReq('POST', `/family/invites/${VALID_CODE}/accept`));
    expect(res.status).toBe(404);
  });

  it('이미 used 상태 → 409', async () => {
    mockDB.pushResult([{ id: 'user-member' }]);
    mockDB.pushResult([
      {
        id: 'inv-1',
        plan_group_id: 'group-1',
        inviter_user_id: 'user-owner',
        status: 'used',
        expires_at: FUTURE,
      },
    ]);
    const app = buildApp('google-member');
    const res = await app.request(jsonReq('POST', `/family/invites/${VALID_CODE}/accept`));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('이미');
  });

  it('pending 인데 만료 시각 지남 → 409 + expired 자동 전환', async () => {
    mockDB.pushResult([{ id: 'user-member' }]);
    mockDB.pushResult([
      {
        id: 'inv-1',
        plan_group_id: 'group-1',
        inviter_user_id: 'user-owner',
        status: 'pending',
        expires_at: PAST,
      },
    ]);
    mockDB.pushResult([], 1); // UPDATE expired

    const app = buildApp('google-member');
    const res = await app.request(jsonReq('POST', `/family/invites/${VALID_CODE}/accept`));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('만료');
    const upd = mockDB.calls.find((c) =>
      c.sql.includes("UPDATE plan_group_invites SET status = 'expired'"),
    );
    expect(upd).toBeDefined();
  });

  it('본인이 발급한 초대 → 400', async () => {
    mockDB.pushResult([{ id: 'user-owner' }]);
    mockDB.pushResult([
      {
        id: 'inv-1',
        plan_group_id: 'group-1',
        inviter_user_id: 'user-owner',
        status: 'pending',
        expires_at: FUTURE,
      },
    ]);
    const app = buildApp('google-owner'); // same as inviter
    const res = await app.request(jsonReq('POST', `/family/invites/${VALID_CODE}/accept`));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('본인');
  });

  it('이미 해당 그룹 멤버 → 409', async () => {
    mockDB.pushResult([{ id: 'user-member' }]);
    mockDB.pushResult([
      {
        id: 'inv-1',
        plan_group_id: 'group-1',
        inviter_user_id: 'user-owner',
        status: 'pending',
        expires_at: FUTURE,
      },
    ]);
    mockDB.pushResult([{ id: 'existing-member' }]); // already member

    const app = buildApp('google-member');
    const res = await app.request(jsonReq('POST', `/family/invites/${VALID_CODE}/accept`));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('멤버');
  });

  it('그룹 정원 초과 → 409', async () => {
    mockDB.pushResult([{ id: 'user-member' }]);
    mockDB.pushResult([
      {
        id: 'inv-1',
        plan_group_id: 'group-1',
        inviter_user_id: 'user-owner',
        status: 'pending',
        expires_at: FUTURE,
      },
    ]);
    mockDB.pushResult([]);
    mockDB.pushResult([{ max_members: 2 }]);
    mockDB.pushResult([{ c: 2 }]);

    const app = buildApp('google-member');
    const res = await app.request(jsonReq('POST', `/family/invites/${VALID_CODE}/accept`));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('정원');
  });
});

describe('POST /family/invites/:code/revoke', () => {
  it('발급자 + pending → 200, status=revoked', async () => {
    mockDB.pushResult([{ id: 'user-owner' }]);
    mockDB.pushResult([
      { id: 'inv-1', inviter_user_id: 'user-owner', status: 'pending' },
    ]);
    mockDB.pushResult([], 1);

    const app = buildApp('google-owner');
    const res = await app.request(jsonReq('POST', `/family/invites/${VALID_CODE}/revoke`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.invite.status).toBe('revoked');
  });

  it('발급자가 아니면 → 403', async () => {
    mockDB.pushResult([{ id: 'user-other' }]);
    mockDB.pushResult([
      { id: 'inv-1', inviter_user_id: 'user-owner', status: 'pending' },
    ]);

    const app = buildApp('google-other');
    const res = await app.request(jsonReq('POST', `/family/invites/${VALID_CODE}/revoke`));
    expect(res.status).toBe(403);
  });

  it('pending 이 아닌 상태 (used 등) → 409', async () => {
    mockDB.pushResult([{ id: 'user-owner' }]);
    mockDB.pushResult([
      { id: 'inv-1', inviter_user_id: 'user-owner', status: 'used' },
    ]);

    const app = buildApp('google-owner');
    const res = await app.request(jsonReq('POST', `/family/invites/${VALID_CODE}/revoke`));
    expect(res.status).toBe(409);
  });
});
