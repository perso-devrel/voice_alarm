import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDB, createTestApp, jsonReq, type MockDB } from '../test-helper';

const U1 = '00000000-0000-0000-0000-000000000001';
const U2 = '00000000-0000-0000-0000-000000000002';

let mockDB: MockDB;
vi.mock('../lib/db', () => ({
  getDB: () => mockDB,
}));

import alarmRoutes from './alarm';

describe('alarm routes', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    mockDB = createMockDB();
    app = createTestApp(alarmRoutes, '/alarm');
  });

  describe('GET /alarm — list alarms', () => {
    it('returns alarms', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({
          rows: [{ id: U1, time: '07:00', message_text: 'hi' }],
        });
      const res = await app.request('/alarm', { method: 'GET' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.alarms).toHaveLength(1);
    });
  });

  describe('POST /alarm — create alarm', () => {
    it('returns 400 when missing required fields', async () => {
      const res = await app.request('/alarm', jsonReq('POST', '/alarm', {}));
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid time format', async () => {
      const res = await app.request(
        '/alarm',
        jsonReq('POST', '/alarm', {
          message_id: U1,
          time: '7:00',
        }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 for out-of-range time', async () => {
      const res = await app.request(
        '/alarm',
        jsonReq('POST', '/alarm', {
          message_id: U1,
          time: '25:00',
        }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid repeat_days', async () => {
      const res = await app.request(
        '/alarm',
        jsonReq('POST', '/alarm', {
          message_id: U1,
          time: '07:00',
          repeat_days: [7],
        }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 for snooze_minutes out of range', async () => {
      const res = await app.request(
        '/alarm',
        jsonReq('POST', '/alarm', {
          message_id: U1,
          time: '07:00',
          snooze_minutes: 31,
        }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 403 when target_user_id is not a friend', async () => {
      mockDB.execute.mockResolvedValueOnce({ rows: [] });
      const res = await app.request(
        '/alarm',
        jsonReq('POST', '/alarm', {
          message_id: U1,
          time: '07:00',
          target_user_id: 'stranger',
        }),
      );
      expect(res.status).toBe(403);
    });

    it('returns 403 when free plan alarm limit reached', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ plan: 'free' }] })
        .mockResolvedValueOnce({ rows: [{ count: 2 }] });
      const res = await app.request(
        '/alarm',
        jsonReq('POST', '/alarm', {
          message_id: U1,
          time: '07:00',
        }),
      );
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toContain('무료 플랜');
    });

    it('returns 404 when message not found', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ plan: 'plus' }] })
        .mockResolvedValueOnce({ rows: [] });
      const res = await app.request(
        '/alarm',
        jsonReq('POST', '/alarm', {
          message_id: U1,
          time: '07:00',
        }),
      );
      expect(res.status).toBe(404);
    });

    it('creates alarm and returns 201', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ plan: 'plus' }] })
        .mockResolvedValueOnce({ rows: [{ id: U1 }] })
        .mockResolvedValueOnce({ rowsAffected: 1 });
      const res = await app.request(
        '/alarm',
        jsonReq('POST', '/alarm', {
          message_id: U1,
          time: '07:30',
          repeat_days: [1, 3, 5],
        }),
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.alarm.time).toBe('07:30');
    });

    it('creates alarm for friend (cross-user)', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ id: U2 }] })
        .mockResolvedValueOnce({ rows: [{ plan: 'plus' }] })
        .mockResolvedValueOnce({ rows: [{ id: U1 }] })
        .mockResolvedValueOnce({ rowsAffected: 1 });
      const res = await app.request(
        '/alarm',
        jsonReq('POST', '/alarm', {
          message_id: U1,
          time: '08:00',
          target_user_id: 'friend-id',
        }),
      );
      expect(res.status).toBe(201);
    });
  });

  describe('PATCH /alarm/:id — update alarm', () => {
    it('returns 404 when alarm not owned', async () => {
      mockDB.execute.mockResolvedValueOnce({ rows: [] });
      const res = await app.request(`/alarm/${U1}`, jsonReq('PATCH', `/alarm/${U1}`, { time: '08:00' }));
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid time on update', async () => {
      mockDB.execute.mockResolvedValueOnce({ rows: [{ id: U1 }] });
      const res = await app.request(`/alarm/${U1}`, jsonReq('PATCH', `/alarm/${U1}`, { time: 'bad' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when no fields to update', async () => {
      mockDB.execute.mockResolvedValueOnce({ rows: [{ id: U1 }] });
      const res = await app.request(`/alarm/${U1}`, jsonReq('PATCH', `/alarm/${U1}`, {}));
      expect(res.status).toBe(400);
    });

    it('updates alarm fields', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ id: U1 }] })
        .mockResolvedValueOnce({ rowsAffected: 1 })
        .mockResolvedValueOnce({ rows: [{ id: U1, time: '09:00', is_active: 0, snooze_minutes: 10, repeat_days: '[]' }] });
      const res = await app.request(
        `/alarm/${U1}`,
        jsonReq('PATCH', `/alarm/${U1}`, {
          time: '09:00',
          is_active: false,
          snooze_minutes: 10,
        }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });

  describe('DELETE /alarm/:id', () => {
    it('returns 404 when not found', async () => {
      mockDB.execute.mockResolvedValueOnce({ rowsAffected: 0 });
      const res = await app.request(`/alarm/${U1}`, { method: 'DELETE' });
      expect(res.status).toBe(404);
    });

    it('deletes alarm', async () => {
      mockDB.execute.mockResolvedValueOnce({ rowsAffected: 1 });
      const res = await app.request(`/alarm/${U1}`, { method: 'DELETE' });
      expect(res.status).toBe(200);
    });
  });
});
