import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDB, createTestApp, jsonReq, type MockDB, ID } from '../test-helper';

const VP_ID = '50000000-0000-4000-8000-000000000001';

let mockDB: MockDB;
vi.mock('../lib/db', () => ({
  getDB: () => mockDB,
}));

vi.mock('../lib/perso', () => ({
  PersoClient: vi.fn().mockImplementation(() => ({
    textToSpeech: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
  })),
}));

vi.mock('../lib/elevenlabs', () => ({
  ElevenLabsClient: vi.fn().mockImplementation(() => ({
    textToSpeech: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
  })),
}));

import ttsRoutes from './tts';

describe('tts routes', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    mockDB = createMockDB();
    app = createTestApp(ttsRoutes, '/tts');
  });

  describe('POST /tts/generate — TTS 생성', () => {
    it('returns 400 when missing required fields', async () => {
      const res = await app.request('/tts/generate', jsonReq('POST', '/tts/generate', {}));
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid voice_profile_id format', async () => {
      const res = await app.request(
        '/tts/generate',
        jsonReq('POST', '/tts/generate', { voice_profile_id: 'bad', text: 'hello' }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 when text exceeds 200 chars', async () => {
      const res = await app.request(
        '/tts/generate',
        jsonReq('POST', '/tts/generate', {
          voice_profile_id: VP_ID,
          text: 'x'.repeat(201),
        }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid category', async () => {
      const res = await app.request(
        '/tts/generate',
        jsonReq('POST', '/tts/generate', {
          voice_profile_id: VP_ID,
          text: 'hello',
          category: 'invalid_cat',
        }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 429 when daily TTS limit exceeded', async () => {
      mockDB.execute.mockResolvedValueOnce({
        rows: [{ plan: 'free', daily_tts_count: 3, daily_tts_reset_at: new Date().toISOString().split('T')[0] }],
      });
      const res = await app.request(
        '/tts/generate',
        jsonReq('POST', '/tts/generate', {
          voice_profile_id: VP_ID,
          text: '안녕하세요',
        }),
      );
      expect(res.status).toBe(429);
    });

    it('returns 404 when voice profile not found', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ plan: 'plus', daily_tts_count: 0, daily_tts_reset_at: '2020-01-01' }] })
        .mockResolvedValueOnce({ rowsAffected: 1 }) // daily reset
        .mockResolvedValueOnce({ rows: [] }); // profile not found
      const res = await app.request(
        '/tts/generate',
        jsonReq('POST', '/tts/generate', {
          voice_profile_id: VP_ID,
          text: '안녕하세요',
        }),
      );
      expect(res.status).toBe(404);
    });

    it('returns 400 when voice profile not ready', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ plan: 'plus', daily_tts_count: 0, daily_tts_reset_at: '2020-01-01' }] })
        .mockResolvedValueOnce({ rowsAffected: 1 }) // daily reset
        .mockResolvedValueOnce({ rows: [{ id: VP_ID, status: 'processing', perso_voice_id: null, elevenlabs_voice_id: null }] });
      const res = await app.request(
        '/tts/generate',
        jsonReq('POST', '/tts/generate', {
          voice_profile_id: VP_ID,
          text: '안녕하세요',
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('not ready');
    });

    it('returns 201 on successful TTS generation with elevenlabs', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ plan: 'plus', daily_tts_count: 0, daily_tts_reset_at: '2020-01-01' }] })
        .mockResolvedValueOnce({ rowsAffected: 1 }) // daily reset
        .mockResolvedValueOnce({
          rows: [{ id: VP_ID, status: 'ready', perso_voice_id: null, elevenlabs_voice_id: 'el-123' }],
        })
        .mockResolvedValueOnce({ rowsAffected: 1 }) // insert message
        .mockResolvedValueOnce({ rowsAffected: 1 }) // update daily count
        .mockResolvedValueOnce({ rowsAffected: 1 }); // insert library
      const res = await app.request(
        '/tts/generate',
        jsonReq('POST', '/tts/generate', {
          voice_profile_id: VP_ID,
          text: '안녕하세요',
          category: 'morning',
        }),
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.audio_base64).toBeDefined();
      expect(body.audio_format).toBe('mp3');
      expect(body.voice_profile_id).toBe(VP_ID);
    });

    it('returns 201 on successful TTS generation with perso', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ plan: 'free', daily_tts_count: 1, daily_tts_reset_at: new Date().toISOString().split('T')[0] }] })
        .mockResolvedValueOnce({
          rows: [{ id: VP_ID, status: 'ready', perso_voice_id: 'perso-123', elevenlabs_voice_id: null }],
        })
        .mockResolvedValueOnce({ rowsAffected: 1 }) // insert message
        .mockResolvedValueOnce({ rowsAffected: 1 }) // update daily count
        .mockResolvedValueOnce({ rowsAffected: 1 }); // insert library
      const res = await app.request(
        '/tts/generate',
        jsonReq('POST', '/tts/generate', {
          voice_profile_id: VP_ID,
          text: '안녕하세요',
        }),
      );
      expect(res.status).toBe(201);
    });
  });

  describe('GET /tts/messages — 메시지 목록', () => {
    it('returns messages with pagination', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({
          rows: [{ id: ID.message, text: '안녕', category: 'morning', voice_name: 'Mom' }],
        });
      const res = await app.request('/tts/messages', { method: 'GET' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.messages).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it('returns empty list', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({ rows: [] });
      const res = await app.request('/tts/messages', { method: 'GET' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.messages).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('returns 400 for invalid voice_profile_id filter', async () => {
      const res = await app.request('/tts/messages?voice_profile_id=bad', { method: 'GET' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /tts/messages/:id — 메시지 삭제', () => {
    it('returns 400 for invalid UUID', async () => {
      const res = await app.request('/tts/messages/bad-id', { method: 'DELETE' });
      expect(res.status).toBe(400);
    });

    it('returns 409 when message has alarms', async () => {
      mockDB.execute.mockResolvedValueOnce({ rows: [{ cnt: 2 }] });
      const res = await app.request(`/tts/messages/${ID.message}`, { method: 'DELETE' });
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.warning).toBe(true);
      expect(body.alarm_count).toBe(2);
    });

    it('force deletes message with alarms', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ cnt: 1 }] }) // alarm check
        .mockResolvedValueOnce({ rowsAffected: 1 }) // delete library
        .mockResolvedValueOnce({ rowsAffected: 1 }); // delete message
      const res = await app.request(`/tts/messages/${ID.message}?force=true`, { method: 'DELETE' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });

    it('returns 404 when message not found', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ cnt: 0 }] }) // no alarms
        .mockResolvedValueOnce({ rowsAffected: 0 }) // delete library (none)
        .mockResolvedValueOnce({ rowsAffected: 0 }); // delete message (not found)
      const res = await app.request(`/tts/messages/${ID.message}`, { method: 'DELETE' });
      expect(res.status).toBe(404);
    });

    it('deletes message successfully', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ cnt: 0 }] }) // no alarms
        .mockResolvedValueOnce({ rowsAffected: 1 }) // delete library
        .mockResolvedValueOnce({ rowsAffected: 1 }); // delete message
      const res = await app.request(`/tts/messages/${ID.message}`, { method: 'DELETE' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.alarms_affected).toBe(0);
    });
  });

  describe('GET /tts/presets — 프리셋 목록', () => {
    it('returns preset messages', async () => {
      const res = await app.request('/tts/presets', { method: 'GET' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.presets).toBeDefined();
      expect(body.presets.length).toBeGreaterThan(0);
      expect(body.presets[0].category).toBe('morning');
      expect(body.presets[0].messages.length).toBeGreaterThan(0);
    });
  });
});
