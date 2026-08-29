import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { Submission, Rubric } from '@abhiyantrix/shared-types';
import { broadcastScoreSubmitted, broadcastLeaderboardUpdate } from '../sockets/index.js';
import { calculateLeaderboard } from '../services/leaderboard.js';
import { validateBody, SubmitScoreSchema, SubmitProjectSchema } from '../middleware/validate.js';
import { strictOperationLimiter } from '../middleware/security.js';

export const judgingRouter = Router({ mergeParams: true });

// Get Rubrics & Criteria for event
judgingRouter.get('/judging/rubrics', (req: Request, res: Response) => {
  const eventId = (req.params as { id: string }).id;
  const rubric = Array.from(store.rubrics.values()).find(r => r.eventId === eventId);
  if (!rubric) {
    return res.status(404).json({ error: 'Rubric not configured for this event' });
  }
  return res.json(rubric);
});

// Update / Configure Rubric Criteria
judgingRouter.put('/judging/rubrics', (req: Request, res: Response) => {
  const eventId = (req.params as { id: string }).id;
  const { name, description, criteria } = req.body;

  let rubric = Array.from(store.rubrics.values()).find(r => r.eventId === eventId);
  if (!rubric) {
    rubric = {
      id: `rub-${Date.now()}`,
      eventId,
      name: name || 'Evaluation Rubric',
      description: description || '',
      criteria: criteria || []
    };
    store.rubrics.set(rubric.id, rubric);
  } else {
    if (name) rubric.name = name;
    if (description) rubric.description = description;
    if (criteria) rubric.criteria = criteria;
  }

  // Recalculate leaderboard
  const updatedLeaderboard = calculateLeaderboard(eventId);
  broadcastLeaderboardUpdate(eventId, updatedLeaderboard);

  return res.json(rubric);
});

// Get Submissions for event
judgingRouter.get('/submissions', (req: Request, res: Response) => {
  const eventId = (req.params as { id: string }).id;
  const submissions = Array.from(store.submissions.values())
    .filter(s => s.eventId === eventId)
    .map(s => ({
      ...s,
      team: store.teams.get(s.teamId)
    }));

  return res.json(submissions);
});

// Create/Submit Project Artifacts (Participant side)
judgingRouter.post('/submissions', validateBody(SubmitProjectSchema), (req: Request, res: Response) => {
  const eventId = (req.params as { id: string }).id;
  const { teamId, title, description, track, repoUrl, demoUrl, pitchDeckUrl } = req.body;

  const team = store.teams.get(teamId);
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  let submission = Array.from(store.submissions.values()).find(s => s.teamId === teamId);
  if (submission) {
    submission.title = title;
    submission.description = description;
    submission.track = track || team.track;
    submission.repoUrl = repoUrl;
    submission.demoUrl = demoUrl || '';
    submission.pitchDeckUrl = pitchDeckUrl || '';
    submission.submittedAt = new Date().toISOString();
  } else {
    submission = {
      id: `sub-${teamId.replace('team-', '')}`,
      teamId,
      eventId,
      title,
      description,
      track: track || team.track,
      repoUrl,
      demoUrl: demoUrl || '',
      pitchDeckUrl: pitchDeckUrl || '',
      submittedAt: new Date().toISOString(),
      team
    };
    store.submissions.set(submission.id, submission);
  }

  // Recalculate leaderboard
  const updatedLeaderboard = calculateLeaderboard(eventId);
  broadcastLeaderboardUpdate(eventId, updatedLeaderboard);

  return res.status(201).json(submission);
});

// Get Assigned Submissions for Judge (with their previous scores if any)
judgingRouter.get('/judging/assignments', (req: Request, res: Response) => {
  const eventId = (req.params as { id: string }).id;
  const judgeId = req.query.judgeId as string;

  const submissions = Array.from(store.submissions.values()).filter(s => s.eventId === eventId);
  const rubric = Array.from(store.rubrics.values()).find(r => r.eventId === eventId);
  const scores = Array.from(store.scores.values()).filter(sc => sc.eventId === eventId);

  const assignments = submissions.map(sub => {
    const team = store.teams.get(sub.teamId);
    const existingScore = scores.find(sc => sc.submissionId === sub.id && sc.judgeId === judgeId);
    const allSubmissionScores = scores.filter(sc => sc.submissionId === sub.id);

    return {
      submission: {
        ...sub,
        team
      },
      hasEvaluated: !!existingScore,
      score: existingScore || null,
      totalEvaluationsCount: allSubmissionScores.length
    };
  });

  return res.json({
    rubric,
    assignments
  });
});

// Submit or Update Score by Judge with Zod validation & rate limiter
judgingRouter.post('/judging/scores', strictOperationLimiter, validateBody(SubmitScoreSchema), (req: Request, res: Response) => {
  const eventId = (req.params as { id: string }).id;
  const { submissionId, judgeId, criteriaScores, feedbackStrengths, feedbackImprovements } = req.body;

  const submission = store.submissions.get(submissionId);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  const judge = store.users.get(judgeId);
  const rubric = Array.from(store.rubrics.values()).find(r => r.eventId === eventId);
  if (!rubric) {
    return res.status(400).json({ error: 'Rubric not found' });
  }

  // Calculate weighted score
  let totalWeightedScore = 0;
  criteriaScores.forEach((cs: { criterionId: string; score: number }) => {
    const crit = rubric.criteria.find(c => c.id === cs.criterionId);
    if (crit) {
      totalWeightedScore += (cs.score / crit.maxScore) * (crit.weight * 100);
    }
  });
  totalWeightedScore = Math.round(totalWeightedScore * 10) / 10;

  // Check existing score
  let scoreEntry = Array.from(store.scores.values()).find(
    sc => sc.submissionId === submissionId && sc.judgeId === judgeId
  );

  const now = new Date().toISOString();
  if (scoreEntry) {
    scoreEntry.criteriaScores = criteriaScores;
    scoreEntry.totalWeightedScore = totalWeightedScore;
    scoreEntry.feedbackStrengths = feedbackStrengths || '';
    scoreEntry.feedbackImprovements = feedbackImprovements || '';
    scoreEntry.updatedAt = now;
  } else {
    scoreEntry = {
      id: `sc-${Date.now().toString().slice(-6)}`,
      submissionId,
      eventId,
      judgeId,
      judgeName: judge?.fullName || 'Judge',
      criteriaScores,
      totalWeightedScore,
      feedbackStrengths: feedbackStrengths || '',
      feedbackImprovements: feedbackImprovements || '',
      isLocked: true,
      submittedAt: now,
      updatedAt: now
    };
    store.scores.set(scoreEntry.id, scoreEntry);
  }

  // 1. Broadcast score submitted event
  broadcastScoreSubmitted(eventId, {
    submissionId,
    teamId: submission.teamId,
    judgeId,
    totalWeightedScore
  });

  // 2. Re-calculate and Broadcast Live Leaderboard
  const updatedLeaderboard = calculateLeaderboard(eventId);
  broadcastLeaderboardUpdate(eventId, updatedLeaderboard);

  return res.json({
    message: 'Score recorded and leaderboard recalculated in real time!',
    score: scoreEntry,
    totalWeightedScore,
    leaderboard: updatedLeaderboard
  });
});

// Audit Trail of all scores (for Organizer)
judgingRouter.get('/judging/audit-trail', (req: Request, res: Response) => {
  const eventId = (req.params as { id: string }).id;
  const scores = Array.from(store.scores.values())
    .filter(sc => sc.eventId === eventId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map(sc => {
      const sub = store.submissions.get(sc.submissionId);
      const team = sub ? store.teams.get(sub.teamId) : null;
      const judge = store.users.get(sc.judgeId);
      return {
        ...sc,
        submissionTitle: sub?.title,
        teamName: team?.name,
        track: team?.track,
        judgeName: judge?.fullName || sc.judgeName
      };
    });

  return res.json(scores);
});
