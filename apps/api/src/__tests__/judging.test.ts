import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import { store } from '../db/store.js';

const EVENT_ID = 'ev-abhiyantrix-2026';

describe('Interactive Judging Portal & Rubric Scoring API', () => {
  beforeEach(() => {
    store.seedDemoData();
  });

  it('GET /api/events/:id/judging/rubrics should return event rubric criteria and weights', async () => {
    const res = await request(app).get(`/api/events/${EVENT_ID}/judging/rubrics`);
    expect(res.status).toBe(200);
    expect(res.body.criteria).toBeDefined();
    expect(res.body.criteria.length).toBeGreaterThanOrEqual(4);

    const totalWeight = res.body.criteria.reduce((sum: number, c: { weight: number }) => sum + c.weight, 0);
    expect(Math.round(totalWeight * 100) / 100).toBe(1.0);
  });

  it('POST /api/events/:id/judging/scores should accurately calculate weighted total score and update leaderboard', async () => {
    const submissions = Array.from(store.submissions.values()).filter(s => s.eventId === EVENT_ID);
    expect(submissions.length).toBeGreaterThan(0);
    const targetSub = submissions[0];

    const res = await request(app)
      .post(`/api/events/${EVENT_ID}/judging/scores`)
      .send({
        submissionId: targetSub.id,
        judgeId: 'usr-judge-1',
        criteriaScores: [
          { criterionId: 'crit-tech', score: 10 },
          { criterionId: 'crit-innov', score: 10 },
          { criterionId: 'crit-impact', score: 10 },
          { criterionId: 'crit-ux', score: 10 },
          { criterionId: 'crit-demo', score: 10 }
        ],
        feedbackStrengths: 'Exceptional architectural execution and distributed sync performance.',
        feedbackImprovements: 'None observed.'
      });

    expect(res.status).toBe(200);
    expect(res.body.score).toBeDefined();
    expect(res.body.totalWeightedScore).toBe(100);
    expect(res.body.leaderboard).toBeDefined();
    expect(res.body.leaderboard.rankings.length).toBeGreaterThan(0);
  });

  it('GET /api/events/:id/judging/assignments should return submissions assigned to judge', async () => {
    const res = await request(app).get(`/api/events/${EVENT_ID}/judging/assignments?judgeId=usr-judge-1`);
    expect(res.status).toBe(200);
    expect(res.body.assignments).toBeDefined();
    expect(Array.isArray(res.body.assignments)).toBe(true);
  });

  it('GET /api/events/:id/judging/audit-trail should return complete judging evaluations log', async () => {
    const res = await request(app).get(`/api/events/${EVENT_ID}/judging/audit-trail`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
