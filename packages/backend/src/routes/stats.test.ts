import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDB, createTestApp, type MockDB } from '../test-helper';

let mockDB: MockDB;
vi.mock('../lib/db', () => ({
  getDB: () => mockDB,
}));

import statsRoutes from './stats';

let app: ReturnType<typeof createTestApp>;

beforeEach(() => {
  mockDB = createMockDB();
  app = createTestApp(statsRoutes, '/stats');
});

describe('GET /stats', () => {
  function mockAllStatsQueries(overrides?: Partial<{
    alarms: { total: number; active: number };
    messages: number;
    voices: number;
    friends: number;
    giftsReceived: { total: number; pending: number };
    giftsSent: number;
    trend: { this_week: number; last_week: number };
  }>) {
    const d = {
      alarms: overrides?.alarms ?? { total: 5, active: 3 },
      messages: overrides?.messages ?? 10,
      voices: overrides?.voices ?? 2,
      friends: overrides?.friends ?? 4,
      giftsReceived: overrides?.giftsReceived ?? { total: 6, pending: 2 },
      giftsSent: overrides?.giftsSent ?? 3,
      trend: overrides?.trend ?? { this_week: 2, last_week: 1 },
    };

    mockDB.execute
      .mockResolvedValueOnce({ rows: [{ total: d.alarms.total, active: d.alarms.active }] })
      .mockResolvedValueOnce({ rows: [{ total: d.messages }] })
      .mockResolvedValueOnce({ rows: [{ total: d.voices }] })
      .mockResolvedValueOnce({ rows: [{ total: d.friends }] })
      .mockResolvedValueOnce({ rows: [{ total: d.giftsReceived.total, pending: d.giftsReceived.pending }] })
      .mockResolvedValueOnce({ rows: [{ total: d.giftsSent }] })
      .mockResolvedValueOnce({ rows: [{ this_week: d.trend.this_week, last_week: d.trend.last_week }] })
      .mockResolvedValueOnce({ rows: [{ this_week: d.trend.this_week, last_week: d.trend.last_week }] })
      .mockResolvedValueOnce({ rows: [{ this_week: d.trend.this_week, last_week: d.trend.last_week }] })
      .mockResolvedValueOnce({ rows: [{ this_week: d.trend.this_week, last_week: d.trend.last_week }] })
      .mockResolvedValueOnce({ rows: [{ this_week: d.trend.this_week, last_week: d.trend.last_week }] });
  }

  it('returns all stats with correct structure', async () => {
    mockAllStatsQueries();
    const res = await app.request('/stats');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.alarms).toEqual({ total: 5, active: 3 });
    expect(body.messages).toEqual({ total: 10 });
    expect(body.voices).toEqual({ total: 2 });
    expect(body.friends).toEqual({ total: 4 });
    expect(body.gifts).toEqual({ received: 6, receivedPending: 2, sent: 3 });
    expect(body.trends.alarms).toEqual({ thisWeek: 2, lastWeek: 1 });
  });

  it('issues 11 parallel queries', async () => {
    mockAllStatsQueries();
    await app.request('/stats');
    expect(mockDB.execute).toHaveBeenCalledTimes(11);
  });

  it('handles zero counts', async () => {
    mockAllStatsQueries({
      alarms: { total: 0, active: 0 },
      messages: 0,
      voices: 0,
      friends: 0,
      giftsReceived: { total: 0, pending: 0 },
      giftsSent: 0,
      trend: { this_week: 0, last_week: 0 },
    });

    const res = await app.request('/stats');
    const body = await res.json();
    expect(body.alarms.total).toBe(0);
    expect(body.alarms.active).toBe(0);
    expect(body.gifts.received).toBe(0);
    expect(body.trends.alarms).toEqual({ thisWeek: 0, lastWeek: 0 });
  });

  it('handles null trend values gracefully', async () => {
    mockDB.execute
      .mockResolvedValueOnce({ rows: [{ total: 1, active: 1 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0, pending: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ this_week: null, last_week: null }] })
      .mockResolvedValueOnce({ rows: [{ this_week: null, last_week: null }] })
      .mockResolvedValueOnce({ rows: [{ this_week: null, last_week: null }] })
      .mockResolvedValueOnce({ rows: [{ this_week: null, last_week: null }] })
      .mockResolvedValueOnce({ rows: [{ this_week: null, last_week: null }] });

    const res = await app.request('/stats');
    const body = await res.json();
    expect(body.trends.alarms).toEqual({ thisWeek: 0, lastWeek: 0 });
    expect(body.trends.messages).toEqual({ thisWeek: 0, lastWeek: 0 });
  });

  it('passes correct userId to queries', async () => {
    mockAllStatsQueries();
    await app.request('/stats');

    const firstCall = mockDB.execute.mock.calls[0][0];
    expect(firstCall.args).toContain('test-user-id');
  });
});

describe('GET /stats/activity', () => {
  it('returns combined activities sorted by date', async () => {
    mockDB.execute
      .mockResolvedValueOnce({
        rows: [{ id: 'a1', time: '07:00', created_at: '2026-04-10T07:00:00Z', type: 'alarm' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 'm1', text: 'Good morning!', created_at: '2026-04-10T08:00:00Z', type: 'message' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 'g1', note: 'For you', status: 'pending', created_at: '2026-04-10T09:00:00Z', type: 'gift' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 'v1', name: 'Mom', status: 'ready', created_at: '2026-04-10T06:00:00Z', type: 'voice' }],
      });

    const res = await app.request('/stats/activity');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.activities).toHaveLength(4);
    expect(body.activities[0].type).toBe('gift');
    expect(body.activities[1].type).toBe('message');
    expect(body.activities[2].type).toBe('alarm');
    expect(body.activities[3].type).toBe('voice');
  });

  it('formats activity summaries correctly', async () => {
    mockDB.execute
      .mockResolvedValueOnce({
        rows: [{ id: 'a1', time: '07:30', created_at: '2026-04-10T07:00:00Z', type: 'alarm' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 'm1', text: 'A'.repeat(100), created_at: '2026-04-10T06:00:00Z', type: 'message' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 'g1', note: null, status: 'accepted', created_at: '2026-04-10T05:00:00Z', type: 'gift' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 'v1', name: 'Dad', status: 'processing', created_at: '2026-04-10T04:00:00Z', type: 'voice' }],
      });

    const res = await app.request('/stats/activity');
    const body = await res.json();

    const alarm = body.activities.find((a: { type: string }) => a.type === 'alarm');
    expect(alarm.summary).toBe('알람 07:30');

    const message = body.activities.find((a: { type: string }) => a.type === 'message');
    expect(message.summary).toHaveLength(50);

    const gift = body.activities.find((a: { type: string }) => a.type === 'gift');
    expect(gift.summary).toBe('선물 (accepted)');

    const voice = body.activities.find((a: { type: string }) => a.type === 'voice');
    expect(voice.summary).toBe('음성 "Dad" (processing)');
  });

  it('limits to 10 activities total', async () => {
    const makeRows = (count: number, type: string) =>
      Array.from({ length: count }, (_, i) => ({
        id: `${type}${i}`,
        time: '08:00',
        text: 'text',
        note: 'note',
        name: 'name',
        status: 'ready',
        created_at: new Date(Date.now() - i * 60000).toISOString(),
        type,
      }));

    mockDB.execute
      .mockResolvedValueOnce({ rows: makeRows(5, 'alarm') })
      .mockResolvedValueOnce({ rows: makeRows(5, 'message') })
      .mockResolvedValueOnce({ rows: makeRows(5, 'gift') })
      .mockResolvedValueOnce({ rows: makeRows(5, 'voice') });

    const res = await app.request('/stats/activity');
    const body = await res.json();
    expect(body.activities).toHaveLength(10);
  });

  it('returns empty array when no data', async () => {
    mockDB.execute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await app.request('/stats/activity');
    const body = await res.json();
    expect(body.activities).toEqual([]);
  });

  it('issues 4 parallel queries', async () => {
    mockDB.execute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await app.request('/stats/activity');
    expect(mockDB.execute).toHaveBeenCalledTimes(4);
  });
});
