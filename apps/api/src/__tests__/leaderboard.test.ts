import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import { store } from '../db/store.js';

const EVENT_ID = 'ev-abhiyantrix-2026';

describe('Dynamic Leaderboard & Analytics API', () => {
  beforeEach(() => {
    store.seedDemoData();
  });

  it('GET /api/events/:id/leaderboard should return ranked teams in descending score order', async () => {
    const res = await request(app).get(`/api/events/${EVENT_ID}/leaderboard`);
    expect(res.status).toBe(200);
    expect(res.body.rankings).toBeDefined();
    expect(res.body.rankings.length).toBeGreaterThan(0);

    // Verify ranks are sorted descending
    for (let i = 0; i < res.body.rankings.length - 1; i++) {
      expect(res.body.rankings[i].totalScore).toBeGreaterThanOrEqual(res.body.rankings[i + 1].totalScore);
    }
  });

  it('GET /api/events/:id/analytics should return complete conversion funnel and stats', async () => {
    const res = await request(app).get(`/api/events/${EVENT_ID}/analytics`);
    expect(res.status).toBe(200);
    expect(res.body.totalRegistered).toBeGreaterThan(0);
    expect(res.body.registrationFunnel).toBeDefined();
    expect(res.body.registrationFunnel.registered).toBeGreaterThan(0);
    expect(res.body.topSkillsCloud).toBeDefined();
    expect(res.body.trackDistribution).toBeDefined();
  });

  it('GET /api/events/:id/export/csv should return downloadable CSV with header columns', async () => {
    const res = await request(app).get(`/api/events/${EVENT_ID}/export/csv`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Rank');
    expect(res.text).toContain('Team Name');
    expect(res.text).toContain('Average Total Score');
  });
});
