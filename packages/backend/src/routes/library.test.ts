import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDB, createTestApp, type MockDB, ID } from '../test-helper';

const LIB_ID = '40000000-0000-4000-8000-000000000001';

let mockDB: MockDB;
vi.mock('../lib/db', () => ({
  getDB: () => mockDB,
}));

import libraryRoutes from './library';

describe('library routes', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    mockDB = createMockDB();
    app = createTestApp(libraryRoutes, '/library');
  });

  describe('GET /library — 목록 조회', () => {
    it('returns items with pagination', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({
          rows: [
            { id: LIB_ID, message_id: ID.message, text: '안녕', category: 'morning', voice_name: 'Mom' },
            { id: '40000000-0000-4000-8000-000000000002', message_id: ID.message, text: '좋은 아침', category: 'morning', voice_name: 'Mom' },
          ],
        });
      const res = await app.request('/library', { method: 'GET' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(2);
      expect(body.total).toBe(2);
      expect(body.limit).toBe(20);
      expect(body.offset).toBe(0);
    });

    it('returns empty list', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({ rows: [] });
      const res = await app.request('/library', { method: 'GET' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('respects limit and offset params', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ total: 50 }] })
        .mockResolvedValueOnce({ rows: [{ id: LIB_ID }] });
      const res = await app.request('/library?limit=5&offset=10', { method: 'GET' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.limit).toBe(5);
      expect(body.offset).toBe(10);
    });

    it('clamps limit to max 100', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({ rows: [] });
      const res = await app.request('/library?limit=999', { method: 'GET' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.limit).toBe(100);
    });

    it('applies favorite filter', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: LIB_ID, is_favorite: 1 }] });
      const res = await app.request('/library?filter=favorite', { method: 'GET' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
    });

    it('applies voice filter', async () => {
      const vpId = '50000000-0000-4000-8000-000000000001';
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: LIB_ID }] });
      const res = await app.request(`/library?filter=voice:${vpId}`, { method: 'GET' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
    });

    it('applies date filter', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: LIB_ID }] });
      const res = await app.request('/library?filter=date:2026-04-10', { method: 'GET' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
    });
  });

  describe('PATCH /library/:id/favorite — 즐겨찾기 토글', () => {
    it('returns 400 for invalid UUID', async () => {
      const res = await app.request('/library/bad-id/favorite', { method: 'PATCH' });
      expect(res.status).toBe(400);
    });

    it('returns 404 when item not found', async () => {
      mockDB.execute.mockResolvedValueOnce({ rows: [] });
      const res = await app.request(`/library/${LIB_ID}/favorite`, { method: 'PATCH' });
      expect(res.status).toBe(404);
    });

    it('toggles favorite from 0 to 1', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ is_favorite: 0 }] })
        .mockResolvedValueOnce({ rowsAffected: 1 });
      const res = await app.request(`/library/${LIB_ID}/favorite`, { method: 'PATCH' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.is_favorite).toBe(true);
    });

    it('toggles favorite from 1 to 0', async () => {
      mockDB.execute
        .mockResolvedValueOnce({ rows: [{ is_favorite: 1 }] })
        .mockResolvedValueOnce({ rowsAffected: 1 });
      const res = await app.request(`/library/${LIB_ID}/favorite`, { method: 'PATCH' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.is_favorite).toBe(false);
    });
  });

  describe('DELETE /library/:id — 항목 삭제', () => {
    it('returns 400 for invalid UUID', async () => {
      const res = await app.request('/library/bad-id', { method: 'DELETE' });
      expect(res.status).toBe(400);
    });

    it('returns 404 when item not found', async () => {
      mockDB.execute.mockResolvedValueOnce({ rows: [], rowsAffected: 0 });
      const res = await app.request(`/library/${LIB_ID}`, { method: 'DELETE' });
      expect(res.status).toBe(404);
    });

    it('deletes item successfully', async () => {
      mockDB.execute.mockResolvedValueOnce({ rowsAffected: 1 });
      const res = await app.request(`/library/${LIB_ID}`, { method: 'DELETE' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });
  });
});
