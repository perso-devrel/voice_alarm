import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDB, createTestApp, jsonReq, type MockDB } from '../test-helper';

let mockDB: MockDB;
vi.mock('../lib/db', () => ({
  getDB: () => mockDB,
}));

import giftRoutes from './gift';

describe('gift routes', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    mockDB = createMockDB();
    app = createTestApp(giftRoutes, '/gift');
  });

  describe('POST /gift — send gift', () => {
    it('returns 400 for invalid email', async () => {
      const res = await app.request(
        '/gift',
        jsonReq('POST', '/gift', {
          recipient_email: 'bad',
          message_id: 'm1',
        }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 when message_id missing', async () => {
      const res = await app.request(
        '/gift',
        jsonReq('POST', '/gift', {
          recipient_email: 'a@b.com',
        }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 when note exceeds 200 chars', async () => {
      const res = await app.request(
        '/gift',
        jsonReq('POST', '/gift', {
          recipient_email: 'a@b.com',
          message_id: 'm1',
          note: 'x'.repeat(201),
        }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 404 when recipient not found', async () => {
      mockDB.execute.mockResolvedValueOnce({ rows: [] });
      const res = await app.request(
        '/gift',
        jsonReq('POST', '/gift', {
          recipient_email: 'a@b.com',
          message_id: 'm1',
        }),
      );
      expect(res.status).toBe(404);
    });

    it('returns 400 when gifting to self', async () => {
      mockDB.execute.mockResolvedValueOnce({
        rows: [{ google_id: 'test-user-id' }],
      });
      const res = await app.request(
        '/gift',
        jsonReq('POST', '/gift', {
          recipient_email: 'a@b.com',
          message_id: 'm1',
        }),
      );
      expect(res.status).toBe(400);
    });

    it('returns 403 when not friends', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ google_id: 'other-id' }] }) // recipient lookup
        .mockResolvedValueOnce({ rows: [] }); // areFriends check
      const res = await app.request(
        '/gift',
        jsonReq('POST', '/gift', {
          recipient_email: 'a@b.com',
          message_id: 'm1',
        }),
      );
      expect(res.status).toBe(403);
    });

    it('returns 404 when message not owned', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ google_id: 'other-id' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'f1' }] }) // areFriends
        .mockResolvedValueOnce({ rows: [] }); // message check
      const res = await app.request(
        '/gift',
        jsonReq('POST', '/gift', {
          recipient_email: 'a@b.com',
          message_id: 'm1',
        }),
      );
      expect(res.status).toBe(404);
    });

    it('creates gift and returns 201', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ google_id: 'other-id' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'f1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'm1' }] })
        .mockResolvedValueOnce({ rowsAffected: 1 });
      const res = await app.request(
        '/gift',
        jsonReq('POST', '/gift', {
          recipient_email: 'a@b.com',
          message_id: 'm1',
          note: 'hello!',
        }),
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.gift.status).toBe('pending');
    });
  });

  describe('GET /gift/received', () => {
    it('returns received gifts', async () => {
      mockDB.execute.mockResolvedValueOnce({
        rows: [{ id: 'g1', sender_email: 'a@b.com', message_text: 'hi' }],
      });
      const res = await app.request('/gift/received', { method: 'GET' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.gifts).toHaveLength(1);
    });
  });

  describe('GET /gift/sent', () => {
    it('returns sent gifts', async () => {
      mockDB.execute.mockResolvedValueOnce({
        rows: [{ id: 'g1', recipient_email: 'a@b.com' }],
      });
      const res = await app.request('/gift/sent', { method: 'GET' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.gifts).toHaveLength(1);
    });
  });

  describe('PATCH /gift/:id/accept', () => {
    it('returns 404 for non-existent gift', async () => {
      mockDB.execute.mockResolvedValueOnce({ rows: [] });
      const res = await app.request('/gift/g1/accept', { method: 'PATCH' });
      expect(res.status).toBe(404);
    });

    it('accepts gift and adds to library', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ id: 'g1', message_id: 'm1' }] })
        .mockResolvedValueOnce({ rowsAffected: 1 }) // update status
        .mockResolvedValueOnce({ rowsAffected: 1 }); // insert library
      const res = await app.request('/gift/g1/accept', { method: 'PATCH' });
      expect(res.status).toBe(200);
      expect(mockDB.execute).toHaveBeenCalledTimes(3);
    });
  });

  describe('PATCH /gift/:id/reject', () => {
    it('returns 404 for non-existent gift', async () => {
      mockDB.execute.mockResolvedValueOnce({ rows: [] });
      const res = await app.request('/gift/g1/reject', { method: 'PATCH' });
      expect(res.status).toBe(404);
    });

    it('rejects gift', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ id: 'g1' }] })
        .mockResolvedValueOnce({ rowsAffected: 1 });
      const res = await app.request('/gift/g1/reject', { method: 'PATCH' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });
});
