import { Router, Request, Response } from 'express';
import { geminiService } from '../services/gemini.js';
import { store } from '../db/store.js';
import { calculateLeaderboard } from '../services/leaderboard.js';
import jwt from 'jsonwebtoken';

export const googleRouter = Router({ mergeParams: true });
const JWT_SECRET = process.env.JWT_SECRET || 'abhiyantrix_jwt_dev_key_2026';

// 1. Google Gemini AI Matchmaking Synergy Copilot
googleRouter.post('/ai/matchmaking', async (req: Request, res: Response) => {
  const { participantSkills, preferredRole, teamNeededSkills, teamPitch } = req.body;
  const analysis = await geminiService.analyzeMatchmaking(
    Array.isArray(participantSkills) ? participantSkills : ['Full-Stack Dev'],
    preferredRole || 'Hacker',
    Array.isArray(teamNeededSkills) ? teamNeededSkills : ['React', 'Node.js'],
    teamPitch || 'Innovation project'
  );
  return res.json({ service: 'Google Gemini Pro 1.5 Engine', analysis });
});

// 2. Google Gemini AI Judging Evaluation Copilot
googleRouter.post('/ai/judging-copilot', async (req: Request, res: Response) => {
  const { title, description, track, repoUrl } = req.body;
  const insights = await geminiService.generateJudgingInsights(
    title || 'Submission',
    description || 'Hackathon Prototype',
    track || 'AI & Autonomous Agents',
    repoUrl || 'https://github.com/vasanth-07-bunny/hack-it'
  );
  return res.json({ service: 'Google Gemini Pro 1.5 Engine', insights });
});

// 3. Google Sign-In & OAuth 2.0 Identity Integration
googleRouter.post('/auth/google-signin', (req: Request, res: Response) => {
  const { email, name, picture, googleId } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Google email is required' });
  }

  let user = Array.from(store.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    user = {
      id: `usr-g-${Date.now().toString().slice(-6)}`,
      email,
      fullName: name || 'Google Innovator',
      avatarUrl: picture || `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(name || email)}`,
      role: 'participant',
      collegeOrCompany: 'Google Cloud Developer Community',
      skills: ['Google Cloud Platform', 'Gemini AI', 'Firebase'],
      preferredRole: 'AI Engineer',
      createdAt: new Date().toISOString()
    };
    store.users.set(user.id, user);
    store.persist();
  }

  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.fullName, provider: 'google.com' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    provider: 'Google Identity OAuth 2.0',
    token,
    user
  });
});

// 4. Google Maps Platform Venue Navigation & Geofence Coordinates
googleRouter.get('/maps/venue', (_req: Request, res: Response) => {
  return res.json({
    platform: 'Google Maps Platform SDK',
    venueName: 'Innovation Tech Hub & Grand Convention Hall',
    coordinates: {
      latitude: 17.4447,
      longitude: 78.3789
    },
    geofenceRadiusMeters: 250,
    googleMapsUrl: 'https://maps.google.com/?q=17.4447,78.3789',
    formattedAddress: 'Cyber Towers Quad, HITEC City, Hyderabad, India'
  });
});

// 5. Google Sheets 1-Click Sync Data Export
googleRouter.get('/sheets/export', (req: Request, res: Response) => {
  const eventId = (req.query.eventId as string) || 'ev-abhiyantrix-2026';
  const leaderboard = calculateLeaderboard(eventId);

  const sheetsPayload = {
    spreadsheetTitle: `Abhiyantrix 2026 - Hackathon Evaluation Sheet`,
    syncTimestamp: new Date().toISOString(),
    columns: ['Rank', 'Team Name', 'Track', 'Project Title', 'Weighted Total Score', 'Evaluations Count', 'Repo Link'],
    rows: leaderboard.rankings.map(r => {
      const sub = r.submissionId ? store.submissions.get(r.submissionId) : null;
      return [
        r.rank,
        r.teamName,
        r.track,
        r.submissionTitle || '',
        r.totalScore,
        r.judgeCount,
        sub?.repoUrl || ''
      ];
    })
  };

  return res.json({
    service: 'Google Sheets API Sync Engine',
    data: sheetsPayload
  });
});
