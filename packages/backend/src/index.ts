import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { authMiddleware } from './middleware/auth';
import { initDB } from './lib/db';
import voiceRoutes from './routes/voice';
import ttsRoutes from './routes/tts';
import alarmRoutes from './routes/alarm';
import userRoutes from './routes/user';
import libraryRoutes from './routes/library';

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:8081', 'exp://localhost:8081'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/', (c) => c.json({
  name: 'VoiceAlarm API',
  version: '1.0.0',
  status: 'ok',
}));

// DB 초기화 엔드포인트
app.post('/api/init-db', async (c) => {
  try {
    await initDB(c.env);
    return c.json({ success: true, message: 'Database initialized' });
  } catch (err) {
    return c.json({
      error: 'DB init failed',
      detail: err instanceof Error ? err.message : 'Unknown error',
    }, 500);
  }
});

// 공개 라우트 (인증 불필요)
app.get('/api/tts/presets', async (c) => {
  const tts = await import('./routes/tts');
  // 프리셋은 정적 데이터이므로 직접 반환
  const presets = [
    { category: 'morning', emoji: '🌅', messages: ['좋은 아침이야, 오늘도 화이팅!', '일어나~ 오늘도 좋은 하루 보내자!', '굿모닝! 오늘 하루도 힘내!'] },
    { category: 'lunch', emoji: '🍽️', messages: ['점심 잘 챙겨 먹어, 맛있는 거 먹어!', '밥 먹었어? 꼭 챙겨 먹어!', '점심시간이다! 맛있는 거 먹고 오후도 파이팅!'] },
    { category: 'afternoon', emoji: '☕', messages: ['오후도 힘내, 조금만 더 파이팅!', '오후 슬럼프? 커피 한 잔 하고 힘내!', '조금만 더 하면 끝이야, 화이팅!'] },
    { category: 'evening', emoji: '🌙', messages: ['오늘도 고생 많았어, 수고했어!', '퇴근 축하해! 오늘 하루도 잘 보냈어!', '고생했어, 이제 편하게 쉬어!'] },
    { category: 'night', emoji: '😴', messages: ['오늘 하루도 잘 보냈어, 푹 자!', '잘 자, 좋은 꿈 꿔!', '내일도 좋은 하루 될 거야, 굿나잇!'] },
    { category: 'cheer', emoji: '💪', messages: ['넌 할 수 있어, 믿어!', '힘들어도 포기하지 마, 항상 응원해!', '넌 정말 대단한 사람이야!'] },
    { category: 'love', emoji: '❤️', messages: ['사랑해, 항상 고마워!', '네가 있어서 행복해!', '보고 싶어, 빨리 보자!'] },
    { category: 'health', emoji: '🏥', messages: ['약 챙겨 먹었어?', '물 많이 마셔! 건강 챙겨!', '오늘 스트레칭 했어? 몸 좀 풀어!'] },
  ];
  return c.json({ presets });
});

// 인증이 필요한 라우트들
const api = new Hono<{ Bindings: Env }>();
api.use('*', authMiddleware);
api.route('/voice', voiceRoutes);
api.route('/tts', ttsRoutes);
api.route('/alarm', alarmRoutes);
api.route('/user', userRoutes);
api.route('/library', libraryRoutes);

app.route('/api', api);

export default app;
