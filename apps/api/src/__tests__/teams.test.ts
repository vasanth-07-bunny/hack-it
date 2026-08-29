import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import { store } from '../db/store.js';

const EVENT_ID = 'ev-abhiyantrix-2026';

describe('Smart Team Matchmaking & Formation API', () => {
  beforeEach(() => {
    store.seedDemoData();
  });

  it('GET /api/events/:id/matchmaking/participants should query participants by skills', async () => {
    const res = await request(app).get(`/api/events/${EVENT_ID}/matchmaking/participants?skill=React`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/events/:id/matchmaking/teams should query teams by open roles and track', async () => {
    const res = await request(app).get(`/api/events/${EVENT_ID}/matchmaking/teams?hasOpenRoles=true`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/events/:id/teams should create a new team with the leader', async () => {
    const res = await request(app)
      .post(`/api/events/${EVENT_ID}/teams`)
      .send({
        name: 'Neural Hive Agents',
        pitch: 'Autonomous self-optimizing multi-agent clusters on Edge compute nodes.',
        track: 'AI & Autonomous Agents',
        leaderId: 'usr-p-1',
        openRoles: ['Prompt Engineer', 'Backend Dev'],
        neededSkills: ['Python', 'LangChain', 'FastAPI']
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Neural Hive Agents');
    expect(res.body.members.length).toBe(1);
    expect(res.body.members[0].userId).toBe('usr-p-1');
  });

  it('POST /api/events/:id/teams/:teamId/join should allow a participant to join a team', async () => {
    const teams = Array.from(store.teams.values()).filter(t => t.eventId === EVENT_ID && !t.isLocked);
    expect(teams.length).toBeGreaterThan(0);
    const targetTeam = teams[0];

    const res = await request(app)
      .post(`/api/events/${EVENT_ID}/teams/${targetTeam.id}/join`)
      .send({
        userId: 'usr-p-5',
        roleInTeam: 'ML Specialist'
      });

    expect(res.status).toBe(200);
    expect(res.body.team.members.some((m: { userId: string }) => m.userId === 'usr-p-5')).toBe(true);
  });

  it('PATCH /api/events/:id/teams/:teamId/lock should lock team roster', async () => {
    const teams = Array.from(store.teams.values()).filter(t => t.eventId === EVENT_ID);
    const targetTeam = teams[0];

    const res = await request(app)
      .patch(`/api/events/${EVENT_ID}/teams/${targetTeam.id}/lock`)
      .send({ isLocked: true });

    expect(res.status).toBe(200);
    expect(res.body.team.isLocked).toBe(true);

    // Attempting to join a locked team should be rejected
    const joinRes = await request(app)
      .post(`/api/events/${EVENT_ID}/teams/${targetTeam.id}/join`)
      .send({
        userId: 'usr-p-3',
        roleInTeam: 'Designer'
      });

    expect(joinRes.status).toBe(400);
    expect(joinRes.body.error).toContain('locked');
  });
});
