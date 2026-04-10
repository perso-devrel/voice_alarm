import { Hono } from 'hono';
import type { Env } from '../types';
import { getDB } from '../lib/db';

const alarm = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

/** 알람 목록 조회 */
alarm.get('/', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const result = await db.execute({
    sql: `SELECT a.*, m.text as message_text, m.category, vp.name as voice_name
          FROM alarms a
          JOIN messages m ON a.message_id = m.id
          JOIN voice_profiles vp ON m.voice_profile_id = vp.id
          WHERE a.user_id = ?
          ORDER BY a.time ASC`,
    args: [userId],
  });

  return c.json({ alarms: result.rows });
});

/** 알람 생성 */
alarm.post('/', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const body = await c.req.json<{
    message_id: string;
    time: string; // HH:mm
    repeat_days?: number[];
    snooze_minutes?: number;
  }>();

  if (!body.message_id || !body.time) {
    return c.json({ error: 'message_id and time are required' }, 400);
  }

  // HH:mm 형식 검증
  if (!/^\d{2}:\d{2}$/.test(body.time)) {
    return c.json({ error: 'time must be in HH:mm format' }, 400);
  }

  // 무료 플랜 알람 개수 제한
  const user = await db.execute({
    sql: 'SELECT plan FROM users WHERE google_id = ?',
    args: [userId],
  });

  if (user.rows.length > 0 && user.rows[0].plan === 'free') {
    const alarmCount = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM alarms WHERE user_id = ?',
      args: [userId],
    });
    if (Number(alarmCount.rows[0].count) >= 2) {
      return c.json({ error: '무료 플랜은 최대 2개의 알람만 설정 가능합니다.' }, 403);
    }
  }

  // 메시지 소유 확인
  const msg = await db.execute({
    sql: 'SELECT id FROM messages WHERE id = ? AND user_id = ?',
    args: [body.message_id, userId],
  });
  if (msg.rows.length === 0) {
    return c.json({ error: 'Message not found' }, 404);
  }

  const alarmId = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO alarms (id, user_id, message_id, time, repeat_days, snooze_minutes)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      alarmId,
      userId,
      body.message_id,
      body.time,
      JSON.stringify(body.repeat_days ?? []),
      body.snooze_minutes ?? 5,
    ],
  });

  return c.json({ alarm: { id: alarmId, ...body } }, 201);
});

/** 알람 수정 */
alarm.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const id = c.req.param('id');

  const body = await c.req.json<{
    time?: string;
    repeat_days?: number[];
    is_active?: boolean;
    snooze_minutes?: number;
    message_id?: string;
  }>();

  // 알람 소유 확인
  const existing = await db.execute({
    sql: 'SELECT id FROM alarms WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });
  if (existing.rows.length === 0) {
    return c.json({ error: 'Alarm not found' }, 404);
  }

  const updates: string[] = [];
  const args: (string | number)[] = [];

  if (body.time !== undefined) {
    updates.push('time = ?');
    args.push(body.time);
  }
  if (body.repeat_days !== undefined) {
    updates.push('repeat_days = ?');
    args.push(JSON.stringify(body.repeat_days));
  }
  if (body.is_active !== undefined) {
    updates.push('is_active = ?');
    args.push(body.is_active ? 1 : 0);
  }
  if (body.snooze_minutes !== undefined) {
    updates.push('snooze_minutes = ?');
    args.push(body.snooze_minutes);
  }
  if (body.message_id !== undefined) {
    updates.push('message_id = ?');
    args.push(body.message_id);
  }

  if (updates.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  updates.push("updated_at = datetime('now')");
  args.push(id);

  await db.execute({
    sql: `UPDATE alarms SET ${updates.join(', ')} WHERE id = ?`,
    args,
  });

  return c.json({ success: true });
});

/** 알람 삭제 */
alarm.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const id = c.req.param('id');

  const result = await db.execute({
    sql: 'DELETE FROM alarms WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });

  if (result.rowsAffected === 0) {
    return c.json({ error: 'Alarm not found' }, 404);
  }

  return c.json({ success: true });
});

export default alarm;
