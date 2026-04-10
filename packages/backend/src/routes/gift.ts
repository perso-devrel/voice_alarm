import { Hono } from 'hono';
import type { Env } from '../types';
import { getDB } from '../lib/db';

const gift = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

async function areFriends(db: any, userA: string, userB: string): Promise<boolean> {
  const result = await db.execute({
    sql: `SELECT id FROM friendships
          WHERE ((user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?))
            AND status = 'accepted'`,
    args: [userA, userB, userB, userA],
  });
  return result.rows.length > 0;
}

/** 선물 보내기 */
gift.post('/', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const body = await c.req.json<{
    recipient_email: string;
    message_id: string;
    note?: string;
  }>();

  if (!body.recipient_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.recipient_email)) {
    return c.json({ error: '유효한 이메일 주소를 입력해주세요.' }, 400);
  }
  if (!body.message_id) {
    return c.json({ error: 'message_id is required' }, 400);
  }
  if (body.note && body.note.length > 200) {
    return c.json({ error: '메모는 200자 이내로 작성해주세요.' }, 400);
  }

  const recipient = await db.execute({
    sql: 'SELECT google_id FROM users WHERE email = ?',
    args: [body.recipient_email],
  });

  if (recipient.rows.length === 0) {
    return c.json({ error: '받는 사람을 찾을 수 없습니다.' }, 404);
  }

  const recipientId = recipient.rows[0].google_id as string;

  if (recipientId === userId) {
    return c.json({ error: '자기 자신에게는 선물할 수 없습니다.' }, 400);
  }

  if (!(await areFriends(db, userId, recipientId))) {
    return c.json({ error: '친구 관계인 사용자에게만 선물할 수 있습니다.' }, 403);
  }

  const msg = await db.execute({
    sql: 'SELECT id FROM messages WHERE id = ? AND user_id = ?',
    args: [body.message_id, userId],
  });
  if (msg.rows.length === 0) {
    return c.json({ error: 'Message not found' }, 404);
  }

  const id = crypto.randomUUID();
  await db.execute({
    sql: 'INSERT INTO gifts (id, sender_id, recipient_id, message_id, status, note) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, userId, recipientId, body.message_id, 'pending', body.note ?? null],
  });

  return c.json({ gift: { id, message_id: body.message_id, status: 'pending' } }, 201);
});

/** 받은 선물 목록 */
gift.get('/received', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const result = await db.execute({
    sql: `SELECT g.*, m.text as message_text, m.audio_url, m.category,
            u.email as sender_email, u.name as sender_name, u.picture as sender_picture
          FROM gifts g
          JOIN messages m ON g.message_id = m.id
          JOIN users u ON u.google_id = g.sender_id
          WHERE g.recipient_id = ?
          ORDER BY g.created_at DESC`,
    args: [userId],
  });

  return c.json({ gifts: result.rows });
});

/** 보낸 선물 목록 */
gift.get('/sent', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const result = await db.execute({
    sql: `SELECT g.*, m.text as message_text, m.category,
            u.email as recipient_email, u.name as recipient_name
          FROM gifts g
          JOIN messages m ON g.message_id = m.id
          JOIN users u ON u.google_id = g.recipient_id
          WHERE g.sender_id = ?
          ORDER BY g.created_at DESC`,
    args: [userId],
  });

  return c.json({ gifts: result.rows });
});

/** 선물 수락 */
gift.patch('/:id/accept', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const id = c.req.param('id');

  const existing = await db.execute({
    sql: "SELECT id, message_id FROM gifts WHERE id = ? AND recipient_id = ? AND status = 'pending'",
    args: [id, userId],
  });

  if (existing.rows.length === 0) {
    return c.json({ error: 'Pending gift not found' }, 404);
  }

  await db.execute({
    sql: "UPDATE gifts SET status = 'accepted' WHERE id = ?",
    args: [id],
  });

  const libId = crypto.randomUUID();
  await db.execute({
    sql: 'INSERT INTO message_library (id, user_id, message_id) VALUES (?, ?, ?)',
    args: [libId, userId, existing.rows[0].message_id],
  });

  return c.json({ success: true });
});

/** 선물 거절 */
gift.patch('/:id/reject', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const id = c.req.param('id');

  const existing = await db.execute({
    sql: "SELECT id FROM gifts WHERE id = ? AND recipient_id = ? AND status = 'pending'",
    args: [id, userId],
  });

  if (existing.rows.length === 0) {
    return c.json({ error: 'Pending gift not found' }, 404);
  }

  await db.execute({
    sql: "UPDATE gifts SET status = 'rejected' WHERE id = ?",
    args: [id],
  });

  return c.json({ success: true });
});

export default gift;
