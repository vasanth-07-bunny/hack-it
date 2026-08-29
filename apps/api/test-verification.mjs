// Comprehensive End-to-End Verification Test Script for Abhiyantrix Platform
const API_BASE = 'http://localhost:4000/api';
const EVENT_ID = 'ev-abhiyantrix-2026';

async function runTests() {
  console.log('🧪 Starting Abhiyantrix Platform Verification Tests...\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• Testing: ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await test('API Health Check', async () => {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    if (data.status !== 'online') throw new Error('API is not online');
  });

  // 2. Auth & Users list
  let allUsers = [];
  await test('User Directory & Roles', async () => {
    const res = await fetch(`${API_BASE}/auth/users`);
    allUsers = await res.json();
    if (allUsers.length < 5) throw new Error('Insufficient seed users');
    const roles = new Set(allUsers.map(u => u.role));
    if (!roles.has('organizer') || !roles.has('judge') || !roles.has('participant')) {
      throw new Error('Missing one or more required roles');
    }
  });

  // 3. Event Details
  await test('Event Details & Configuration', async () => {
    const res = await fetch(`${API_BASE}/events/${EVENT_ID}`);
    const event = await res.json();
    if (event.id !== EVENT_ID) throw new Error('Event ID mismatch');
    if (event.tracks.length < 4) throw new Error('Tracks missing');
  });

  // 4. Registrations & QR Token Generation
  let sampleReg = null;
  await test('Registrations & Signed QR Tokens', async () => {
    const res = await fetch(`${API_BASE}/events/${EVENT_ID}/registrations`);
    const regs = await res.json();
    if (regs.length === 0) throw new Error('No registrations found');
    sampleReg = regs.find(r => r.status !== 'checked_in') || regs[0];
    if (!sampleReg.qrToken) throw new Error('QR Token missing from registration');
  });

  // 5. QR Verification (Valid Token)
  await test('HMAC-SHA256 QR Check-in Verification', async () => {
    const res = await fetch(`${API_BASE}/events/${EVENT_ID}/check-in/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qrToken: sampleReg.qrToken,
        method: 'onsite_qr_scan',
        scannedByUserId: 'usr-org-1'
      })
    });
    const data = await res.json();
    if (!data.success && !data.alreadyCheckedIn) {
      throw new Error(`Verification failed: ${data.error}`);
    }
  });

  // 6. QR Verification (Tampered Token Security Rejection)
  await test('Tampered QR Token Security Rejection', async () => {
    const res = await fetch(`${API_BASE}/events/${EVENT_ID}/check-in/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qrToken: 'invalid_tampered_fake_signature_token',
        method: 'onsite_qr_scan'
      })
    });
    if (res.status !== 400) throw new Error(`Expected status 400 but got ${res.status}`);
  });

  // 7. Announcement Broadcast
  await test('Broadcast & Announcement Creation', async () => {
    const res = await fetch(`${API_BASE}/events/${EVENT_ID}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🚨 Test Broadcast: Final Round Kickoff',
        message: 'All participants please gather at Main Stage for judging briefing.',
        severity: 'urgent',
        targetAudience: 'all',
        isPinned: true
      })
    });
    const data = await res.json();
    if (!data.id || data.severity !== 'urgent') throw new Error('Announcement failed');
  });

  // 8. Matchmaking Teams & Participants
  await test('Smart Matchmaking & Skill Queries', async () => {
    const [teamsRes, partsRes] = await Promise.all([
      fetch(`${API_BASE}/events/${EVENT_ID}/matchmaking/teams`),
      fetch(`${API_BASE}/events/${EVENT_ID}/matchmaking/participants`)
    ]);
    const teams = await teamsRes.json();
    const parts = await partsRes.json();
    if (teams.length === 0) throw new Error('No teams returned');
    if (parts.length === 0) throw new Error('No participants returned');
  });

  // 9. Interactive Rubric & Score Submission
  await test('Rubric Evaluation & Real-Time Score Submission', async () => {
    const subRes = await fetch(`${API_BASE}/events/${EVENT_ID}/submissions`);
    const subs = await subRes.json();
    const targetSub = subs[0];

    const scoreRes = await fetch(`${API_BASE}/events/${EVENT_ID}/judging/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionId: targetSub.id,
        judgeId: 'usr-judge-1',
        criteriaScores: [
          { criterionId: 'crit-tech', score: 9.8 },
          { criterionId: 'crit-innov', score: 9.9 },
          { criterionId: 'crit-impact', score: 9.7 },
          { criterionId: 'crit-ux', score: 9.4 },
          { criterionId: 'crit-demo', score: 9.6 }
        ],
        feedbackStrengths: 'Flawless agentic orchestration under edge partition constraints!',
        feedbackImprovements: 'Expand multi-modal benchmarks.'
      })
    });
    const scoreData = await scoreRes.json();
    if (!scoreData.score || scoreData.totalWeightedScore <= 0) {
      throw new Error('Score calculation failed');
    }
  });

  // 10. Live Dynamic Leaderboard
  await test('Dynamic Leaderboard Standings & Tie-Breakers', async () => {
    const res = await fetch(`${API_BASE}/events/${EVENT_ID}/leaderboard`);
    const leaderboard = await res.json();
    if (leaderboard.rankings.length === 0) throw new Error('Leaderboard is empty');
    if (leaderboard.rankings[0].rank !== 1) throw new Error('Rank order invalid');
  });

  // 11. Executive Analytics & Funnel
  await test('Analytics Funnel & Telemetry', async () => {
    const res = await fetch(`${API_BASE}/events/${EVENT_ID}/analytics`);
    const analytics = await res.json();
    if (analytics.totalRegistered <= 0) throw new Error('Analytics registration count invalid');
    if (!analytics.registrationFunnel) throw new Error('Funnel data missing');
  });

  // 12. CSV Export
  await test('Leaderboard CSV Export', async () => {
    const res = await fetch(`${API_BASE}/events/${EVENT_ID}/export/csv`);
    const text = await res.text();
    if (!text.includes('Team Name') || !text.includes('Average Total Score')) {
      throw new Error('Invalid CSV structure');
    }
  });

  console.log(`\n========================================`);
  console.log(`🎯 Test Summary: ${passed} Passed | ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
