import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { calculateLeaderboard } from '../services/leaderboard.js';
import { calculateAnalytics } from '../services/analytics.js';

export const leaderboardRouter = Router({ mergeParams: true });

// Live Leaderboard Data
leaderboardRouter.get('/leaderboard', (req: Request, res: Response) => {
  const eventId = (req.params as { id: string }).id;
  const track = req.query.track as string;
  const data = calculateLeaderboard(eventId, track);
  return res.json(data);
});

// Event Analytics & Funnel
leaderboardRouter.get('/analytics', (req: Request, res: Response) => {
  const eventId = (req.params as { id: string }).id;
  const analytics = calculateAnalytics(eventId);
  return res.json(analytics);
});

// CSV Export for Post-Event Reports
leaderboardRouter.get('/export/csv', (req: Request, res: Response) => {
  const eventId = (req.params as { id: string }).id;
  const leaderboard = calculateLeaderboard(eventId);
  const event = store.events.get(eventId);

  const headers = ['Rank', 'Team Name', 'Track', 'Project Title', 'Average Total Score', 'Evaluations Count', 'Repo URL', 'Demo URL'];
  const rows = leaderboard.rankings.map(r => {
    const sub = r.submissionId ? store.submissions.get(r.submissionId) : null;
    return [
      r.rank,
      `"${r.teamName.replace(/"/g, '""')}"`,
      `"${r.track}"`,
      `"${(r.submissionTitle || '').replace(/"/g, '""')}"`,
      r.totalScore,
      r.judgeCount,
      `"${sub?.repoUrl || ''}"`,
      `"${sub?.demoUrl || ''}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${event?.slug || 'event'}-leaderboard-report.csv"`);
  return res.send(csvContent);
});
