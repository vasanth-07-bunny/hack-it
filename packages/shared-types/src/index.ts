export type UserRole = 'participant' | 'judge' | 'organizer';

export type EventStatus = 'draft' | 'registration_open' | 'live' | 'judging' | 'completed';

export type CheckInMethod = 'onsite_qr_scan' | 'virtual_self_checkin' | 'organizer_override';

export type AnnouncementSeverity = 'info' | 'warning' | 'urgent';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  collegeOrCompany: string;
  skills: string[];
  preferredRole: string; // e.g. "Full-Stack Dev", "AI/ML Engineer", "UI/UX Designer", "Product Manager"
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  createdAt: string;
}

export interface EventConfig {
  allowVirtualCheckIn: boolean;
  teamRosterLocked: boolean;
  maxTeamSize: number;
  minTeamSize: number;
  tracks: string[];
  bannerUrl?: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  status: EventStatus;
  tracks: string[];
  config: EventConfig;
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  qrToken: string;
  status: 'registered' | 'checked_in' | 'cancelled';
  tShirtSize: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  dietaryRequirements: string;
  teamId?: string;
  registeredAt: string;
  checkedInAt?: string;
  checkInMethod?: CheckInMethod;
  user?: User;
}

export interface CheckInRecord {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  scannedByUserId?: string;
  method: CheckInMethod;
  checkedInAt: string;
  user?: User;
}

export interface TeamMember {
  userId: string;
  roleInTeam: string;
  joinedAt: string;
  user?: User;
}

export interface Team {
  id: string;
  eventId: string;
  name: string;
  pitch: string;
  track: string;
  leaderId: string;
  members: TeamMember[];
  openRoles: string[];
  neededSkills: string[];
  isLocked: boolean;
  createdAt: string;
}

export interface Submission {
  id: string;
  teamId: string;
  eventId: string;
  title: string;
  description: string;
  track: string;
  repoUrl: string;
  demoUrl: string;
  pitchDeckUrl?: string;
  submittedAt: string;
  team?: Team;
}

export interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  maxScore: number;
  weight: number; // e.g., 0.25 for 25%
  orderIndex: number;
}

export interface Rubric {
  id: string;
  eventId: string;
  name: string;
  description: string;
  criteria: RubricCriterion[];
}

export interface CriterionScoreValue {
  criterionId: string;
  score: number;
}

export interface ScoreSubmission {
  id: string;
  submissionId: string;
  eventId: string;
  judgeId: string;
  judgeName?: string;
  criteriaScores: CriterionScoreValue[];
  totalWeightedScore: number;
  feedbackStrengths: string;
  feedbackImprovements: string;
  isLocked: boolean;
  submittedAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  eventId: string;
  authorId: string;
  authorName: string;
  title: string;
  message: string;
  severity: AnnouncementSeverity;
  targetAudience: 'all' | 'track' | 'team';
  targetTrack?: string;
  isPinned: boolean;
  createdAt: string;
}

export interface TeamRanking {
  rank: number;
  teamId: string;
  teamName: string;
  track: string;
  submissionTitle?: string;
  totalScore: number;
  judgeCount: number;
  criteriaBreakdown: { [criterionId: string]: number };
  rankDelta: number; // e.g., +1, 0, -2
  submissionId?: string;
}

export interface LeaderboardData {
  eventId: string;
  lastUpdated: string;
  rankings: TeamRanking[];
  tracks: string[];
}

export interface EventAnalytics {
  eventId: string;
  totalRegistered: number;
  totalCheckedIn: number;
  checkInRatePercentage: number;
  totalTeams: number;
  totalSubmissions: number;
  totalJudges: number;
  totalScoresSubmitted: number;
  judgingCompletionPercentage: number;
  registrationFunnel: {
    registered: number;
    checkedIn: number;
    teamFormed: number;
    submitted: number;
  };
  checkInTimeline: {
    timeBucket: string;
    count: number;
  }[];
  trackDistribution: {
    track: string;
    teamCount: number;
  }[];
  topSkillsCloud: {
    skill: string;
    count: number;
  }[];
}

// WebSocket Event Contracts
export interface ServerToClientEvents {
  'announcement:new': (announcement: Announcement) => void;
  'checkin:update': (payload: { totalCheckedIn: number; totalRegistered: number; record: CheckInRecord }) => void;
  'score:submitted': (payload: { submissionId: string; teamId: string; judgeId: string; totalWeightedScore: number }) => void;
  'leaderboard:update': (payload: LeaderboardData) => void;
  'team:updated': (team: Team) => void;
  'event:status_changed': (payload: { eventId: string; status: EventStatus }) => void;
}

export interface ClientToServerEvents {
  'subscribe:event': (payload: { eventId: string; role: UserRole; userId?: string }) => void;
  'unsubscribe:event': (payload: { eventId: string }) => void;
}
