import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB } from '../lib/db';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const library = new Hono<AppEnv>();

/** 라이브러리 목록 조회 */
library.get('/', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const filter = c.req.query('filter');
  const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '20', 10) || 20, 1), 100);
  const offset = Math.max(parseInt(c.req.query('offset') || '0', 10) || 0, 0);

  let whereClause = 'WHERE ml.user_id = ?';
  const filterArgs: (string | number)[] = [userId];

  if (filter === 'favorite') {
    whereClause += ' AND ml.is_favorite = 1';
  } else if (filter?.startsWith('voice:')) {
    whereClause += ' AND m.voice_profile_id = ?';
    filterArgs.push(filter.slice(6));
  } else if (filter?.startsWith('date:')) {
    whereClause += ' AND date(ml.received_at) = ?';
    filterArgs.push(filter.slice(5));
  }

  const countSql = `SELECT COUNT(*) as total
             FROM message_library ml
             JOIN messages m ON ml.message_id = m.id
             ${whereClause}`;

  const dataSql = `SELECT ml.*, m.text, m.category, m.created_at as message_created_at,
             vp.name as voice_name, vp.avatar_url
             FROM message_library ml
             JOIN messages m ON ml.message_id = m.id
             JOIN voice_profiles vp ON m.voice_profile_id = vp.id
             ${whereClause}
             ORDER BY ml.received_at DESC
             LIMIT ? OFFSET ?`;

  const [countRes, result] = await Promise.all([
    db.execute({ sql: countSql, args: filterArgs }),
    db.execute({ sql: dataSql, args: [...filterArgs, limit, offset] }),
  ]);

  const total = Number(countRes.rows[0].total);
  return c.json({ items: result.rows, total, limit, offset });
});

/** 즐겨찾기 토글 */
library.patch('/:id/favorite', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const id = c.req.param('id');
  if (!UUID_RE.test(id)) {
    return c.json({ error: 'Invalid library item ID format' }, 400);
  }

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
