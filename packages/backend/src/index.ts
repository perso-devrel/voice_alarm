import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, AppEnv } from './types';
import { authMiddleware } from './middleware/auth';
import { loggerMiddleware } from './middleware/logger';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { bodyLimitMiddleware } from './middleware/bodyLimit';
import { publicCache, privateCache, noStore } from './middleware/cache';
import { getDB, initDB } from './lib/db';
import voiceRoutes from './routes/voice';
import ttsRoutes from './routes/tts';
import alarmRoutes from './routes/alarm';
import userRoutes from './routes/user';
import libraryRoutes from './routes/library';
import friendRoutes from './routes/friend';
import giftRoutes from './routes/gift';
import statsRoutes from './routes/stats';

const app = new Hono<{ Bindings: Env }>();

// Structured request logging
app.use('*', loggerMiddleware);

// Rate limiting (per-isolate sliding window, 60 req/min)
app.use('*', rateLimitMiddleware);

// Body size limit (512 KB)
app.use('*', bodyLimitMiddleware);

// CORS
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8081',
  'exp://localhost:8081',
  'https://voice-alarm.pages.dev',
  'https://voicealarm.pages.dev',
];

app.use(
  '*',
  cors({
    origin: (origin) => (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);

// Health check with DB connectivity
app.get('/', async (c) => {
  let dbStatus: 'ok' | 'error' = 'error';
  try {
    const db = getDB(c.env);
    await db.execute('SELECT 1');
    dbStatus = 'ok';
  } catch {
    // DB unreachable — report but don't fail the health check
  }
  return c.json({
    name: 'VoiceAlarm API',
    version: '1.0.0',
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    db: dbStatus,
  });
});

// DB 초기화 엔드포인트
app.post('/api/init-db', async (c) => {
  try {
    await initDB(c.env);
    return c.json({ success: true, message: 'Database initialized' });
  } catch (err) {
    return c.json(
      {
        error: 'DB init failed',
        detail: err instanceof Error ? err.message : 'Unknown error',
      },
      500,
    );
  }
});

// 공개 라우트 (인증 불필요)
app.get('/api/tts/presets', publicCache, async (c) => {
  await import('./routes/tts');
  // 프리셋은 정적 데이터이므로 직접 반환
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

// 인증이 필요한 라우트들
const api = new Hono<AppEnv>();
api.use('*', authMiddleware);
api.use('*', rateLimitMiddleware);
api.use('*', async (c, next) => {
  const mw = c.req.method === 'GET' ? privateCache : noStore;
  return mw(c, next);
});
api.route('/voice', voiceRoutes);
api.route('/tts', ttsRoutes);
api.route('/alarm', alarmRoutes);
api.route('/user', userRoutes);
api.route('/library', libraryRoutes);
api.route('/friend', friendRoutes);
api.route('/gift', giftRoutes);
api.route('/stats', statsRoutes);

app.route('/api', api);

app.onError((err, c) => {
  const requestId = c.res.headers.get('X-Request-Id') ?? 'unknown';
  console.error(
    JSON.stringify({
      level: 'error',
      rid: requestId,
      method: c.req.method,
      path: c.req.path,
      error: err.message,
      stack: err.stack?.split('\n').slice(0, 5).join(' | '),
    }),
  );
  return c.json({ error: 'Internal server error', requestId }, 500);
});

export default app;
