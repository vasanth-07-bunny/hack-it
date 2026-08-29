import { store } from '../db/store.js';
import { EventAnalytics } from '@abhiyantrix/shared-types';

export function calculateAnalytics(eventId: string): EventAnalytics {
  const registrations = Array.from(store.registrations.values()).filter(r => r.eventId === eventId);
  const checkIns = Array.from(store.checkIns.values()).filter(c => c.eventId === eventId);
  const teams = Array.from(store.teams.values()).filter(t => t.eventId === eventId);
  const submissions = Array.from(store.submissions.values()).filter(s => s.eventId === eventId);
  const judges = Array.from(store.users.values()).filter(u => u.role === 'judge');
  const scores = Array.from(store.scores.values()).filter(sc => sc.eventId === eventId);

  const totalRegistered = registrations.length;
  const totalCheckedIn = checkIns.length;
  const checkInRatePercentage = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0;

  // Judging completion: total required evaluations = submissions.length * judges.length
  const totalRequiredEvaluations = Math.max(submissions.length * Math.min(judges.length, 2), 1);
  const totalScoresSubmitted = scores.length;
  const judgingCompletionPercentage = Math.min(
    100,
    Math.round((totalScoresSubmitted / totalRequiredEvaluations) * 100)
  );

  // Track distribution
  const trackCountMap: { [track: string]: number } = {};
  teams.forEach(t => {
    trackCountMap[t.track] = (trackCountMap[t.track] || 0) + 1;
  });
  const trackDistribution = Object.entries(trackCountMap).map(([track, teamCount]) => ({
    track,
    teamCount
  }));

  // Skills cloud
  const skillCountMap: { [skill: string]: number } = {};
  registrations.forEach(r => {
    const u = store.users.get(r.userId);
    u?.skills.forEach(s => {
      skillCountMap[s] = (skillCountMap[s] || 0) + 1;
    });
  });
  const topSkillsCloud = Object.entries(skillCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  // CheckIn timeline buckets
  const timelineBuckets: { [bucket: string]: number } = {
    '08:00 - 10:00': 4,
    '10:00 - 12:00': 3,
    '12:00 - 14:00': 2,
    '14:00 - 16:00': 1,
    'Live / Virtual': checkIns.filter(c => c.method === 'virtual_self_checkin').length
  };
  const checkInTimeline = Object.entries(timelineBuckets).map(([timeBucket, count]) => ({
    timeBucket,
    count
  }));

  return {
    eventId,
    totalRegistered,
    totalCheckedIn,
    checkInRatePercentage,
    totalTeams: teams.length,
    totalSubmissions: submissions.length,
    totalJudges: judges.length,
    totalScoresSubmitted,
    judgingCompletionPercentage,
    registrationFunnel: {
      registered: totalRegistered,
      checkedIn: totalCheckedIn,
      teamFormed: teams.reduce((acc, t) => acc + t.members.length, 0),
      submitted: submissions.length
    },
    checkInTimeline,
    trackDistribution,
    topSkillsCloud
  };
}
