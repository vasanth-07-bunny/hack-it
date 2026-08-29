import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import { store } from '../db/store.js';

const EVENT_ID = 'ev-abhiyantrix-2026';

describe('QR Attendee Check-In & HMAC Verification API', () => {
  beforeEach(() => {
    store.seedDemoData();
  });

  it('POST /api/events/:id/register should successfully register an attendee and return signed QR pass', async () => {
    const res = await request(app)
      .post(`/api/events/${EVENT_ID}/register`)
      .send({
        fullName: 'Elena Rostova',
        email: 'elena.rostova@quantum.io',
        collegeOrCompany: 'MIT Quantum Lab',
        skills: ['Rust', 'Solidity', 'Zero-Knowledge Proofs'],
        preferredRole: 'Blockchain Architect',
        tShirtSize: 'M',
        dietaryRequirements: 'Vegan'
      });

    expect(res.status).toBe(201);
    expect(res.body.registration).toBeDefined();
    expect(res.body.qrToken).toBeDefined();
    expect(res.body.user.fullName).toBe('Elena Rostova');
  });

  it('POST /api/events/:id/register should return 400 for invalid email or missing name', async () => {
    const res = await request(app)
      .post(`/api/events/${EVENT_ID}/register`)
      .send({
        fullName: '',
        email: 'not-an-email'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('POST /api/events/:id/check-in/verify should verify valid HMAC QR token', async () => {
    // Generate valid registration
    const reg = Array.from(store.registrations.values()).find(r => r.eventId === EVENT_ID && r.status === 'registered');
    expect(reg).toBeDefined();

    const res = await request(app)
      .post(`/api/events/${EVENT_ID}/check-in/verify`)
      .send({
        qrToken: reg!.qrToken,
        method: 'onsite_qr_scan',
        scannedByUserId: 'usr-org-1'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.registration.status).toBe('checked_in');
  });

  it('POST /api/events/:id/check-in/verify should cryptographically reject tampered QR tokens', async () => {
    const res = await request(app)
      .post(`/api/events/${EVENT_ID}/check-in/verify`)
      .send({
        qrToken: 'malicious_tampered_base64url_token_signature',
        method: 'onsite_qr_scan'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it('POST /api/events/:id/check-in/verify should reject duplicate check-in with 409 Conflict', async () => {
    const reg = Array.from(store.registrations.values()).find(r => r.eventId === EVENT_ID && r.status === 'registered');
    expect(reg).toBeDefined();

    // First check-in
    await request(app)
      .post(`/api/events/${EVENT_ID}/check-in/verify`)
      .send({
        qrToken: reg!.qrToken,
        method: 'onsite_qr_scan'
      });

    // Duplicate check-in attempt
    const dupRes = await request(app)
      .post(`/api/events/${EVENT_ID}/check-in/verify`)
      .send({
        qrToken: reg!.qrToken,
        method: 'onsite_qr_scan'
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.alreadyCheckedIn).toBe(true);
  });

  it('GET /api/events/:id/check-in/stats should return check-in velocity and percentage', async () => {
    const res = await request(app).get(`/api/events/${EVENT_ID}/check-in/stats`);
    expect(res.status).toBe(200);
    expect(res.body.totalRegistered).toBeGreaterThan(0);
    expect(res.body.totalCheckedIn).toBeGreaterThanOrEqual(0);
    expect(typeof res.body.checkInRate).toBe('number');
  });
});
