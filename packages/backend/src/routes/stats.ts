import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB } from '../lib/db';

const stats = new Hono<AppEnv>();

stats.get('/', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const [alarmsRes, messagesRes, voicesRes, friendsRes, giftsReceivedRes, giftsSentRes] =
    await Promise.all([
      db.execute({
        sql: `SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
              FROM alarms WHERE user_id = ? OR target_user_id = ?`,
        args: [userId, userId],
      }),
      db.execute({
        sql: 'SELECT COUNT(*) as total FROM messages WHERE user_id = ?',
        args: [userId],
      }),
      db.execute({
        sql: 'SELECT COUNT(*) as total FROM voice_profiles WHERE user_id = ?',
        args: [userId],
      }),
      db.execute({
        sql: `SELECT COUNT(*) as total FROM friendships
              WHERE (user_a = ? OR user_b = ?) AND status = 'accepted'`,
        args: [userId, userId],
      }),
      db.execute({
        sql: `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
              FROM gifts WHERE recipient_id = ?`,
        args: [userId],
      }),
      db.execute({
        sql: 'SELECT COUNT(*) as total FROM gifts WHERE sender_id = ?',
        args: [userId],
      }),
    ]);

  return c.json({
    alarms: {
      total: Number(alarmsRes.rows[0].total),
      active: Number(alarmsRes.rows[0].active),
    },
    messages: { total: Number(messagesRes.rows[0].total) },
    voices: { total: Number(voicesRes.rows[0].total) },
    friends: { total: Number(friendsRes.rows[0].total) },
    gifts: {
      received: Number(giftsReceivedRes.rows[0].total),
      receivedPending: Number(giftsReceivedRes.rows[0].pending),
      sent: Number(giftsSentRes.rows[0].total),
    },
  });
});

stats.get('/activity', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const [recentAlarms, recentMessages, recentGifts, recentVoices] = await Promise.all([
    db.execute({
      sql: `SELECT id, time, created_at, 'alarm' as type FROM alarms
            WHERE user_id = ? OR target_user_id = ?
            ORDER BY created_at DESC LIMIT 5`,
      args: [userId, userId],
    }),
    db.execute({
      sql: `SELECT id, text, created_at, 'message' as type FROM messages
            WHERE user_id = ?
            ORDER BY created_at DESC LIMIT 5`,
      args: [userId],
    }),
    db.execute({
      sql: `SELECT id, note, status, created_at, 'gift' as type FROM gifts
            WHERE sender_id = ? OR recipient_id = ?
            ORDER BY created_at DESC LIMIT 5`,
      args: [userId, userId],
    }),
    db.execute({
      sql: `SELECT id, name, status, created_at, 'voice' as type FROM voice_profiles
            WHERE user_id = ?
            ORDER BY created_at DESC LIMIT 5`,
      args: [userId],
    }),
  ]);

  const activities = [
    ...recentAlarms.rows.map((r) => ({
      id: r.id as string,
      type: 'alarm' as const,
      summary: `알람 ${r.time}`,
      created_at: r.created_at as string,
    })),
    ...recentMessages.rows.map((r) => ({
      id: r.id as string,
      type: 'message' as const,
      summary: String(r.text).slice(0, 50),
      created_at: r.created_at as string,
    })),
    ...recentGifts.rows.map((r) => ({
      id: r.id as string,
      type: 'gift' as const,
      summary: r.note ? String(r.note).slice(0, 50) : `선물 (${r.status})`,
      created_at: r.created_at as string,
    })),
    ...recentVoices.rows.map((r) => ({
      id: r.id as string,
      type: 'voice' as const,
      summary: `음성 "${r.name}" (${r.status})`,
      created_at: r.created_at as string,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
   .slice(0, 10);

  return c.json({ activities });
});

export default stats;
