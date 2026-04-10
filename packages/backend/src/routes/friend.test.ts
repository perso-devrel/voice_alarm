import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDB, createTestApp, jsonReq, type MockDB } from '../test-helper';

let mockDB: MockDB;
vi.mock('../lib/db', () => ({
  getDB: () => mockDB,
}));

import friendRoutes from './friend';

describe('friend routes', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    mockDB = createMockDB();
    app = createTestApp(friendRoutes, '/friend');
  });

  describe('POST /friend — send friend request', () => {
    it('returns 400 for invalid email', async () => {
      const res = await app.request('/friend', jsonReq('POST', '/friend', { email: 'bad' }));
      expect(res.status).toBe(400);
    });

    it('returns 404 when target user not found', async () => {
      mockDB.execute.mockResolvedValueOnce({ rows: [] });
      const res = await app.request(
        '/friend',
        jsonReq('POST', '/friend', { email: 'other@example.com' }),
      );
      expect(res.status).toBe(404);
    });

    it('returns 400 when sending request to self', async () => {
      mockDB.execute.mockResolvedValueOnce({
        rows: [{ google_id: 'test-user-id', email: 'other@example.com', name: 'Other' }],
      });
      const res = await app.request(
        '/friend',
        jsonReq('POST', '/friend', { email: 'other@example.com' }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('자기 자신');
    });

    it('returns 409 when already friends', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ google_id: 'other-id', email: 'o@e.com', name: 'O' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'f1', status: 'accepted' }] });
      const res = await app.request('/friend', jsonReq('POST', '/friend', { email: 'o@e.com' }));
      expect(res.status).toBe(409);
    });

    it('returns 409 when request already pending', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ google_id: 'other-id', email: 'o@e.com', name: 'O' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'f1', status: 'pending' }] });
      const res = await app.request('/friend', jsonReq('POST', '/friend', { email: 'o@e.com' }));
      expect(res.status).toBe(409);
    });

    it('creates friendship and returns 201', async () => {
      mockDB.execute
        .mockResolvedValueOnce({
          rows: [{ google_id: 'other-id', email: 'o@e.com', name: 'Other' }],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [], rowsAffected: 1 });
      const res = await app.request('/friend', jsonReq('POST', '/friend', { email: 'o@e.com' }));
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.friendship.status).toBe('pending');
      expect(body.friendship.user_b).toBe('other-id');
    });
  });

  describe('GET /friend/list — accepted friends', () => {
    it('returns friends list', async () => {
      mockDB.execute.mockResolvedValueOnce({
        rows: [{ id: 'f1', friend_email: 'a@b.com', friend_name: 'A' }],
      });
      const res = await app.request('/friend/list', { method: 'GET' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.friends).toHaveLength(1);
    });
  });

  describe('GET /friend/pending — pending requests', () => {
    it('returns pending requests', async () => {
      mockDB.execute.mockResolvedValueOnce({
        rows: [{ id: 'f1', requester_email: 'a@b.com' }],
      });
      const res = await app.request('/friend/pending', { method: 'GET' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.pending).toHaveLength(1);
    });
  });

  describe('PATCH /friend/:id/accept', () => {
    it('returns 404 when request not found', async () => {
      mockDB.execute.mockResolvedValueOnce({ rows: [] });
      const res = await app.request('/friend/f1/accept', { method: 'PATCH' });
      expect(res.status).toBe(404);
    });

    it('accepts pending request', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ id: 'f1' }] })
        .mockResolvedValueOnce({ rowsAffected: 1 });
      const res = await app.request('/friend/f1/accept', { method: 'PATCH' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });

  describe('DELETE /friend/:id', () => {
    it('returns 404 when not found', async () => {
      mockDB.execute.mockResolvedValueOnce({ rows: [], rowsAffected: 0 });
      const res = await app.request('/friend/f1', { method: 'DELETE' });
      expect(res.status).toBe(404);
    });

    it('deletes friendship', async () => {
      mockDB.execute.mockResolvedValueOnce({ rowsAffected: 1 });
      const res = await app.request('/friend/f1', { method: 'DELETE' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });
});
