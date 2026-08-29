# 🏗️ System Architecture — Abhiyantrix Platform

## 1. High-Level Architecture Overview

Abhiyantrix is built as an event-driven, high-concurrency monorepo architecture engineered for ultra-low latency updates during live hackathons, tech fests, and multi-track conferences.

```mermaid
graph TB
    subgraph ClientLayer["Frontend Client Layer (apps/web)"]
        React["React 18 + TypeScript SPA"]
        Contexts["Auth / Event / Socket Contexts"]
        UI["Glassmorphic Design System (Tailwind CSS)"]
        QRScanner["Html5-Qrcode & QRCode.react Engine"]
        ChimeSynth["Web Audio API Chime Engine"]
    end

    subgraph TransportLayer["Real-Time Transport & API Layer"]
        REST["REST API (Express 4 + Helmet + RateLimiter + Zod)"]
        WS["WebSocket Gateway (Socket.IO Engine)"]
    end

    subgraph SecurityLayer["Security & Cryptography Engine"]
        HMAC["HMAC-SHA256 Token Signer / Verifier"]
        JWT["JWT Auth & Role Claims Validator"]
        Sanitizer["XSS & Prototype Pollution Sanitizer"]
    end

    subgraph ServiceLayer["Core Domain Services (apps/api)"]
        CheckInSvc["QR Check-In & Attendance Service"]
        MatchmakingSvc["Skill-Gap Team Formation Service"]
        JudgingSvc["Weighted Rubric Evaluation Service"]
        LeaderboardSvc["Real-time Re-ranking & Delta Engine"]
        AnalyticsSvc["Conversion Funnel & Telemetry Service"]
        AnnounceSvc["Broadcast & Priority Dispatcher"]
    end

    subgraph StorageLayer["Data & Caching Engine"]
        RelationalStore["In-Memory Relational Entity Store"]
        LeaderboardCache["Real-Time Leaderboard Cache & Standings"]
    end

    React --> TransportLayer
    REST --> SecurityLayer
    WS --> SecurityLayer
    SecurityLayer --> ServiceLayer
    ServiceLayer --> StorageLayer
    ServiceLayer -.->|Broadcast Event Push| WS
    WS -.->|Sub-100ms Push| Contexts
```

---

## 2. Real-Time WebSocket Event Pipeline

The platform establishes an active WebSocket connection per client room (partitioned by `eventId`). When state changes occur (such as a score submission or check-in), the service layer processes the update, invalidates the leaderboard cache, recalculates standings, and pushes delta updates to all connected subscribers in `< 50ms`.

```mermaid
sequenceDiagram
    autonumber
    actor Judge as Lead Judge
    participant Web as Judge Portal (Client)
    participant API as Express REST API
    participant Engine as Judging & Scoring Service
    participant Ranker as Dynamic Leaderboard Engine
    participant WS as Socket.IO Server
    actor Participant as Participant / Audience View

    Judge->>Web: Adjust Weighted Rubric Sliders (0-10)
    Judge->>Web: Click 'Submit & Lock Score'
    Web->>API: POST /api/events/:id/judging/scores
    API->>Engine: Validate Zod Schema & Calculate Weighted Total
    Engine->>Ranker: Trigger Leaderboard Recalculation
    Ranker->>Ranker: Sort Scores, Resolve Tie-Breakers, Compute Rank Deltas
    Engine->>WS: Broadcast 'score:submitted' & 'leaderboard:update'
    WS-->>Participant: Real-Time WebSocket Push (0-Refresh)
    Participant->>Participant: Podium Animation & Rank Delta (+2 / -1) Display
    API-->>Web: Return 200 OK + Updated Leaderboard Payload
```

---

## 3. Cryptographic HMAC-SHA256 QR Check-In Flow

```mermaid
sequenceDiagram
    autonumber
    actor Attendee as Attendee
    actor Org as Organizer Check-In Station
    participant Store as Data Store
    participant Engine as Cryptographic HMAC Engine

    Attendee->>Store: Complete Registration (Name, Email, Track)
    Store->>Engine: generateQRToken(regId, userId, eventId)
    Engine->>Engine: Compute HMAC-SHA256(regId:userId:eventId, SECRET_KEY)
    Engine-->>Attendee: Return Base64URL Holographic Signed QR Pass
    
    Org->>Attendee: Scan QR via Hardware Camera / Simulator
    Org->>Engine: POST /api/events/:id/check-in/verify { qrToken }
    Engine->>Engine: Re-compute HMAC and compare with Token Signature
    alt Tampered Signature
        Engine-->>Org: 400 Bad Request (Cryptographic Tamper Rejection)
    else Already Checked In
        Engine-->>Org: 409 Conflict (Duplicate Check-In Warning with Timestamp)
    else Valid & Unused
        Engine->>Store: Atomically mark status = 'checked_in'
        Engine-->>Org: 200 OK (Welcome Attendee + T-Shirt Size)
        Engine->>Org: Broadcast 'checkin:update' to Organizer Dashboard
    end
```

---

## 4. Scalability & Resilience Characteristics

1. **Sub-millisecond In-Memory Reads:** Zero disk I/O bottlenecks during live scoring rushes.
2. **Deterministic Tie-Breaking:** Leaderboard rank ties are broken via highest technical score criteria followed by submission timestamp.
3. **Graceful Degradation:** The web client seamlessly falls back to local storage and HTTP polling if WebSocket connectivity experiences edge network drops.
