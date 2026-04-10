import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB } from '../lib/db';

const user = new Hono<AppEnv>();

user.get('/me', async (c) => {
  const userId = c.get('userId');
  const email = c.get('userEmail') || '';
  const name = c.get('userName') || '';
  const picture = c.get('userPicture') || '';
  const db = getDB(c.env);

  let result = await db.execute({
    sql: 'SELECT * FROM users WHERE google_id = ?',
    args: [userId],
  });

  if (result.rows.length === 0) {
    const id = crypto.randomUUID();
    const today = new Date().toISOString().split('T')[0];
    await db.execute({
      sql: `INSERT INTO users (id, google_id, email, name, picture, daily_tts_reset_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, userId, email, name, picture, today],
    });
    result = await db.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [id],
    });
  }

  const u = result.rows[0];
  const profileCount = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM voice_profiles WHERE user_id = ?',
    args: [userId],
  });
  const alarmCount = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM alarms WHERE user_id = ?',
    args: [userId],
  });

  return c.json({
    user: u,
    stats: {
      voice_profiles: Number(profileCount.rows[0].count),
      alarms: Number(alarmCount.rows[0].count),
    },
  });
});

user.patch('/plan', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const body = await c.req.json<{ plan: 'free' | 'plus' | 'family' }>();

  if (!['free', 'plus', 'family'].includes(body.plan)) {
    return c.json({ error: 'Invalid plan' }, 400);
  }

  await db.execute({
    sql: `UPDATE users SET plan = ?, updated_at = datetime('now') WHERE google_id = ?`,
    args: [body.plan, userId],
  });

  return c.json({ success: true, plan: body.plan });
});

export default user;
