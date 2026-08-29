import { localStore, realtimeBus } from './localStore';

const env = (import.meta as any).env || {};
const BASE_URL: string = env.VITE_API_URL || '';

export function getApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}

export function getSocketUrl(): string {
  return env.VITE_SOCKET_URL || env.VITE_API_URL || window.location.origin;
}

// Universal API Fetcher with Automatic Local-Engine Fallback for Netlify
export async function apiFetch(url: string, options: RequestInit = {}): Promise<any> {
  const fullUrl = getApiUrl(url);

  // If running with a configured backend, try network first
  if (BASE_URL || (typeof window !== 'undefined' && window.location.port === '5173')) {
    try {
      const res = await fetch(fullUrl, options);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fall through to local simulation engine
    }
  }

  // Handle via localStore engine (Instant, 0-latency, 100% reliable for Netlify)
  const method = (options.method || 'GET').toUpperCase();
  const path = url.replace(/https?:\/\/[^/]+/, '');
  let body: any = {};
  if (options.body && typeof options.body === 'string') {
    try { body = JSON.parse(options.body); } catch {}
  }

  // 1. Auth / Users
  if (path.includes('/api/auth/users')) {
    return Array.from(localStore.users.values());
  }

  // 2. Events
  if (path.includes('/api/events/ev-abhiyantrix-2026') && method === 'GET') {
    return localStore.events.get('ev-abhiyantrix-2026');
  }

  // 3. Registrations & QR Pass
  if (path.includes('/registrations')) {
    return Array.from(localStore.registrations.values()).map(r => ({
      ...r,
      user: localStore.users.get(r.userId)
    }));
  }

  if (path.includes('/my-registration')) {
    const urlObj = new URL(url, 'http://localhost');
    const userId = urlObj.searchParams.get('userId');
    const reg = Array.from(localStore.registrations.values()).find(r => r.userId === userId);
    return { registration: reg, user: localStore.users.get(userId || '') };
  }

  if (path.includes('/register') && method === 'POST') {
    const user = {
      id: `usr-p-${Date.now().toString().slice(-5)}`,
      email: body.email,
      fullName: body.fullName,
      avatarUrl: `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(body.fullName)}`,
      role: 'participant' as const,
      collegeOrCompany: body.collegeOrCompany || 'Independent',
      skills: body.skills || ['React'],
      preferredRole: body.preferredRole || 'Hacker',
      createdAt: new Date().toISOString()
    };
    localStore.users.set(user.id, user);

    const regId = `reg-${user.id}`;
    const qrToken = localStore.generateQRToken(regId, user.id, 'ev-abhiyantrix-2026');
    const reg = {
      id: regId,
      userId: user.id,
      eventId: 'ev-abhiyantrix-2026',
      qrToken,
      status: 'registered' as const,
      tShirtSize: body.tShirtSize || 'L',
      dietaryRequirements: body.dietaryRequirements || 'None',
      registeredAt: new Date().toISOString(),
      user
    };
    localStore.registrations.set(reg.id, reg);
    return { registration: reg, user, qrToken };
  }

  // 4. Check-in Verification
  if (path.includes('/check-in/verify') && method === 'POST') {
    return localStore.verifyCheckIn(body.qrToken, body.method || 'onsite_qr_scan', body.scannedByUserId);
  }

  if (path.includes('/check-in/stats')) {
    const totalReg = localStore.registrations.size;
    const checkIns = Array.from(localStore.checkIns.values());
    return {
      totalRegistered: totalReg,
      totalCheckedIn: checkIns.length,
      checkInRate: Math.round((checkIns.length / totalReg) * 100),
      recentCheckIns: checkIns.slice(-10).reverse()
    };
  }

  // 5. Announcements
  if (path.includes('/announcements') && method === 'GET') {
    return Array.from(localStore.announcements.values()).reverse();
  }

  if (path.includes('/announcements') && method === 'POST') {
    return localStore.postAnnouncement(body.title, body.message, body.severity, body.isPinned, body.authorName);
  }

  // 6. Matchmaking & Teams
  if (path.includes('/matchmaking/teams')) {
    const urlObj = new URL(url, 'http://localhost');
    const track = urlObj.searchParams.get('track');
    let teams = Array.from(localStore.teams.values());
    if (track && track !== 'All') teams = teams.filter(t => t.track === track);
    return teams;
  }

  if (path.includes('/matchmaking/participants')) {
    const teams = Array.from(localStore.teams.values());
    return Array.from(localStore.users.values()).map(u => {
      const team = teams.find(t => t.members.some(m => m.userId === u.id));
      return {
        ...u,
        teamId: team?.id,
        teamName: team?.name,
        isAssigned: !!team
      };
    });
  }

  if (path.includes('/teams') && method === 'POST') {
    const leader = localStore.users.get(body.leaderId);
    const newTeam = {
      id: `team-${Date.now().toString().slice(-5)}`,
      eventId: 'ev-abhiyantrix-2026',
      name: body.name,
      pitch: body.pitch,
      track: body.track,
      leaderId: body.leaderId,
      members: [{ userId: body.leaderId, roleInTeam: leader?.preferredRole || 'Lead', joinedAt: new Date().toISOString(), user: leader }],
      openRoles: body.openRoles || ['Developer'],
      neededSkills: body.neededSkills || ['React'],
      isLocked: false,
      createdAt: new Date().toISOString()
    };
    localStore.teams.set(newTeam.id, newTeam);
    realtimeBus.emit('team:updated', newTeam);
    return newTeam;
  }

  if (path.includes('/join') && method === 'POST') {
    const teamId = path.split('/teams/')[1]?.split('/')[0];
    const team = localStore.teams.get(teamId);
    const user = localStore.users.get(body.userId);
    if (team && user) {
      team.members.push({ userId: user.id, roleInTeam: body.roleInTeam || user.preferredRole, joinedAt: new Date().toISOString(), user });
      realtimeBus.emit('team:updated', team);
      return { message: 'Joined team!', team };
    }
  }

  // 7. Submissions & Judging
  if (path.includes('/judging/rubrics') && method === 'GET') {
    return localStore.rubrics.get('rub-flagship-2026');
  }

  if (path.includes('/judging/assignments')) {
    const urlObj = new URL(url, 'http://localhost');
    const judgeId = urlObj.searchParams.get('judgeId');
    const rubric = localStore.rubrics.get('rub-flagship-2026');
    const subs = Array.from(localStore.submissions.values());
    const scores = Array.from(localStore.scores.values());

    const assignments = subs.map(sub => {
      const team = localStore.teams.get(sub.teamId);
      const existingScore = scores.find(sc => sc.submissionId === sub.id && sc.judgeId === judgeId);
      return {
        submission: { ...sub, team },
        hasEvaluated: !!existingScore,
        score: existingScore || null,
        totalEvaluationsCount: scores.filter(sc => sc.submissionId === sub.id).length
      };
    });

    return { rubric, assignments };
  }

  if (path.includes('/judging/scores') && method === 'POST') {
    return localStore.submitScore(
      body.submissionId,
      body.judgeId,
      body.criteriaScores,
      body.feedbackStrengths,
      body.feedbackImprovements
    );
  }

  if (path.includes('/judging/audit-trail')) {
    return Array.from(localStore.scores.values()).reverse().map(sc => {
      const sub = localStore.submissions.get(sc.submissionId);
      const team = sub ? localStore.teams.get(sub.teamId) : null;
      return {
        ...sc,
        submissionTitle: sub?.title,
        teamName: team?.name,
        track: team?.track
      };
    });
  }

  if (path.includes('/submissions') && method === 'GET') {
    return Array.from(localStore.submissions.values()).map(s => ({
      ...s,
      team: localStore.teams.get(s.teamId)
    }));
  }

  if (path.includes('/submissions') && method === 'POST') {
    const team = localStore.teams.get(body.teamId);
    const sub = {
      id: `sub-${body.teamId}`,
      teamId: body.teamId,
      eventId: 'ev-abhiyantrix-2026',
      title: body.title,
      description: body.description,
      track: body.track || team?.track || 'AI',
      repoUrl: body.repoUrl,
      demoUrl: body.demoUrl || '',
      pitchDeckUrl: body.pitchDeckUrl || '',
      submittedAt: new Date().toISOString(),
      team
    };
    localStore.submissions.set(sub.id, sub);
    const updatedLeaderboard = localStore.getLeaderboard();
    realtimeBus.emit('leaderboard:update', updatedLeaderboard);
    return sub;
  }

  // 8. Leaderboard & Analytics
  if (path.includes('/leaderboard')) {
    const urlObj = new URL(url, 'http://localhost');
    const track = urlObj.searchParams.get('track');
    return localStore.getLeaderboard(track || undefined);
  }

  if (path.includes('/analytics')) {
    return localStore.getAnalytics();
  }

  return {};
}
