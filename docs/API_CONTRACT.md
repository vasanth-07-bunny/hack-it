# 📡 API Contract (REST + WebSocket Events)

## 1. REST API Specification

### Base URL: `/api`

### A. Authentication & User Management
- `POST /api/auth/login` — Authenticate / switch persona and issue JWT session token.
  - **Body:** `{ email?: string, role?: string, userId?: string }`
  - **Response (200):** `{ token: string, user: User }`
- `GET /api/auth/users` — List registered users. Query: `?role=participant|judge|organizer`
- `GET /api/auth/me` — Return current authorized session user profile.

### B. Events & Configuration
- `GET /api/events` — List all hackathons and events.
- `GET /api/events/:id` — Retrieve event metadata, tracks, and configuration.
- `PATCH /api/events/:id/status` — Update event status (`draft`, `registration_open`, `live`, `judging`, `completed`).
- `PATCH /api/events/:id/config` — Update event rules (`allowVirtualCheckIn`, `teamRosterLocked`, `maxTeamSize`).

### C. Registration & QR Check-In
- `POST /api/events/:id/register` — Register a participant and generate signed QR code token.
  - **Body:** `{ fullName: string, email: string, collegeOrCompany?: string, skills?: string[], preferredRole?: string, tShirtSize?: string, dietaryRequirements?: string }`
  - **Response (201):** `{ message: string, registration: Registration, qrToken: string, user: User }`
- `GET /api/events/:id/my-registration` — Fetch attendee pass by `?userId=...`
- `POST /api/events/:id/check-in/verify` — Verify cryptographic HMAC QR token.
  - **Body:** `{ qrToken: string, method?: string, scannedByUserId?: string }`
  - **Response (200):** `{ success: true, message: string, registration: Registration, user: User }`
  - **Response (400):** `{ success: false, error: "Invalid Cryptographic Signature (Tampered QR)" }`
  - **Response (409):** `{ success: false, alreadyCheckedIn: true, error: string }`
- `GET /api/events/:id/check-in/stats` — Return real-time check-in counts and recent activity log.

### D. Team Formation & Matchmaking
- `GET /api/events/:id/matchmaking/participants` — Query unassigned hackers by `?skill=...&role=...&unassignedOnly=true`
- `GET /api/events/:id/matchmaking/teams` — Query teams by `?track=...&neededSkill=...&hasOpenRoles=true`
- `POST /api/events/:id/teams` — Create a new hackathon team.
- `POST /api/events/:id/teams/:teamId/join` — Join a team roster.
- `PATCH /api/events/:id/teams/:teamId/lock` — Lock team roster before judging phase.

### E. Judging & Rubric Evaluation
- `GET /api/events/:id/judging/rubrics` — Fetch weighted rubric criteria.
- `PUT /api/events/:id/judging/rubrics` — Update rubric weights and criteria.
- `GET /api/events/:id/submissions` — List all project submissions.
- `POST /api/events/:id/submissions` — Submit project demo, repo URL, and pitch deck.
- `GET /api/events/:id/judging/assignments` — Fetch submissions queue for a judge by `?judgeId=...`
- `POST /api/events/:id/judging/scores` — Submit weighted rubric score and structured feedback.
  - **Body:** `{ submissionId: string, judgeId: string, criteriaScores: [{ criterionId: string, score: number }], feedbackStrengths?: string, feedbackImprovements?: string }`
  - **Response (200):** `{ message: string, score: ScoreSubmission, totalWeightedScore: number, leaderboard: LeaderboardData }`
- `GET /api/events/:id/judging/audit-trail` — Return complete judge evaluation audit history.

### F. Leaderboard, Analytics & Export
- `GET /api/events/:id/leaderboard` — Real-time dynamic leaderboard standings. Query: `?track=...`
- `GET /api/events/:id/analytics` — Executive conversion funnel and check-in timeline telemetry.
- `GET /api/events/:id/export/csv` — Download evaluation report as formatted CSV.

### G. Broadcast Announcements
- `GET /api/events/:id/announcements` — List persistent event announcements.
- `POST /api/events/:id/announcements` — Broadcast announcement across all connected WebSocket clients.

---

## 2. WebSocket Event Contract (Socket.IO)

### Client ➔ Server Events
```typescript
interface ClientToServerEvents {
  'subscribe:event': (payload: { eventId: string; role: 'participant' | 'judge' | 'organizer'; userId?: string }) => void;
  'unsubscribe:event': (payload: { eventId: string }) => void;
}
```

### Server ➔ Client Events
```typescript
interface ServerToClientEvents {
  'announcement:new': (announcement: Announcement) => void;
  'checkin:update': (payload: { totalCheckedIn: number; totalRegistered: number; record: CheckInRecord }) => void;
  'score:submitted': (payload: { submissionId: string; teamId: string; judgeId: string; totalWeightedScore: number }) => void;
  'leaderboard:update': (payload: LeaderboardData) => void;
  'team:updated': (team: Team) => void;
  'event:status_changed': (payload: { eventId: string; status: EventStatus }) => void;
}
```
