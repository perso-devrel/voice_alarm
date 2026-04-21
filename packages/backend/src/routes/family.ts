import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB } from '../lib/db';
import {
  generateInviteCode,
  isValidInviteCodeFormat,
  computeInviteExpiresAt,
  buildInviteDeepLink,
  buildInviteWebUrl,
} from '../lib/invites';

const family = new Hono<AppEnv>();

async function resolveUserPk(
  db: ReturnType<typeof getDB>,
  googleId: string,
): Promise<string | null> {
  const res = await db.execute({
    sql: 'SELECT id FROM users WHERE google_id = ?',
    args: [googleId],
  });
  return res.rows.length === 0 ? null : String(res.rows[0].id);
}

/**
 * POST /family/invites { plan_group_id? }
 * owner 가 자기 그룹에 pending 초대 1건 발급.
 * plan_group_id 생략 시 활성 가족 구독에서 자동 resolve.
 */
family.post('/invites', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const body = await c.req
    .json<{ plan_group_id?: unknown }>()
    .catch(() => ({ plan_group_id: undefined }));

  const userPk = await resolveUserPk(db, userId);
  if (!userPk) return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);

  let planGroupId =
    typeof body.plan_group_id === 'string' ? body.plan_group_id.trim() : '';

  if (!planGroupId) {
    const resolved = await db.execute({
      sql: `SELECT pg.id FROM plan_groups pg
            WHERE pg.owner_user_id = ?
            ORDER BY pg.created_at DESC
            LIMIT 1`,
      args: [userPk],
    });
    if (resolved.rows.length === 0) {
      return c.json({ error: '소유한 가족 플랜 그룹이 없습니다' }, 404);
    }
    planGroupId = String(resolved.rows[0].id);
  }

  const groupRes = await db.execute({
    sql: `SELECT id, owner_user_id, max_members FROM plan_groups WHERE id = ?`,
    args: [planGroupId],
  });
  if (groupRes.rows.length === 0) {
    return c.json({ error: '존재하지 않는 그룹입니다' }, 404);
  }
  const group = groupRes.rows[0];
  if (String(group.owner_user_id) !== userPk) {
    return c.json({ error: '그룹 소유자만 초대할 수 있습니다' }, 403);
  }
  const maxMembers = Number(group.max_members) || 6;

  const countRes = await db.execute({
    sql: `SELECT
            (SELECT COUNT(*) FROM plan_group_members WHERE plan_group_id = ?) AS member_count,
            (SELECT COUNT(*) FROM plan_group_invites
              WHERE plan_group_id = ? AND status = 'pending'
                AND expires_at > datetime('now')) AS pending_count`,
    args: [planGroupId, planGroupId],
  });
  const memberCount = Number(countRes.rows[0].member_count) || 0;
  const pendingCount = Number(countRes.rows[0].pending_count) || 0;
  if (memberCount + pendingCount >= maxMembers) {
    return c.json(
      { error: `정원 초과 (최대 ${maxMembers}명, 멤버 ${memberCount} + 대기 ${pendingCount})` },
      409,
    );
  }

  const inviteId = crypto.randomUUID();
  const code = generateInviteCode();
  const expiresAt = computeInviteExpiresAt();

  await db.execute({
    sql: `INSERT INTO plan_group_invites
          (id, plan_group_id, inviter_user_id, code, status, expires_at)
          VALUES (?, ?, ?, ?, 'pending', ?)`,
    args: [inviteId, planGroupId, userPk, code, expiresAt],
  });

  return c.json({
    invite: {
      id: inviteId,
      plan_group_id: planGroupId,
      code,
      status: 'pending',
      expires_at: expiresAt,
      deep_link: buildInviteDeepLink(code),
      web_url: buildInviteWebUrl(code),
    },
  });
});

/** GET /family/invites — owner 본인 그룹의 pending 초대 목록 */
family.get('/invites', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const userPk = await resolveUserPk(db, userId);
  if (!userPk) return c.json({ invites: [] });

  const result = await db.execute({
    sql: `SELECT i.id, i.plan_group_id, i.code, i.status, i.created_at, i.expires_at,
                 i.used_by_user_id, i.used_at
          FROM plan_group_invites i
          JOIN plan_groups pg ON pg.id = i.plan_group_id
          WHERE pg.owner_user_id = ?
          ORDER BY i.created_at DESC`,
    args: [userPk],
  });

  return c.json({
    invites: result.rows.map((r) => ({
      id: String(r.id),
      plan_group_id: String(r.plan_group_id),
      code: String(r.code),
      status: String(r.status),
      created_at: String(r.created_at),
      expires_at: String(r.expires_at),
      used_by_user_id: (r.used_by_user_id as string | null) ?? null,
      used_at: (r.used_at as string | null) ?? null,
      deep_link: buildInviteDeepLink(String(r.code)),
      web_url: buildInviteWebUrl(String(r.code)),
    })),
  });
});

/**
 * POST /family/invites/:code/accept
 * 수락 — 포맷/상태/만료/본인=발급자 여부/이미 멤버 여부 검증 후
 * plan_group_members role=member 추가 + invite.status='used'.
 */
family.post('/invites/:code/accept', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const code = c.req.param('code').trim();
  if (!isValidInviteCodeFormat(code)) {
    return c.json({ error: '잘못된 초대 코드 형식입니다' }, 400);
  }

  const userPk = await resolveUserPk(db, userId);
  if (!userPk) return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);

  const inviteRes = await db.execute({
    sql: `SELECT id, plan_group_id, inviter_user_id, status, expires_at
          FROM plan_group_invites WHERE code = ?`,
    args: [code],
  });
  if (inviteRes.rows.length === 0) {
    return c.json({ error: '해당 초대 코드를 찾을 수 없습니다' }, 404);
  }
  const invite = inviteRes.rows[0];
  const inviteId = String(invite.id);
  const planGroupId = String(invite.plan_group_id);
  const inviterUserId = String(invite.inviter_user_id);
  const status = String(invite.status);

  if (status === 'used') {
    return c.json({ error: '이미 사용된 초대 코드입니다' }, 409);
  }
  if (status === 'revoked') {
    return c.json({ error: '취소된 초대 코드입니다' }, 409);
  }
  if (status === 'expired') {
    return c.json({ error: '만료된 초대 코드입니다' }, 409);
  }

  const now = new Date();
  const expiresAt = new Date(String(invite.expires_at));
  if (Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() <= now.getTime()) {
    await db.execute({
      sql: `UPDATE plan_group_invites SET status = 'expired' WHERE id = ?`,
      args: [inviteId],
    });
    return c.json({ error: '만료된 초대 코드입니다' }, 409);
  }

  if (inviterUserId === userPk) {
    return c.json({ error: '본인이 발급한 초대는 수락할 수 없습니다' }, 400);
  }

  // 이미 해당 그룹 멤버인지 확인
  const memberRes = await db.execute({
    sql: `SELECT id FROM plan_group_members WHERE plan_group_id = ? AND user_id = ?`,
    args: [planGroupId, userPk],
  });
  if (memberRes.rows.length > 0) {
    return c.json({ error: '이미 해당 그룹 멤버입니다' }, 409);
  }

  // 정원 재확인
  const groupRes = await db.execute({
    sql: `SELECT max_members FROM plan_groups WHERE id = ?`,
    args: [planGroupId],
  });
  if (groupRes.rows.length === 0) {
    return c.json({ error: '존재하지 않는 그룹입니다' }, 404);
  }
  const maxMembers = Number(groupRes.rows[0].max_members) || 6;
  const countRes = await db.execute({
    sql: `SELECT COUNT(*) AS c FROM plan_group_members WHERE plan_group_id = ?`,
    args: [planGroupId],
  });
  const memberCount = Number(countRes.rows[0].c) || 0;
  if (memberCount >= maxMembers) {
    return c.json({ error: `정원 초과 (최대 ${maxMembers}명)` }, 409);
  }

  const memberId = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO plan_group_members (id, plan_group_id, user_id, role)
          VALUES (?, ?, ?, 'member')`,
    args: [memberId, planGroupId, userPk],
  });

  await db.execute({
    sql: `UPDATE plan_group_invites
          SET status = 'used', used_by_user_id = ?, used_at = ?
          WHERE id = ? AND status = 'pending'`,
    args: [userPk, now.toISOString(), inviteId],
  });

  return c.json({
    success: true,
    membership: {
      id: memberId,
      plan_group_id: planGroupId,
      user_id: userPk,
      role: 'member',
    },
    invite: { id: inviteId, status: 'used' },
  });
});

/** POST /family/invites/:code/revoke — 발급자(owner)만, pending 상태만 */
family.post('/invites/:code/revoke', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const code = c.req.param('code').trim();
  if (!isValidInviteCodeFormat(code)) {
    return c.json({ error: '잘못된 초대 코드 형식입니다' }, 400);
  }

  const userPk = await resolveUserPk(db, userId);
  if (!userPk) return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);

  const inviteRes = await db.execute({
    sql: `SELECT id, inviter_user_id, status FROM plan_group_invites WHERE code = ?`,
    args: [code],
  });
  if (inviteRes.rows.length === 0) {
    return c.json({ error: '해당 초대 코드를 찾을 수 없습니다' }, 404);
  }
  const invite = inviteRes.rows[0];
  if (String(invite.inviter_user_id) !== userPk) {
    return c.json({ error: '발급자만 취소할 수 있습니다' }, 403);
  }
  if (String(invite.status) !== 'pending') {
    return c.json({ error: 'pending 상태의 초대만 취소할 수 있습니다' }, 409);
  }

  await db.execute({
    sql: `UPDATE plan_group_invites SET status = 'revoked' WHERE id = ?`,
    args: [String(invite.id)],
  });

  return c.json({ success: true, invite: { id: String(invite.id), status: 'revoked' } });
});

/** GET /family/groups/current — 내가 속한 가족 그룹 + 멤버 목록 + 내 role */
family.get('/groups/current', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const userPk = await resolveUserPk(db, userId);
  if (!userPk) return c.json({ group: null, members: [], role: null });

  const groupRes = await db.execute({
    sql: `SELECT pg.id, pg.owner_user_id, pg.plan_id, pg.max_members, pg.created_at,
                 m.role AS my_role
          FROM plan_group_members m
          JOIN plan_groups pg ON pg.id = m.plan_group_id
          WHERE m.user_id = ?
          ORDER BY m.joined_at DESC
          LIMIT 1`,
    args: [userPk],
  });
  if (groupRes.rows.length === 0) {
    return c.json({ group: null, members: [], role: null });
  }
  const g = groupRes.rows[0];
  const groupId = String(g.id);

  const membersRes = await db.execute({
    sql: `SELECT m.id, m.user_id, m.role, m.joined_at,
                 u.email, u.name, u.picture
          FROM plan_group_members m
          LEFT JOIN users u ON u.id = m.user_id
          WHERE m.plan_group_id = ?
          ORDER BY CASE m.role WHEN 'owner' THEN 0 ELSE 1 END, m.joined_at ASC`,
    args: [groupId],
  });

  return c.json({
    group: {
      id: groupId,
      owner_user_id: String(g.owner_user_id),
      plan_id: String(g.plan_id),
      max_members: Number(g.max_members),
      created_at: String(g.created_at),
    },
    role: String(g.my_role),
    members: membersRes.rows.map((r) => ({
      id: String(r.id),
      user_id: String(r.user_id),
      role: String(r.role),
      joined_at: String(r.joined_at),
      email: (r.email as string | null) ?? null,
      name: (r.name as string | null) ?? null,
      picture: (r.picture as string | null) ?? null,
    })),
  });
});

/** POST /family/groups/:groupId/leave — 멤버 자진 탈퇴 (owner 는 거부) */
family.post('/groups/:groupId/leave', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const groupId = c.req.param('groupId');

  const userPk = await resolveUserPk(db, userId);
  if (!userPk) return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);

  const memberRes = await db.execute({
    sql: `SELECT id, role FROM plan_group_members
          WHERE plan_group_id = ? AND user_id = ?`,
    args: [groupId, userPk],
  });
  if (memberRes.rows.length === 0) {
    return c.json({ error: '해당 그룹의 멤버가 아닙니다' }, 403);
  }
  const myRole = String(memberRes.rows[0].role);
  if (myRole === 'owner') {
    return c.json(
      { error: '소유자는 탈퇴할 수 없습니다. 먼저 권한을 양도하거나 그룹을 해체하세요' },
      409,
    );
  }

  await db.execute({
    sql: `DELETE FROM plan_group_members WHERE id = ?`,
    args: [String(memberRes.rows[0].id)],
  });

  return c.json({ success: true, left_group_id: groupId });
});

/**
 * POST /family/groups/:groupId/transfer-ownership { target_user_id }
 * owner 전용. target 은 동일 그룹의 member 여야 함.
 * two-step UPDATE: (1) 기존 owner → member 로 강등, (2) target → owner 승격.
 * 중간 상태에서 owner 0명 이 되지만 app-level 만의 제약이므로 허용.
 */
family.post('/groups/:groupId/transfer-ownership', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const groupId = c.req.param('groupId');

  const body = await c.req
    .json<{ target_user_id?: unknown }>()
    .catch(() => ({ target_user_id: undefined }));
  const targetUserId =
    typeof body.target_user_id === 'string' ? body.target_user_id.trim() : '';
  if (!targetUserId) {
    return c.json({ error: 'target_user_id 는 필수입니다' }, 400);
  }

  const userPk = await resolveUserPk(db, userId);
  if (!userPk) return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);

  if (targetUserId === userPk) {
    return c.json({ error: '자기 자신에게는 양도할 수 없습니다' }, 400);
  }

  const groupRes = await db.execute({
    sql: `SELECT id, owner_user_id FROM plan_groups WHERE id = ?`,
    args: [groupId],
  });
  if (groupRes.rows.length === 0) {
    return c.json({ error: '존재하지 않는 그룹입니다' }, 404);
  }
  if (String(groupRes.rows[0].owner_user_id) !== userPk) {
    return c.json({ error: '그룹 소유자만 양도할 수 있습니다' }, 403);
  }

  const targetMemberRes = await db.execute({
    sql: `SELECT id, role FROM plan_group_members
          WHERE plan_group_id = ? AND user_id = ?`,
    args: [groupId, targetUserId],
  });
  if (targetMemberRes.rows.length === 0) {
    return c.json({ error: '대상이 해당 그룹의 멤버가 아닙니다' }, 400);
  }

  // (1) 기존 owner → member 로 강등
  await db.execute({
    sql: `UPDATE plan_group_members SET role = 'member'
          WHERE plan_group_id = ? AND user_id = ?`,
    args: [groupId, userPk],
  });
  // (2) target → owner 승격
  await db.execute({
    sql: `UPDATE plan_group_members SET role = 'owner'
          WHERE plan_group_id = ? AND user_id = ?`,
    args: [groupId, targetUserId],
  });
  // (3) plan_groups.owner_user_id 갱신
  await db.execute({
    sql: `UPDATE plan_groups SET owner_user_id = ?, updated_at = datetime('now')
          WHERE id = ?`,
    args: [targetUserId, groupId],
  });

  return c.json({
    success: true,
    group: {
      id: groupId,
      owner_user_id: targetUserId,
      previous_owner_user_id: userPk,
    },
  });
});

/** DELETE /family/groups/:groupId/members/:userId — owner 가 멤버를 제거 */
family.delete('/groups/:groupId/members/:userId', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const groupId = c.req.param('groupId');
  const targetUserId = c.req.param('userId');

  const userPk = await resolveUserPk(db, userId);
  if (!userPk) return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);

  const groupRes = await db.execute({
    sql: `SELECT id, owner_user_id FROM plan_groups WHERE id = ?`,
    args: [groupId],
  });
  if (groupRes.rows.length === 0) {
    return c.json({ error: '존재하지 않는 그룹입니다' }, 404);
  }
  if (String(groupRes.rows[0].owner_user_id) !== userPk) {
    return c.json({ error: '그룹 소유자만 멤버를 제거할 수 있습니다' }, 403);
  }
  if (targetUserId === userPk) {
    return c.json({ error: '자기 자신은 제거할 수 없습니다 (탈퇴·양도 사용)' }, 400);
  }

  const targetRes = await db.execute({
    sql: `SELECT id, role FROM plan_group_members
          WHERE plan_group_id = ? AND user_id = ?`,
    args: [groupId, targetUserId],
  });
  if (targetRes.rows.length === 0) {
    return c.json({ error: '대상이 해당 그룹의 멤버가 아닙니다' }, 404);
  }
  if (String(targetRes.rows[0].role) === 'owner') {
    return c.json({ error: 'owner 는 제거할 수 없습니다' }, 400);
  }

  await db.execute({
    sql: `DELETE FROM plan_group_members WHERE id = ?`,
    args: [String(targetRes.rows[0].id)],
  });

  return c.json({ success: true, removed_user_id: targetUserId });
});

export default family;
