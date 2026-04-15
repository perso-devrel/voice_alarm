import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createMockDB, type MockDB, ID } from '../test-helper';
import type { AppEnv, Env } from '../types';

const VP_ID = '50000000-0000-4000-8000-000000000001';

const fakeEnv: Env = {
  PERSO_API_KEY: 'test-key',
  ELEVENLABS_API_KEY: 'test-key',
  TURSO_DATABASE_URL: 'test',
  TURSO_AUTH_TOKEN: 'test',
  GOOGLE_CLIENT_ID: 'test',
  ENVIRONMENT: 'test',
};

let mockDB: MockDB;
vi.mock('../lib/db', () => ({
  getDB: () => mockDB,
}));

vi.mock('../lib/elevenlabs', () => ({
  ElevenLabsClient: class { async textToSpeech() { return new ArrayBuffer(8); } },
}));

import ttsRoutes from './tts';

function createTtsApp(userId = 'test-user-id') {
  const app = new Hono<AppEnv>();
  app.use('*', async (c, next) => {
    c.set('userId', userId);
    c.set('userEmail', 'test@example.com');
    c.set('userName', 'Test User');
    c.set('userPicture', '');
    await next();
  });
  app.route('/tts', ttsRoutes);
  return app;
}

function jsonBody(method: string, body?: Record<string, unknown>): RequestInit {
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) init.body = JSON.stringify(body);
  return init;
}

async function req(app: Hono<AppEnv>, path: string, init?: RequestInit): Promise<Response> {
  return app.fetch(new Request(`http://localhost${path}`, init), fakeEnv);
}

describe('tts routes', () => {
  let app: ReturnType<typeof createTtsApp>;

  beforeEach(() => {
    mockDB = createMockDB();
    app = createTtsApp();
  });

  describe('POST /tts/generate — TTS 생성', () => {
    it('returns 400 when missing required fields', async () => {
      const res = await req(app, '/tts/generate', jsonBody('POST', {}));
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid voice_profile_id format', async () => {
      const res = await req(app, '/tts/generate', jsonBody('POST', { voice_profile_id: 'bad', text: 'hello' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when text exceeds 200 chars', async () => {
      const res = await req(app, '/tts/generate', jsonBody('POST', {
        voice_profile_id: VP_ID,
        text: 'x'.repeat(201),
      }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid category', async () => {
      const res = await req(app, '/tts/generate', jsonBody('POST', {
        voice_profile_id: VP_ID,
        text: 'hello',
        category: 'invalid_cat',
      }));
      expect(res.status).toBe(400);
    });

    it('returns 429 when daily TTS limit exceeded', async () => {
      mockDB.execute.mockResolvedValueOnce({
        rows: [{ plan: 'free', daily_tts_count: 3, daily_tts_reset_at: new Date().toISOString().split('T')[0] }],
      });
      const res = await req(app, '/tts/generate', jsonBody('POST', {
        voice_profile_id: VP_ID,
        text: '안녕하세요',
      }));
      expect(res.status).toBe(429);
    });

    it('returns 404 when voice profile not found', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ plan: 'plus', daily_tts_count: 0, daily_tts_reset_at: '2020-01-01' }] })
        .mockResolvedValueOnce({ rowsAffected: 1 })
        .mockResolvedValueOnce({ rows: [] });
      const res = await req(app, '/tts/generate', jsonBody('POST', {
        voice_profile_id: VP_ID,
        text: '안녕하세요',
      }));
      expect(res.status).toBe(404);
    });

    it('returns 400 when voice profile not ready', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ plan: 'plus', daily_tts_count: 0, daily_tts_reset_at: '2020-01-01' }] })
        .mockResolvedValueOnce({ rowsAffected: 1 })
        .mockResolvedValueOnce({ rows: [{ id: VP_ID, status: 'processing', perso_voice_id: null, elevenlabs_voice_id: null }] });
      const res = await req(app, '/tts/generate', jsonBody('POST', {
        voice_profile_id: VP_ID,
        text: '안녕하세요',
      }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('not ready');
    });

    it('returns 201 on successful TTS generation with elevenlabs', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ plan: 'plus', daily_tts_count: 0, daily_tts_reset_at: '2020-01-01' }] })
        .mockResolvedValueOnce({ rowsAffected: 1 })
        .mockResolvedValueOnce({
          rows: [{ id: VP_ID, status: 'ready', perso_voice_id: null, elevenlabs_voice_id: 'el-123' }],
        })
        .mockResolvedValueOnce({ rowsAffected: 1 })
        .mockResolvedValueOnce({ rowsAffected: 1 })
        .mockResolvedValueOnce({ rowsAffected: 1 });
      const res = await req(app, '/tts/generate', jsonBody('POST', {
        voice_profile_id: VP_ID,
        text: '안녕하세요',
        category: 'morning',
      }));
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.audio_base64).toBeDefined();
      expect(body.audio_format).toBe('mp3');
      expect(body.voice_profile_id).toBe(VP_ID);
    });

    it('returns 400 when no elevenlabs_voice_id available', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ plan: 'free', daily_tts_count: 1, daily_tts_reset_at: new Date().toISOString().split('T')[0] }] })
        .mockResolvedValueOnce({
          rows: [{ id: VP_ID, status: 'ready', elevenlabs_voice_id: null }],
        });
      const res = await req(app, '/tts/generate', jsonBody('POST', {
        voice_profile_id: VP_ID,
        text: '안녕하세요',
      }));
      expect(res.status).toBe(400);
    });
  });

  describe('GET /tts/messages — 메시지 목록', () => {
    it('returns messages with pagination', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({
          rows: [{ id: ID.message, text: '안녕', category: 'morning', voice_name: 'Mom' }],
        });
      const res = await req(app, '/tts/messages');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.messages).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it('returns empty list', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({ rows: [] });
      const res = await req(app, '/tts/messages');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.messages).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('returns 400 for invalid voice_profile_id filter', async () => {
      const res = await req(app, '/tts/messages?voice_profile_id=bad');
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /tts/messages/:id — 메시지 삭제', () => {
    it('returns 400 for invalid UUID', async () => {
      const res = await req(app, '/tts/messages/bad-id', { method: 'DELETE' });
      expect(res.status).toBe(400);
    });

    it('returns 409 when message has alarms', async () => {
      mockDB.execute.mockResolvedValueOnce({ rows: [{ cnt: 2 }] });
      const res = await req(app, `/tts/messages/${ID.message}`, { method: 'DELETE' });
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.warning).toBe(true);
      expect(body.alarm_count).toBe(2);
    });

    it('force deletes message with alarms', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ cnt: 1 }] })
        .mockResolvedValueOnce({ rowsAffected: 1 })
        .mockResolvedValueOnce({ rowsAffected: 1 });
      const res = await req(app, `/tts/messages/${ID.message}?force=true`, { method: 'DELETE' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });

    it('returns 404 when message not found', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ cnt: 0 }] })
        .mockResolvedValueOnce({ rowsAffected: 0 })
        .mockResolvedValueOnce({ rowsAffected: 0 });
      const res = await req(app, `/tts/messages/${ID.message}`, { method: 'DELETE' });
      expect(res.status).toBe(404);
    });

    it('deletes message successfully', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ cnt: 0 }] })
        .mockResolvedValueOnce({ rowsAffected: 1 })
        .mockResolvedValueOnce({ rowsAffected: 1 });
      const res = await req(app, `/tts/messages/${ID.message}`, { method: 'DELETE' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.alarms_affected).toBe(0);
    });
  });

  describe('GET /tts/presets — 프리셋 목록', () => {
    it('returns preset messages', async () => {
      const res = await req(app, '/tts/presets');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.presets).toBeDefined();
      expect(body.presets.length).toBeGreaterThan(0);
      expect(body.presets[0].category).toBe('morning');
      expect(body.presets[0].messages.length).toBeGreaterThan(0);
    });
  });
});
