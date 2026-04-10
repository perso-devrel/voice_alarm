import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { PersoClient } from '../lib/perso';
import { ElevenLabsClient } from '../lib/elevenlabs';
import { getDB } from '../lib/db';

const tts = new Hono<AppEnv>();

/** TTS 생성 - 텍스트를 클론된 음성으로 변환 */
tts.post('/generate', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const body = await c.req.json<{
    voice_profile_id: string;
    text: string;
    category?: string;
    speed?: number;
    pitch?: number;
    provider?: 'perso' | 'elevenlabs';
  }>();

  if (!body.voice_profile_id || !body.text) {
    return c.json({ error: 'voice_profile_id and text are required' }, 400);
  }

  if (body.text.length > 200) {
    return c.json({ error: 'Text must be 200 characters or less' }, 400);
  }

  const validCategories = [
    'morning',
    'lunch',
    'afternoon',
    'evening',
    'night',
    'cheer',
    'love',
    'health',
    'custom',
  ];
  if (body.category && !validCategories.includes(body.category)) {
    return c.json(
      { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
      400,
    );
  }

  // 사용량 체크
  const user = await db.execute({
    sql: 'SELECT * FROM users WHERE google_id = ?',
    args: [userId],
  });

  if (user.rows.length > 0) {
    const u = user.rows[0];
    const plan = u.plan as string;
    const today = new Date().toISOString().split('T')[0];

    // 일일 리셋
    if (u.daily_tts_reset_at !== today) {
      await db.execute({
        sql: `UPDATE users SET daily_tts_count = 0, daily_tts_reset_at = ? WHERE google_id = ?`,
        args: [today, userId],
      });
    } else {
      const count = Number(u.daily_tts_count);
      const limits: Record<string, number> = { free: 3, plus: 9999, family: 9999 };
      if (count >= (limits[plan] ?? 3)) {
        return c.json(
          {
            error: '오늘의 TTS 생성 횟수를 초과했습니다. 업그레이드하면 무제한으로 사용 가능해요!',
          },
          429,
        );
      }
    }
  }

  // 음성 프로필 조회
  const profile = await db.execute({
    sql: 'SELECT * FROM voice_profiles WHERE id = ? AND user_id = ?',
    args: [body.voice_profile_id, userId],
  });

  if (profile.rows.length === 0) {
    return c.json({ error: 'Voice profile not found' }, 404);
  }

  const vp = profile.rows[0];
  if (vp.status !== 'ready') {
    return c.json({ error: 'Voice profile is not ready yet' }, 400);
  }

  try {
    let audioBuffer: ArrayBuffer;
    const provider = body.provider ?? (vp.perso_voice_id ? 'perso' : 'elevenlabs');

    if (provider === 'elevenlabs' && vp.elevenlabs_voice_id) {
      const client = new ElevenLabsClient(c.env.ELEVENLABS_API_KEY);
      audioBuffer = await client.textToSpeech(vp.elevenlabs_voice_id as string, body.text);
    } else if (vp.perso_voice_id) {
      const client = new PersoClient(c.env.PERSO_API_KEY);
      audioBuffer = await client.textToSpeech(vp.perso_voice_id as string, body.text, {
        speed: body.speed,
        pitch: body.pitch,
      });
    } else {
      return c.json({ error: 'No voice ID available for this profile' }, 400);
    }

    // 메시지 DB 저장
    const messageId = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO messages (id, user_id, voice_profile_id, text, category)
            VALUES (?, ?, ?, ?, ?)`,
      args: [messageId, userId, body.voice_profile_id, body.text, body.category ?? 'custom'],
    });

    // 사용량 증가
    await db.execute({
      sql: `UPDATE users SET daily_tts_count = daily_tts_count + 1 WHERE google_id = ?`,
      args: [userId],
    });

    // 라이브러리에도 추가
    await db.execute({
      sql: `INSERT INTO message_library (id, user_id, message_id) VALUES (?, ?, ?)`,
      args: [crypto.randomUUID(), userId, messageId],
    });

    // 오디오 데이터를 base64로 반환 (클라이언트에서 로컬 저장)
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    return c.json(
      {
        message_id: messageId,
        audio_base64: base64Audio,
        audio_format: 'mp3',
        text: body.text,
        voice_profile_id: body.voice_profile_id,
      },
      201,
    );
  } catch (err) {
    return c.json(
      {
        error: 'TTS generation failed',
        detail: err instanceof Error ? err.message : 'Unknown error',
      },
      500,
    );
  }
});

/** 메시지 목록 조회 */
tts.get('/messages', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);
  const category = c.req.query('category');

  let sql = `SELECT m.*, vp.name as voice_name
             FROM messages m
             JOIN voice_profiles vp ON m.voice_profile_id = vp.id
             WHERE m.user_id = ?`;
  const args: (string | number)[] = [userId];

  if (category) {
    sql += ' AND m.category = ?';
    args.push(category);
  }

  sql += ' ORDER BY m.created_at DESC';

  const result = await db.execute({ sql, args });
  return c.json({ messages: result.rows });
});

/** 프리셋 메시지 목록 */
tts.get('/presets', async (c) => {
  const presets = [
    {
      category: 'morning',
      emoji: '🌅',
      messages: [
        '좋은 아침이야, 오늘도 화이팅!',
        '일어나~ 오늘도 좋은 하루 보내자!',
        '굿모닝! 오늘 하루도 힘내!',
      ],
    },
    {
      category: 'lunch',
      emoji: '🍽️',
      messages: [
        '점심 잘 챙겨 먹어, 맛있는 거 먹어!',
        '밥 먹었어? 꼭 챙겨 먹어!',
        '점심시간이다! 맛있는 거 먹고 오후도 파이팅!',
      ],
    },
    {
      category: 'afternoon',
      emoji: '☕',
      messages: [
        '오후도 힘내, 조금만 더 파이팅!',
        '오후 슬럼프? 커피 한 잔 하고 힘내!',
        '조금만 더 하면 끝이야, 화이팅!',
      ],
    },
    {
      category: 'evening',
      emoji: '🌙',
      messages: [
        '오늘도 고생 많았어, 수고했어!',
        '퇴근 축하해! 오늘 하루도 잘 보냈어!',
        '고생했어, 이제 편하게 쉬어!',
      ],
    },
    {
      category: 'night',
      emoji: '😴',
      messages: [
        '오늘 하루도 잘 보냈어, 푹 자!',
        '잘 자, 좋은 꿈 꿔!',
        '내일도 좋은 하루 될 거야, 굿나잇!',
      ],
    },
    {
      category: 'cheer',
      emoji: '💪',
      messages: [
        '넌 할 수 있어, 믿어!',
        '힘들어도 포기하지 마, 항상 응원해!',
        '넌 정말 대단한 사람이야!',
      ],
    },
    {
      category: 'love',
      emoji: '❤️',
      messages: ['사랑해, 항상 고마워!', '네가 있어서 행복해!', '보고 싶어, 빨리 보자!'],
    },
    {
      category: 'health',
      emoji: '🏥',
      messages: ['약 챙겨 먹었어?', '물 많이 마셔! 건강 챙겨!', '오늘 스트레칭 했어? 몸 좀 풀어!'],
    },
  ];

  return c.json({ presets });
});

export default tts;
