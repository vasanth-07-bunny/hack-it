# 📊 Data Model & Entity Relationship (ER) Diagram

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    EVENT ||--o{ REGISTRATION : "has attendees"
    EVENT ||--o{ TEAM : "hosts teams"
    EVENT ||--o{ RUBRIC : "evaluates via"
    EVENT ||--o{ ANNOUNCEMENT : "broadcasts"
    EVENT ||--o{ CHECKIN_RECORD : "logs attendance"

    USER ||--o{ REGISTRATION : "registers for"
    USER ||--o{ TEAM_MEMBER : "participates in"
    USER ||--o{ SCORE_SUBMISSION : "grades as judge"
    USER ||--o{ ANNOUNCEMENT : "authors as organizer"

    TEAM ||--o{ TEAM_MEMBER : "contains hackers"
    TEAM ||--o| SUBMISSION : "delivers project"

    SUBMISSION ||--o{ SCORE_SUBMISSION : "receives scores"
    RUBRIC ||--o{ RUBRIC_CRITERION : "consists of"
    SCORE_SUBMISSION ||--o{ CRITERION_SCORE : "grades"

    EVENT {
        string id PK
        string title
        string slug
        string description
        string startDate
        string endDate
        string venue
        string status "draft | registration_open | live | judging | completed"
        stringArray tracks
        json config
    }

    USER {
        string id PK
        string email UK
        string fullName
        string avatarUrl
        string role "participant | judge | organizer"
        string collegeOrCompany
        stringArray skills
        string preferredRole
        string createdAt
    }

    REGISTRATION {
        string id PK
        string userId FK
        string eventId FK
        string qrToken UK "HMAC-SHA256 Signed"
        string status "registered | checked_in | cancelled"
        string tShirtSize "S | M | L | XL | XXL"
        string dietaryRequirements
        string registeredAt
        string checkedInAt
        string checkInMethod
    }

    CHECKIN_RECORD {
        string id PK
        string registrationId FK
        string eventId FK
        string userId FK
        string scannedByUserId FK
        string method "onsite_qr_scan | virtual_self_checkin | organizer_override"
        string checkedInAt
    }

    TEAM {
        string id PK
        string eventId FK
        string name
        string pitch
        string track
        string leaderId FK
        stringArray openRoles
        stringArray neededSkills
        boolean isLocked
        string createdAt
    }

    SUBMISSION {
        string id PK
        string teamId FK
        string eventId FK
        string title
        string description
        string track
        string repoUrl
        string demoUrl
        string pitchDeckUrl
        string submittedAt
    }

    RUBRIC {
        string id PK
        string eventId FK
        string name
        string description
    }

    RUBRIC_CRITERION {
        string id PK
        string title
        string description
        number maxScore
        number weight "e.g. 0.25 (25%)"
        number orderIndex
    }

    SCORE_SUBMISSION {
        string id PK
        string submissionId FK
        string eventId FK
        string judgeId FK
        string judgeName
        number totalWeightedScore
        string feedbackStrengths
        string feedbackImprovements
        boolean isLocked
        string submittedAt
        string updatedAt
    }

    ANNOUNCEMENT {
        string id PK
        string eventId FK
        string authorId FK
        string authorName
        string title
        string message
        string severity "info | warning | urgent"
        string targetAudience "all | track | team"
        string targetTrack
        boolean isPinned
        string createdAt
    }
```

---

## 2. Relational Integrity & Normalization

1. **Foreign Key Constraints:** Every `Registration`, `Team`, `Submission`, and `ScoreSubmission` belongs to an existing `Event` and `User`.
2. **Deterministic Cryptographic Tokens:** The `Registration.qrToken` is an immutable, verifiable HMAC digest calculated at registration time.
3. **Atomic Score Calculation:** `ScoreSubmission.totalWeightedScore` is normalized as $\sum (\frac{\text{CriterionScore}}{\text{MaxScore}} \times \text{Weight} \times 100)$, guaranteeing a standard 0–100 scale.
