import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import { store } from '../db/store.js';

describe('Google Cloud & Gemini AI Integration Tests', () => {
  beforeEach(() => {
    store.seedDemoData();
  });

  it('POST /api/google/ai/matchmaking should return Gemini AI synergy analysis', async () => {
    const res = await request(app)
      .post('/api/google/ai/matchmaking')
      .send({
        participantSkills: ['Python', 'TensorFlow', 'FastAPI'],
        preferredRole: 'AI Researcher',
        teamNeededSkills: ['Python', 'LangChain'],
        teamPitch: 'Building autonomous swarm intelligence'
      });

    expect(res.status).toBe(200);
    expect(res.body.service).toContain('Google Gemini');
    expect(res.body.analysis.matchScore).toBeGreaterThanOrEqual(60);
    expect(res.body.analysis.synergyAnalysis).toBeDefined();
  });

  it('POST /api/google/ai/judging-copilot should return structured judging insights', async () => {
    const res = await request(app)
      .post('/api/google/ai/judging-copilot')
      .send({
        title: 'Abhiyantrix Event Engine',
        description: 'Real-time multi-tenant event management with HMAC QR codes',
        track: 'AI & Autonomous Agents',
        repoUrl: 'https://github.com/vasanth-07-bunny/hack-it'
      });

    expect(res.status).toBe(200);
    expect(res.body.insights.technicalStrengths.length).toBeGreaterThan(0);
    expect(res.body.insights.estimatedTechnicalScore).toBeGreaterThan(9.0);
  });

  it('POST /api/google/auth/google-signin should authenticate via Google Identity and issue JWT', async () => {
    const res = await request(app)
      .post('/api/google/auth/google-signin')
      .send({
        email: 'vasanth.developer@gmail.com',
        name: 'Chatakonda Vasanth',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        googleId: 'g-oauth-123456789'
      });

    expect(res.status).toBe(200);
    expect(res.body.provider).toContain('Google Identity');
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('vasanth.developer@gmail.com');
  });

  it('GET /api/google/maps/venue should return Google Maps venue metadata and geofence', async () => {
    const res = await request(app).get('/api/google/maps/venue');
    expect(res.status).toBe(200);
    expect(res.body.platform).toContain('Google Maps');
    expect(res.body.coordinates.latitude).toBeDefined();
    expect(res.body.geofenceRadiusMeters).toBe(250);
  });

  it('GET /api/google/sheets/export should format event data for Google Sheets API sync', async () => {
    const res = await request(app).get('/api/google/sheets/export');
    expect(res.status).toBe(200);
    expect(res.body.service).toContain('Google Sheets');
    expect(res.body.data.columns).toContain('Weighted Total Score');
    expect(Array.isArray(res.body.data.rows)).toBe(true);
  });
});
