import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import { store } from '../db/store.js';

const EVENT_ID = 'ev-abhiyantrix-2026';

describe('Enterprise Security & Hardening Tests', () => {
  beforeEach(() => {
    store.seedDemoData();
  });

  it('HTTP responses should include Helmet security headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  it('Payloads containing script tags or malicious HTML should be sanitized', async () => {
    const res = await request(app)
      .post(`/api/events/${EVENT_ID}/announcements`)
      .send({
        title: 'Safe Title <script>alert("hack")</script>',
        message: 'Normal message <b>important</b> <script src="evil.js"></script>',
        severity: 'info',
        targetAudience: 'all'
      });

    expect(res.status).toBe(201);
    expect(res.body.title).not.toContain('<script>');
    expect(res.body.title).not.toContain('alert("hack")');
    expect(res.body.message).not.toContain('<script');
  });

  it('Malformed JSON payloads with invalid types should trigger 400 Bad Request', async () => {
    const res = await request(app)
      .post(`/api/events/${EVENT_ID}/judging/scores`)
      .send({
        submissionId: 'sub-1',
        judgeId: 'usr-judge-1',
        criteriaScores: 'not-an-array' // Malformed type
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
});
