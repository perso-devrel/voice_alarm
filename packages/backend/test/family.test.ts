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

describe('GET /family/groups/current', () => {
  it('멤버십 + 멤버 목록 반환', async () => {
    mockDB.pushResult([{ id: 'user-member' }]);
    mockDB.pushResult([
      {
        id: 'group-1',
        owner_user_id: 'user-owner',
        plan_id: 'plan-family',
        max_members: 6,
        created_at: '2026-04-21T00:00:00.000Z',
        my_role: 'member',
      },
    ]);
    mockDB.pushResult([
      {
        id: 'm-owner',
        user_id: 'user-owner',
        role: 'owner',
        joined_at: '2026-04-21T00:00:00.000Z',
        email: 'owner@x.com',
        name: 'Owner',
        picture: null,
      },
      {
        id: 'm-mem',
        user_id: 'user-member',
        role: 'member',
        joined_at: '2026-04-21T00:05:00.000Z',
        email: 'm@x.com',
        name: 'Member',
        picture: null,
      },
    ]);

    const app = buildApp('google-member');
    const res = await app.request(jsonReq('GET', '/family/groups/current'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.group.id).toBe('group-1');
    expect(body.group.owner_user_id).toBe('user-owner');
    expect(body.role).toBe('member');
    expect(body.members).toHaveLength(2);
    expect(body.members[0].role).toBe('owner');
  });

  it('소속 그룹 없음 → null 응답', async () => {
    mockDB.pushResult([{ id: 'user-x' }]);
    mockDB.pushResult([]);
    const app = buildApp('google-x');
    const res = await app.request(jsonReq('GET', '/family/groups/current'));
    const body = await res.json();
    expect(body.group).toBeNull();
    expect(body.members).toEqual([]);
  });
});

describe('POST /family/groups/:groupId/leave', () => {
  it('member 탈퇴 → 200 + plan_group_members DELETE', async () => {
    mockDB.pushResult([{ id: 'user-member' }]);
    mockDB.pushResult([{ id: 'm-1', role: 'member' }]);
    mockDB.pushResult([], 1); // DELETE

    const app = buildApp('google-member');
    const res = await app.request(jsonReq('POST', '/family/groups/group-1/leave'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.left_group_id).toBe('group-1');

    const del = mockDB.calls.find((c) => c.sql.includes('DELETE FROM plan_group_members'));
    expect(del?.args[0]).toBe('m-1');
  });

  it('owner 가 탈퇴 시도 → 409 (양도/해체 먼저)', async () => {
    mockDB.pushResult([{ id: 'user-owner' }]);
    mockDB.pushResult([{ id: 'm-o', role: 'owner' }]);

    const app = buildApp('google-owner');
    const res = await app.request(jsonReq('POST', '/family/groups/group-1/leave'));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('소유자');
  });

  it('그룹 멤버 아님 → 403', async () => {
    mockDB.pushResult([{ id: 'user-x' }]);
    mockDB.pushResult([]);
    const app = buildApp('google-x');
    const res = await app.request(jsonReq('POST', '/family/groups/group-1/leave'));
    expect(res.status).toBe(403);
  });
});

describe('POST /family/groups/:groupId/transfer-ownership', () => {
  it('정상 양도 → 200, UPDATE 순서는 (owner→member) 먼저 후 (target→owner)', async () => {
    mockDB.pushResult([{ id: 'user-owner' }]);
    mockDB.pushResult([{ id: 'group-1', owner_user_id: 'user-owner' }]);
    mockDB.pushResult([{ id: 'm-target', role: 'member' }]);
    mockDB.pushResult([], 1); // UPDATE self → member
    mockDB.pushResult([], 1); // UPDATE target → owner
    mockDB.pushResult([], 1); // UPDATE plan_groups.owner_user_id

    const app = buildApp('google-owner');
    const res = await app.request(
      jsonReq('POST', '/family/groups/group-1/transfer-ownership', {
        target_user_id: 'user-target',
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.group.owner_user_id).toBe('user-target');
    expect(body.group.previous_owner_user_id).toBe('user-owner');

    const updates = mockDB.calls.filter((c) => c.sql.includes('UPDATE plan_group_members'));
    expect(updates).toHaveLength(2);
    // (1) 기존 owner 강등이 먼저
    expect(updates[0].sql).toContain("role = 'member'");
    expect(updates[0].args[1]).toBe('user-owner');
    // (2) target 승격이 나중
    expect(updates[1].sql).toContain("role = 'owner'");
    expect(updates[1].args[1]).toBe('user-target');

    const groupUpd = mockDB.calls.find((c) => c.sql.includes('UPDATE plan_groups SET owner_user_id'));
    expect(groupUpd?.args[0]).toBe('user-target');
  });

  it('target_user_id 누락 → 400', async () => {
    const app = buildApp('google-owner');
    const res = await app.request(
      jsonReq('POST', '/family/groups/group-1/transfer-ownership', {}),
    );
    expect(res.status).toBe(400);
  });

  it('self-양도 시도 → 400', async () => {
    mockDB.pushResult([{ id: 'user-owner' }]);
    const app = buildApp('google-owner');
    const res = await app.request(
      jsonReq('POST', '/family/groups/group-1/transfer-ownership', {
        target_user_id: 'user-owner',
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('자기');
  });

  it('owner 아님 → 403', async () => {
    mockDB.pushResult([{ id: 'user-other' }]);
    mockDB.pushResult([{ id: 'group-1', owner_user_id: 'user-owner' }]);
    const app = buildApp('google-other');
    const res = await app.request(
      jsonReq('POST', '/family/groups/group-1/transfer-ownership', {
        target_user_id: 'user-target',
      }),
    );
    expect(res.status).toBe(403);
  });

  it('target 이 그룹 멤버 아님 → 400', async () => {
    mockDB.pushResult([{ id: 'user-owner' }]);
    mockDB.pushResult([{ id: 'group-1', owner_user_id: 'user-owner' }]);
    mockDB.pushResult([]); // target 조회 empty
    const app = buildApp('google-owner');
    const res = await app.request(
      jsonReq('POST', '/family/groups/group-1/transfer-ownership', {
        target_user_id: 'user-target',
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('멤버');
  });
});

describe('DELETE /family/groups/:groupId/members/:userId', () => {
  it('owner 가 member 제거 → 200 + DELETE 호출', async () => {
    mockDB.pushResult([{ id: 'user-owner' }]);
    mockDB.pushResult([{ id: 'group-1', owner_user_id: 'user-owner' }]);
    mockDB.pushResult([{ id: 'm-target', role: 'member' }]);
    mockDB.pushResult([], 1);

    const app = buildApp('google-owner');
    const res = await app.request(
      new Request('http://localhost/family/groups/group-1/members/user-target', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.removed_user_id).toBe('user-target');
  });

  it('owner 본인 제거 시도 → 400', async () => {
    mockDB.pushResult([{ id: 'user-owner' }]);
    mockDB.pushResult([{ id: 'group-1', owner_user_id: 'user-owner' }]);
    const app = buildApp('google-owner');
    const res = await app.request(
      new Request('http://localhost/family/groups/group-1/members/user-owner', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('owner 아님 → 403', async () => {
    mockDB.pushResult([{ id: 'user-other' }]);
    mockDB.pushResult([{ id: 'group-1', owner_user_id: 'user-owner' }]);
    const app = buildApp('google-other');
    const res = await app.request(
      new Request('http://localhost/family/groups/group-1/members/user-target', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(403);
  });

  it('대상 owner 는 제거 불가 → 400', async () => {
    mockDB.pushResult([{ id: 'user-owner' }]);
    mockDB.pushResult([{ id: 'group-1', owner_user_id: 'user-owner' }]);
    mockDB.pushResult([{ id: 'm-x', role: 'owner' }]);
    const app = buildApp('google-owner');
    const res = await app.request(
      new Request('http://localhost/family/groups/group-1/members/user-co-owner', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(400);
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

describe('POST /family/alarms (text mode)', () => {
  function validBody(overrides: Record<string, unknown> = {}) {
    return {
      recipient_user_id: 'user-recipient',
      wake_at: '07:30',
      message_text: '일어나세요!',
      ...overrides,
    };
  }

  function queueHappyPath(opts: {
    senderPk?: string;
    recipientPk?: string;
    recipientGoogleId?: string;
    allowFamily?: number;
    voiceProfileId?: string | null;
  } = {}) {
    const senderPk = opts.senderPk ?? 'user-sender';
    const recipientPk = opts.recipientPk ?? 'user-recipient';
    const recipientGoogleId = opts.recipientGoogleId ?? 'google-recipient';
    const allow = opts.allowFamily ?? 1;
    mockDB.pushResult([{ id: senderPk }]); // resolve sender pk
    mockDB.pushResult([{ plan_group_id: 'group-1' }]); // sender groups
    mockDB.pushResult([{ plan_group_id: 'group-1' }]); // recipient groups
    mockDB.pushResult([
      { id: recipientPk, google_id: recipientGoogleId, allow_family_alarms: allow },
    ]); // recipient row
    if (opts.voiceProfileId === null) {
      mockDB.pushResult([]); // no voice profile
    } else {
      mockDB.pushResult([{ id: opts.voiceProfileId ?? 'vp-recipient-1' }]); // latest vp
    }
    mockDB.pushResult([], 1); // messages INSERT
    mockDB.pushResult([], 1); // alarms INSERT
  }

  it('정상 — 수신자 가장 최근 voice_profile 자동 선택', async () => {
    queueHappyPath();
    const app = buildApp('google-sender');
    const res = await app.request(jsonReq('POST', '/family/alarms', validBody({ repeat_days: [1, 3, 5] })));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.alarm.voice_profile_id).toBe('vp-recipient-1');
    expect(body.alarm.wake_at).toBe('07:30');
    expect(body.alarm.repeat_days).toEqual([1, 3, 5]);
    expect(body.message.text).toBe('일어나세요!');
    expect(body.message.category).toBe('family');

    const msgInsert = mockDB.calls.find((c) => c.sql.includes('INSERT INTO messages'));
    const alarmInsert = mockDB.calls.find((c) => c.sql.includes('INSERT INTO alarms'));
    expect(msgInsert).toBeDefined();
    expect(alarmInsert).toBeDefined();
    expect(msgInsert?.args[1]).toBe('user-recipient');
    expect(alarmInsert?.args[1]).toBe('google-sender');
    expect(alarmInsert?.args[2]).toBe('google-recipient');
  });

  it('정상 — voice_profile_id 명시하면 소유권 검증 후 사용', async () => {
    mockDB.pushResult([{ id: 'user-sender' }]);
    mockDB.pushResult([{ plan_group_id: 'group-1' }]);
    mockDB.pushResult([{ plan_group_id: 'group-1' }]);
    mockDB.pushResult([
      { id: 'user-recipient', google_id: 'google-recipient', allow_family_alarms: 1 },
    ]);
    mockDB.pushResult([{ id: 'vp-custom' }]); // voice_profile ownership check
    mockDB.pushResult([], 1);
    mockDB.pushResult([], 1);

    const app = buildApp('google-sender');
    const res = await app.request(
      jsonReq('POST', '/family/alarms', validBody({ voice_profile_id: 'vp-custom' })),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.alarm.voice_profile_id).toBe('vp-custom');
  });

  it('수신자 allow_family_alarms=0 → 403', async () => {
    queueHappyPath({ allowFamily: 0 });
    const app = buildApp('google-sender');
    const res = await app.request(jsonReq('POST', '/family/alarms', validBody()));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('허용');
  });

  it('송신자가 가족 그룹에 없으면 → 403', async () => {
    mockDB.pushResult([{ id: 'user-sender' }]); // sender pk
    mockDB.pushResult([]); // sender has no groups

    const app = buildApp('google-sender');
    const res = await app.request(jsonReq('POST', '/family/alarms', validBody()));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('가족 그룹');
  });

  it('송신자/수신자가 다른 그룹이면 → 403', async () => {
    mockDB.pushResult([{ id: 'user-sender' }]);
    mockDB.pushResult([{ plan_group_id: 'group-A' }]);
    mockDB.pushResult([{ plan_group_id: 'group-B' }]);

    const app = buildApp('google-sender');
    const res = await app.request(jsonReq('POST', '/family/alarms', validBody()));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('같은 가족');
  });

  it('수신자가 존재하지 않으면 → 404', async () => {
    mockDB.pushResult([{ id: 'user-sender' }]);
    mockDB.pushResult([{ plan_group_id: 'group-1' }]);
    mockDB.pushResult([{ plan_group_id: 'group-1' }]);
    mockDB.pushResult([]); // no user row

    const app = buildApp('google-sender');
    const res = await app.request(jsonReq('POST', '/family/alarms', validBody()));
    expect(res.status).toBe(404);
  });

  it('recipient_user_id 누락 → 400', async () => {
    const app = buildApp('google-sender');
    const res = await app.request(
      jsonReq('POST', '/family/alarms', { wake_at: '07:30', message_text: '안녕' }),
    );
    expect(res.status).toBe(400);
  });

  it('wake_at 포맷 오류 → 400', async () => {
    const app = buildApp('google-sender');
    const res = await app.request(
      jsonReq(
        'POST',
        '/family/alarms',
        validBody({ wake_at: '7:30 AM' }),
      ),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('HH:mm');
  });

  it('message_text 빈 문자열 → 400', async () => {
    const app = buildApp('google-sender');
    const res = await app.request(
      jsonReq('POST', '/family/alarms', validBody({ message_text: '   ' })),
    );
    expect(res.status).toBe(400);
  });

  it('message_text 500자 초과 → 400', async () => {
    const app = buildApp('google-sender');
    const long = 'a'.repeat(501);
    const res = await app.request(
      jsonReq('POST', '/family/alarms', validBody({ message_text: long })),
    );
    expect(res.status).toBe(400);
  });

  it('수신자에 voice_profile 이 없으면 → 400', async () => {
    queueHappyPath({ voiceProfileId: null });
    const app = buildApp('google-sender');
    const res = await app.request(jsonReq('POST', '/family/alarms', validBody()));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('음성 프로필');
  });

  it('자기 자신에게 보내면 → 400', async () => {
    mockDB.pushResult([{ id: 'user-recipient' }]); // sender pk == recipient pk
    const app = buildApp('google-recipient');
    const res = await app.request(
      jsonReq('POST', '/family/alarms', validBody()),
    );
    expect(res.status).toBe(400);
  });
});

describe('POST /family/alarms/voice', () => {
  function voiceBody(overrides: Record<string, unknown> = {}) {
    return {
      recipient_user_id: 'user-recipient',
      wake_at: '08:00',
      voice_upload_id: 'upload-1',
      ...overrides,
    };
  }

  function queueVoiceHappyPath(opts: {
    allowFamily?: number;
    dub?: boolean;
    noVoiceProfile?: boolean;
    uploadOwner?: string;
    uploadMissing?: boolean;
  } = {}) {
    mockDB.pushResult([{ id: 'user-sender' }]); // sender pk
    mockDB.pushResult([{ plan_group_id: 'group-1' }]); // sender groups
    mockDB.pushResult([{ plan_group_id: 'group-1' }]); // recipient groups
    mockDB.pushResult([
      {
        id: 'user-recipient',
        google_id: 'google-recipient',
        allow_family_alarms: opts.allowFamily ?? 1,
      },
    ]); // recipient
    if (opts.uploadMissing) {
      mockDB.pushResult([]); // upload missing
    } else {
      mockDB.pushResult([
        {
          id: 'upload-1',
          user_id: opts.uploadOwner ?? 'user-sender',
          object_key: 'uploads/alice/hi.m4a',
        },
      ]);
    }
    if (opts.noVoiceProfile) {
      mockDB.pushResult([]); // no profile
    } else {
      mockDB.pushResult([{ id: 'vp-recipient-1' }]);
    }
    mockDB.pushResult([], 1); // messages INSERT
    mockDB.pushResult([], 1); // alarms INSERT
    if (opts.dub) mockDB.pushResult([], 1); // dub_jobs INSERT
  }

  it('정상 — 더빙 없음, audio_url 에 object_key 채움', async () => {
    queueVoiceHappyPath();
    const app = buildApp('google-sender');
    const res = await app.request(jsonReq('POST', '/family/alarms/voice', voiceBody({ repeat_days: [0, 6] })));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.alarm.mode).toBe('sound-only');
    expect(body.alarm.voice_upload_id).toBe('upload-1');
    expect(body.alarm.repeat_days).toEqual([0, 6]);
    expect(body.message.audio_url).toBe('uploads/alice/hi.m4a');
    expect(body.message.category).toBe('family-voice');
    expect(body.message.text).toBe('가족이 보낸 음성');
    expect(body.dub_job).toBeNull();

    const msgInsert = mockDB.calls.find((c) => c.sql.includes('INSERT INTO messages'));
    const alarmInsert = mockDB.calls.find((c) => c.sql.includes('INSERT INTO alarms'));
    expect(msgInsert?.args[4]).toBe('uploads/alice/hi.m4a'); // audio_url
    expect(alarmInsert?.args[1]).toBe('google-sender');
    expect(alarmInsert?.args[2]).toBe('google-recipient');
  });

  it('정상 — 커스텀 label 허용', async () => {
    queueVoiceHappyPath();
    const app = buildApp('google-sender');
    const res = await app.request(
      jsonReq('POST', '/family/alarms/voice', voiceBody({ label: '엄마의 아침 인사' })),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message.text).toBe('엄마의 아침 인사');
  });

  it('정상 — dub_target_language 주면 dub_jobs INSERT + audio_url NULL', async () => {
    queueVoiceHappyPath({ dub: true });
    const app = buildApp('google-sender');
    const res = await app.request(
      jsonReq('POST', '/family/alarms/voice', voiceBody({ dub_target_language: 'en' })),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message.audio_url).toBeNull();
    expect(body.dub_job).toMatchObject({ target_language: 'en', status: 'processing' });
    expect(body.dub_job.id).toBeTruthy();

    const dubInsert = mockDB.calls.find((c) => c.sql.includes('INSERT INTO dub_jobs'));
    expect(dubInsert).toBeDefined();
    expect(dubInsert?.args[3]).toBe('en');
    expect(dubInsert?.args[4]).toBe(body.message.id); // result_message_id
  });

  it('dub_target_language 가 허용 목록 밖 → 400', async () => {
    const app = buildApp('google-sender');
    const res = await app.request(
      jsonReq('POST', '/family/alarms/voice', voiceBody({ dub_target_language: 'fr' })),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('dub_target_language');
  });

  it('수신자 allow_family_alarms=0 → 403', async () => {
    queueVoiceHappyPath({ allowFamily: 0 });
    const app = buildApp('google-sender');
    const res = await app.request(jsonReq('POST', '/family/alarms/voice', voiceBody()));
    expect(res.status).toBe(403);
  });

  it('voice_upload 이 송신자 소유가 아니면 → 400', async () => {
    queueVoiceHappyPath({ uploadOwner: 'user-other' });
    const app = buildApp('google-sender');
    const res = await app.request(jsonReq('POST', '/family/alarms/voice', voiceBody()));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('소유자');
  });

  it('voice_upload 이 없으면 → 400', async () => {
    queueVoiceHappyPath({ uploadMissing: true });
    const app = buildApp('google-sender');
    const res = await app.request(jsonReq('POST', '/family/alarms/voice', voiceBody()));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('음성 업로드');
  });

  it('수신자에 voice_profile 없으면 → 400', async () => {
    queueVoiceHappyPath({ noVoiceProfile: true });
    const app = buildApp('google-sender');
    const res = await app.request(jsonReq('POST', '/family/alarms/voice', voiceBody()));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('음성 프로필');
  });

  it('다른 그룹 수신자 → 403', async () => {
    mockDB.pushResult([{ id: 'user-sender' }]);
    mockDB.pushResult([{ plan_group_id: 'group-A' }]);
    mockDB.pushResult([{ plan_group_id: 'group-B' }]);
    const app = buildApp('google-sender');
    const res = await app.request(jsonReq('POST', '/family/alarms/voice', voiceBody()));
    expect(res.status).toBe(403);
  });

  it('wake_at 포맷 오류 → 400', async () => {
    const app = buildApp('google-sender');
    const res = await app.request(
      jsonReq('POST', '/family/alarms/voice', voiceBody({ wake_at: '25:00' })),
    );
    expect(res.status).toBe(400);
  });

  it('voice_upload_id 누락 → 400', async () => {
    const app = buildApp('google-sender');
    const res = await app.request(
      jsonReq('POST', '/family/alarms/voice', {
        recipient_user_id: 'user-recipient',
        wake_at: '08:00',
      }),
    );
    expect(res.status).toBe(400);
  });
});
