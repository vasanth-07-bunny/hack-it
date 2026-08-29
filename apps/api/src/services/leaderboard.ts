import { store } from '../db/store.js';
import { LeaderboardData, TeamRanking } from '@abhiyantrix/shared-types';

export function calculateLeaderboard(eventId: string, filterTrack?: string): LeaderboardData {
  const event = store.events.get(eventId);
  if (!event) {
    return {
      eventId,
      lastUpdated: new Date().toISOString(),
      rankings: [],
      tracks: []
    };
  }

  // Get all submissions for this event
  const submissions = Array.from(store.submissions.values()).filter(s => s.eventId === eventId);
  const rubric = Array.from(store.rubrics.values()).find(r => r.eventId === eventId);
  const allScores = Array.from(store.scores.values()).filter(sc => sc.eventId === eventId);

  // Group scores by submission
  const rankings: TeamRanking[] = [];

  submissions.forEach(sub => {
    const team = store.teams.get(sub.teamId);
    if (!team) return;

    if (filterTrack && filterTrack !== 'All' && team.track !== filterTrack) {
      return;
    }

    const subScores = allScores.filter(sc => sc.submissionId === sub.id);
    const judgeCount = subScores.length;

    let averageTotalWeightedScore = 0;
    const criteriaBreakdown: { [criterionId: string]: number } = {};

    if (judgeCount > 0) {
      const sumWeighted = subScores.reduce((acc, sc) => acc + sc.totalWeightedScore, 0);
      averageTotalWeightedScore = Math.round((sumWeighted / judgeCount) * 10) / 10;

      // Calculate average per criterion
      rubric?.criteria.forEach(crit => {
        const critValues = subScores.map(sc => {
          const val = sc.criteriaScores.find(cs => cs.criterionId === crit.id);
          return val ? val.score : 0;
        });
        const critAvg = critValues.length > 0 ? critValues.reduce((a, b) => a + b, 0) / critValues.length : 0;
        criteriaBreakdown[crit.id] = Math.round(critAvg * 10) / 10;
      });
    }

    rankings.push({
      rank: 0, // Assigned after sorting
      teamId: team.id,
      teamName: team.name,
      track: team.track,
      submissionTitle: sub.title,
      totalScore: averageTotalWeightedScore,
      judgeCount,
      criteriaBreakdown,
      rankDelta: 0,
      submissionId: sub.id
    });
  });

  // Sort descending by totalScore, then by judgeCount (tie-breaker)
  rankings.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    return b.judgeCount - a.judgeCount;
  });

  // Assign ranks and calculate rankDelta based on previous rankings
  let prevEventRankings = store.previousRankings.get(eventId);
  if (!prevEventRankings) {
    prevEventRankings = new Map();
    store.previousRankings.set(eventId, prevEventRankings);
  }

  const currentRankMap = new Map<string, number>();

  rankings.forEach((r, idx) => {
    r.rank = idx + 1;
    const prevRank = prevEventRankings!.get(r.teamId);
    if (prevRank !== undefined) {
      r.rankDelta = prevRank - r.rank; // e.g. prev was 3, now 1 -> delta = +2
    } else {
      r.rankDelta = 0;
    }
    currentRankMap.set(r.teamId, r.rank);
  });

  // Update previous rankings cache for next comparison
  store.previousRankings.set(eventId, currentRankMap);

  return {
    eventId,
    lastUpdated: new Date().toISOString(),
    rankings,
    tracks: event.tracks
  };
}
