import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB } from '../lib/db';
import {
  computeLevelFromXp,
  computeStageFromLevel,
  xpThresholdForLevel,
  type CharacterStage,
} from '../lib/character';
import { computeGrant, isXpEvent } from '../lib/xpRules';

const character = new Hono<AppEnv>();

interface CharacterRow {
  id: string;
  user_id: string;
  name: string;
  level: number;
  xp: number;
  affection: number;
  stage: CharacterStage;
  daily_xp: number;
  daily_xp_reset_at: string | null;
  created_at: string;
  updated_at: string;
}

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

function rowToCharacter(row: Record<string, unknown>): CharacterRow {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name ?? '내 캐릭터'),
    level: Number(row.level ?? 1),
    xp: Number(row.xp ?? 0),
    affection: Number(row.affection ?? 0),
    stage: (row.stage as CharacterStage) ?? 'seed',
    daily_xp: Number(row.daily_xp ?? 0),
    daily_xp_reset_at: (row.daily_xp_reset_at as string | null) ?? null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

async function loadOrCreateCharacter(
  db: ReturnType<typeof getDB>,
  userPk: string,
): Promise<CharacterRow> {
  const existing = await db.execute({
    sql: 'SELECT * FROM characters WHERE user_id = ?',
    args: [userPk],
  });
  if (existing.rows.length > 0) {
    return rowToCharacter(existing.rows[0] as Record<string, unknown>);
  }
  const id = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO characters (id, user_id, name, level, xp, affection, stage)
          VALUES (?, ?, ?, 1, 0, 0, 'seed')`,
    args: [id, userPk, '내 캐릭터'],
  });
  const created = await db.execute({
    sql: 'SELECT * FROM characters WHERE id = ?',
    args: [id],
  });
  return rowToCharacter(created.rows[0] as Record<string, unknown>);
}

function buildProgress(xp: number, level: number) {
  const current = xpThresholdForLevel(level);
  const next = xpThresholdForLevel(level + 1);
  const span = Math.max(next - current, 1);
  const into = Math.max(xp - current, 0);
  return {
    xp_into_level: into,
    xp_to_next_level: Math.max(next - xp, 0),
    level_span: next - current,
    progress_ratio: Math.min(into / span, 1),
  };
}

function serializeCharacter(row: CharacterRow) {
  const level = computeLevelFromXp(row.xp);
  const stage = computeStageFromLevel(level);
  return {
    character: { ...row, level, stage },
    progress: buildProgress(row.xp, level),
  };
}

function todayString(now: Date = new Date()): string {
  return now.toISOString().split('T')[0];
}

/**
 * GET /characters/me
 * 현재 사용자의 캐릭터를 반환. 없으면 기본값(level=1, xp=0, stage='seed') 으로 생성.
 */
character.get('/me', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const userPk = await resolveUserPk(db, userId);
  if (!userPk) return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);

  const row = await loadOrCreateCharacter(db, userPk);
  return c.json(serializeCharacter(row));
});

/**
 * POST /characters/xp { event, client_nonce? }
 * 이벤트별 XP·애정도 지급. client_nonce 가 있으면 멱등 (중복 호출 시 기존 결과 반환).
 * 날짜가 바뀌면 daily_xp 리셋 후 재산정.
 */
character.post('/xp', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const body = await c.req
    .json<{ event?: unknown; client_nonce?: unknown }>()
    .catch(() => ({ event: undefined, client_nonce: undefined }));

  if (!isXpEvent(body.event)) {
    return c.json({ error: '지원하지 않는 event 입니다' }, 400);
  }
  const event = body.event;
  const clientNonce =
    typeof body.client_nonce === 'string' && body.client_nonce.trim().length > 0
      ? body.client_nonce.trim()
      : null;

  const userPk = await resolveUserPk(db, userId);
  if (!userPk) return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);

  // 멱등성: 동일 client_nonce 로 이미 지급된 로그가 있으면 그대로 재응답.
  if (clientNonce) {
    const dup = await db.execute({
      sql: `SELECT l.* FROM character_xp_logs l
            JOIN characters c ON c.id = l.character_id
            WHERE c.user_id = ? AND l.client_nonce = ?
            LIMIT 1`,
      args: [userPk, clientNonce],
    });
    if (dup.rows.length > 0) {
      const log = dup.rows[0] as Record<string, unknown>;
      const row = await loadOrCreateCharacter(db, userPk);
      const serialized = serializeCharacter(row);
      return c.json({
        ...serialized,
        grant: {
          event: String(log.event),
          granted_xp: Number(log.granted_xp ?? 0),
          affection: Number(log.affection_delta ?? 0),
          capped: Number(log.capped ?? 0) === 1,
          remaining_cap: 0,
          duplicated: true,
        },
      });
    }
  }

  const today = todayString();
  const current = await loadOrCreateCharacter(db, userPk);
  const dailyXpBase =
    current.daily_xp_reset_at === today ? current.daily_xp : 0;

  const grant = computeGrant(event, dailyXpBase);
  const newXp = current.xp + grant.xp.grantedXp;
  const newAffection = current.affection + grant.affection;
  const newDailyXp = dailyXpBase + grant.xp.grantedXp;
  const newLevel = computeLevelFromXp(newXp);
  const newStage = computeStageFromLevel(newLevel);

  await db.execute({
    sql: `UPDATE characters
          SET xp = ?, affection = ?, level = ?, stage = ?,
              daily_xp = ?, daily_xp_reset_at = ?,
              updated_at = datetime('now')
          WHERE id = ?`,
    args: [newXp, newAffection, newLevel, newStage, newDailyXp, today, current.id],
  });

  const logId = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO character_xp_logs
          (id, character_id, event, client_nonce, granted_xp, affection_delta, capped)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      logId,
      current.id,
      event,
      clientNonce,
      grant.xp.grantedXp,
      grant.affection,
      grant.xp.capped ? 1 : 0,
    ],
  });

  const refreshed = await loadOrCreateCharacter(db, userPk);
  const serialized = serializeCharacter(refreshed);
  return c.json(
    {
      ...serialized,
      grant: {
        event,
        granted_xp: grant.xp.grantedXp,
        affection: grant.affection,
        capped: grant.xp.capped,
        remaining_cap: grant.xp.remainingCap,
        duplicated: false,
      },
    },
    201,
  );
});

export default character;
