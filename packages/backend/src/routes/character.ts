import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB } from '../lib/db';
import {
  computeLevelFromXp,
  computeStageFromLevel,
  xpThresholdForLevel,
  type CharacterStage,
} from '../lib/character';

const character = new Hono<AppEnv>();

interface CharacterRow {
  id: string;
  user_id: string;
  name: string;
  level: number;
  xp: number;
  affection: number;
  stage: CharacterStage;
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
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
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

/**
 * GET /characters/me
 * 현재 사용자의 캐릭터를 반환. 없으면 기본값(level=1, xp=0, stage='seed') 으로 생성.
 */
character.get('/me', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const userPk = await resolveUserPk(db, userId);
  if (!userPk) return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);

  const existing = await db.execute({
    sql: 'SELECT * FROM characters WHERE user_id = ?',
    args: [userPk],
  });

  let row: CharacterRow;
  if (existing.rows.length === 0) {
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
    row = rowToCharacter(created.rows[0] as Record<string, unknown>);
  } else {
    row = rowToCharacter(existing.rows[0] as Record<string, unknown>);
  }

  // 저장된 값이 헬퍼 결과와 다르면 신뢰할 수 있게 헬퍼 값으로 정규화해 노출.
  const level = computeLevelFromXp(row.xp);
  const stage = computeStageFromLevel(level);
  const progress = buildProgress(row.xp, level);

  return c.json({
    character: {
      ...row,
      level,
      stage,
    },
    progress,
  });
});

export default character;
