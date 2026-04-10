import { Hono } from 'hono';
import type { Env } from '../types';
import { getDB } from '../lib/db';

const library = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

/** 라이브러리 목록 조회 */
library.get('/', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const filter = c.req.query('filter'); // 'favorite', 'voice:{id}', 'date:{yyyy-mm-dd}'

  let sql = `SELECT ml.*, m.text, m.category, m.created_at as message_created_at,
             vp.name as voice_name, vp.avatar_url
             FROM message_library ml
             JOIN messages m ON ml.message_id = m.id
             JOIN voice_profiles vp ON m.voice_profile_id = vp.id
             WHERE ml.user_id = ?`;
  const args: (string | number)[] = [userId];

  if (filter === 'favorite') {
    sql += ' AND ml.is_favorite = 1';
  } else if (filter?.startsWith('voice:')) {
    sql += ' AND m.voice_profile_id = ?';
    args.push(filter.slice(6));
  } else if (filter?.startsWith('date:')) {
    sql += ' AND date(ml.received_at) = ?';
    args.push(filter.slice(5));
  }

  sql += ' ORDER BY ml.received_at DESC';

  const result = await db.execute({ sql, args });
  return c.json({ items: result.rows });
});

/** 즐겨찾기 토글 */
library.patch('/:id/favorite', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const id = c.req.param('id');

  const result = await db.execute({
    sql: 'SELECT is_favorite FROM message_library WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });

  if (result.rows.length === 0) {
    return c.json({ error: 'Library item not found' }, 404);
  }

  const newValue = Number(result.rows[0].is_favorite) === 1 ? 0 : 1;
  await db.execute({
    sql: 'UPDATE message_library SET is_favorite = ? WHERE id = ?',
    args: [newValue, id],
  });

  return c.json({ is_favorite: newValue === 1 });
});

export default library;
