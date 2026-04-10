import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { PersoClient } from '../lib/perso';
import { ElevenLabsClient } from '../lib/elevenlabs';
import { getDB } from '../lib/db';

const voice = new Hono<AppEnv>();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 음성 프로필 목록 조회 */
voice.get('/', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '50', 10) || 50, 1), 100);
  const offset = Math.max(parseInt(c.req.query('offset') || '0', 10) || 0, 0);
  const status = c.req.query('status');

  const validStatuses = ['ready', 'processing', 'failed'];
  let statusClause = '';
  const baseArgs: (string | number)[] = [userId];
  if (status && validStatuses.includes(status)) {
    statusClause = ' AND status = ?';
    baseArgs.push(status);
  }

  const [countRes, result] = await Promise.all([
    db.execute({
      sql: `SELECT COUNT(*) as total FROM voice_profiles WHERE user_id = ?${statusClause}`,
      args: baseArgs,
    }),
    db.execute({
      sql: `SELECT * FROM voice_profiles WHERE user_id = ?${statusClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      args: [...baseArgs, limit, offset],
    }),
  ]);

  const total = Number(countRes.rows[0].total);
  return c.json({ profiles: result.rows, total, limit, offset });
});

/** 음성 프로필 상세 조회 */
voice.get('/:id', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const id = c.req.param('id');

  if (!UUID_RE.test(id)) {
    return c.json({ error: 'Invalid voice profile ID format' }, 400);
  }

  const result = await db.execute({
    sql: 'SELECT * FROM voice_profiles WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });

  if (result.rows.length === 0) {
    return c.json({ error: 'Voice profile not found' }, 404);
  }

  return c.json({ profile: result.rows[0] });
});

/** 음성 클론 생성 (오디오 업로드) */
voice.post('/clone', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  // 무료 플랜 제한 체크
  const user = await db.execute({
    sql: 'SELECT plan FROM users WHERE google_id = ?',
    args: [userId],
  });

  if (user.rows.length > 0) {
    const plan = user.rows[0].plan as string;
    const profileCount = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM voice_profiles WHERE user_id = ?',
      args: [userId],
    });
    const count = Number(profileCount.rows[0].count);

    const limits: Record<string, number> = { free: 1, plus: 3, family: 10 };
    if (count >= (limits[plan] ?? 1)) {
      return c.json(
        {
          error: `${plan} 플랜은 최대 ${limits[plan]}개의 음성 프로필을 지원합니다. 업그레이드해주세요.`,
        },
        403,
      );
    }
  }

  const formData = await c.req.formData();
  const audioFile = formData.get('audio') as unknown as File | null;
  const name = formData.get('name') as string | null;
  const provider = (formData.get('provider') as string) || 'perso';

  if (!audioFile || !name) {
    return c.json({ error: 'audio file and name are required' }, 400);
  }

  if (provider !== 'perso' && provider !== 'elevenlabs') {
    return c.json({ error: 'provider must be "perso" or "elevenlabs"' }, 400);
  }

  const audioBuffer = await audioFile.arrayBuffer();
  const profileId = crypto.randomUUID();

  // DB에 processing 상태로 먼저 저장
  await db.execute({
    sql: `INSERT INTO voice_profiles (id, user_id, name, status)
          VALUES (?, ?, ?, 'processing')`,
    args: [profileId, userId, name],
  });

  try {
    let voiceId: string;

    if (provider === 'elevenlabs') {
      const client = new ElevenLabsClient(c.env.ELEVENLABS_API_KEY);
      const result = await client.createInstantClone(audioBuffer, name);
      voiceId = result.voice_id;

      await db.execute({
        sql: `UPDATE voice_profiles SET elevenlabs_voice_id = ?, status = 'ready', updated_at = datetime('now')
              WHERE id = ?`,
        args: [voiceId, profileId],
      });
    } else {
      const client = new PersoClient(c.env.PERSO_API_KEY);
      const result = await client.createVoiceClone(audioBuffer, name);
      voiceId = result.voice_id;

      await db.execute({
        sql: `UPDATE voice_profiles SET perso_voice_id = ?, status = 'ready', updated_at = datetime('now')
              WHERE id = ?`,
        args: [voiceId, profileId],
      });
    }

    return c.json(
      {
        profile: {
          id: profileId,
          name,
          voice_id: voiceId,
          provider,
          status: 'ready',
        },
      },
      201,
    );
  } catch (err) {
    await db.execute({
      sql: `UPDATE voice_profiles SET status = 'failed', updated_at = datetime('now') WHERE id = ?`,
      args: [profileId],
    });

    return c.json(
      {
        error: 'Voice cloning failed',
        detail: err instanceof Error ? err.message : 'Unknown error',
        profile_id: profileId,
      },
      500,
    );
  }
});

/** 화자 분리 (Speaker Diarization) */
voice.post('/diarize', async (c) => {
  const formData = await c.req.formData();
  const audioFile = formData.get('audio') as unknown as File | null;

  if (!audioFile) {
    return c.json({ error: 'audio file is required' }, 400);
  }

  const audioBuffer = await audioFile.arrayBuffer();

  try {
    const client = new ElevenLabsClient(c.env.ELEVENLABS_API_KEY);
    const result = await client.diarize(audioBuffer);

    return c.json({
      speakers: result.speakers.map((s, i) => ({
        speaker_id: s.speaker_id,
        label: `화자 ${i + 1}`,
        segments: s.segments,
        total_duration: s.segments.reduce((sum, seg) => sum + (seg.end - seg.start), 0),
      })),
    });
  } catch (err) {
    return c.json(
      {
        error: 'Speaker diarization failed',
        detail: err instanceof Error ? err.message : 'Unknown error',
      },
      500,
    );
  }
});

/** 음성 프로필 통계 */
voice.get('/:id/stats', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const id = c.req.param('id');

  if (!UUID_RE.test(id)) {
    return c.json({ error: 'Invalid voice profile ID format' }, 400);
  }

  const [profileRes, msgRes, alarmRes] = await Promise.all([
    db.execute({
      sql: 'SELECT id, name FROM voice_profiles WHERE id = ? AND user_id = ?',
      args: [id, userId],
    }),
    db.execute({
      sql: 'SELECT COUNT(*) as count FROM messages WHERE voice_profile_id = ? AND user_id = ?',
      args: [id, userId],
    }),
    db.execute({
      sql: `SELECT COUNT(*) as count FROM alarms a
            JOIN messages m ON a.message_id = m.id
            WHERE m.voice_profile_id = ? AND (a.user_id = ? OR a.target_user_id = ?)`,
      args: [id, userId, userId],
    }),
  ]);

  if (profileRes.rows.length === 0) {
    return c.json({ error: 'Voice profile not found' }, 404);
  }

  return c.json({
    voice_profile_id: id,
    messages: Number((msgRes.rows[0] as Record<string, unknown>)?.count ?? 0),
    alarms: Number((alarmRes.rows[0] as Record<string, unknown>)?.count ?? 0),
  });
});

/** 음성 프로필 삭제 */
voice.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const id = c.req.param('id');

  if (!UUID_RE.test(id)) {
    return c.json({ error: 'Invalid voice profile ID format' }, 400);
  }

  const result = await db.execute({
    sql: 'SELECT * FROM voice_profiles WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });

  if (result.rows.length === 0) {
    return c.json({ error: 'Voice profile not found' }, 404);
  }

  const profile = result.rows[0];

  // 외부 API에서도 삭제
  try {
    if (profile.perso_voice_id) {
      const client = new PersoClient(c.env.PERSO_API_KEY);
      await client.deleteVoice(profile.perso_voice_id as string);
    }
    if (profile.elevenlabs_voice_id) {
      const client = new ElevenLabsClient(c.env.ELEVENLABS_API_KEY);
      await client.deleteVoice(profile.elevenlabs_voice_id as string);
    }
  } catch {
    // 외부 API 삭제 실패해도 로컬은 삭제 진행
  }

  await db.execute({
    sql: 'DELETE FROM voice_profiles WHERE id = ?',
    args: [id],
  });

  return c.json({ success: true });
});

export default voice;
