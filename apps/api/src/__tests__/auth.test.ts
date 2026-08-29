import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import { store } from '../db/store.js';

describe('Auth & User Directory API', () => {
  beforeEach(() => {
    store.seedDemoData();
  });

  it('GET /api/health should return online status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.service).toContain('Abhiyantrix');
  });

  it('GET /api/auth/users should list seeded users with all 3 core roles', async () => {
    const res = await request(app).get('/api/auth/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(5);

    const roles = new Set(res.body.map((u: { role: string }) => u.role));
    expect(roles.has('organizer')).toBe(true);
    expect(roles.has('judge')).toBe(true);
    expect(roles.has('participant')).toBe(true);
  });

  it('GET /api/auth/users?role=judge should filter by judge role', async () => {
    const res = await request(app).get('/api/auth/users?role=judge');
    expect(res.status).toBe(200);
    res.body.forEach((u: { role: string }) => {
      expect(u.role).toBe('judge');
    });
  });

  it('POST /api/auth/login should issue a JWT token for valid user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ userId: 'usr-org-1' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe('usr-org-1');
  });

  it('POST /api/auth/login should fail for non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('User not found');
  });

  it('GET /api/auth/me should return authorized user from JWT token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ userId: 'usr-judge-1' });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.id).toBe('usr-judge-1');
    expect(meRes.body.user.role).toBe('judge');
  });
});
