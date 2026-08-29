# 🚀 Abhiyantrix | Smart Event Management Platform

[![CI/CD Status](https://img.shields.io/badge/CI%2FCD-passing-brightgreen?style=for-the-badge&logo=githubactions)](https://github.com/vasanth-07-bunny/hack-it/actions)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Netlify-00ad9f?style=for-the-badge&logo=netlify)](https://hac-it.netlify.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Security Hardened](https://img.shields.io/badge/Security-HMAC--SHA256%20%2B%20Helmet-success?style=for-the-badge&logo=shield)](SECURITY.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

> **A unified, real-time event management platform built for hackathons, tech fests, and multi-track conferences.**
> Consolidates the complete event lifecycle — **Registration & Cryptographic QR Check-In, Smart Team Matchmaking, Broadcast Announcements, Weighted Judging Rubrics, Dynamic Real-Time Leaderboards, and Executive Analytics** — into a high-performance interactive dashboard.

🌐 **Live Deployed Application:** [https://hac-it.netlify.app/](https://hac-it.netlify.app/)  
📂 **Public GitHub Repository:** [https://github.com/vasanth-07-bunny/hack-it](https://github.com/vasanth-07-bunny/hack-it)  
💼 **LinkedIn Showcase:** [View Announcement Post](https://www.linkedin.com/posts/chatakonda-vasanth-367aa038a_abhiyantrix-smart-event-hackathon-platform-activity-74994086347587)

---

## 🌟 Key Platform Capabilities

| Module | Core Features | Security & Tech Highlights |
|:---|:---|:---|
| **🎟️ Attendee Pass & Check-In** | • Holographic digital pass<br>• Hardware camera QR scanner<br>• 1-Click rapid dev simulator<br>• Self-serve virtual check-in | • **HMAC-SHA256 Cryptographic Signatures**<br>• Zero-trust tampered token rejection<br>• Duplicate check-in detection (`409 Conflict`) |
| **🤝 Smart Team Matchmaking** | • Skill-gap overlap scoring<br>• Dual-directory (Teams & Unassigned)<br>• 1-Click join requests<br>• Roster locking controls | • Strict max/min team size enforcement<br>• Multi-track filtering (AI, Web3, HealthTech) |
| **📢 Broadcast Center** | • Zero-refresh real-time push<br>• Urgent (`🚨`), Warning (`⚠️`), Info (`📢`)<br>• Web Audio API synthesized chimes<br>• Searchable persistent feed | • WebSocket room partitioning<br>• Input XSS sanitization & Zod validation |
| **⚖️ Interactive Judging Portal** | • Assigned submissions queue<br>• Weighted rubric sliders (0–10)<br>• Structured feedback inputs<br>• Instant score locking | • Deterministic $\sum (\frac{s}{m} \times w \times 100)$ calculation<br>• Organizer evaluation audit trail |
| **🏆 Dynamic Real-Time Leaderboard** | • Top-3 podium with crowns (🥇, 🥈, 🥉)<br>• Rank deltas (`▲ +2`, `▼ -1`, `― 0`)<br>• Criteria score breakdown modals | • Sub-50ms WebSocket push<br>• Technical score tie-breaker algorithm |
| **📊 Executive Analytics** | • Conversion funnel telemetry<br>• Check-in velocity distribution<br>• 1-Click CSV report export | • In-memory high-throughput aggregation<br>• Real-time check-in rate calculations |

---

## 🏛️ System Architecture

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

## 📚 Deliverables & Documentation

- [🏗️ System Architecture & Data Flow](docs/ARCHITECTURE.md)
- [📊 Data Model & Entity Relationship (ER) Diagram](docs/DATA_MODEL.md)
- [🧭 UX Wireframes & Persona User Flows](docs/USER_FLOWS.md)
- [📡 REST API & WebSocket Event Contract](docs/API_CONTRACT.md)
- [🛡️ Enterprise Security Policy & Threat Model](SECURITY.md)

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (`v18.0.0` or higher)
- npm (`v9.0.0` or higher)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/vasanth-07-bunny/hack-it.git
cd abhiyantrix

# Install monorepo dependencies
npm install
```

### 2. Development Mode

```bash
# Run both API (Port 4000) and Web App (Port 5173) simultaneously:
npm run dev

# Or run individually:
npm run dev:api   # Backend API & WebSocket Server
npm run dev:web   # Frontend Vite React App
```

Visit **`http://localhost:5173/`** in your browser.

---

## 🧪 Automated Testing & Verification

Abhiyantrix includes a comprehensive test suite using **Vitest** and **Supertest** covering authentication, cryptographic HMAC check-ins, weighted rubric calculations, team matchmaking, leaderboard re-ranking, and security hardening.

```bash
# Run complete unit & integration test suite
npm run test:api

# Run end-to-end platform verification script
npm run test:e2e

# Run typecheck & production build across all workspaces
npm run build
```

---

## 🔒 Security Hardening

- **Cryptographic Tamper Detection:** HMAC-SHA256 signatures ensure physical and virtual attendee QR tokens cannot be forged or tampered with.
- **Enterprise Middleware:** Protected with `helmet` CSP headers, `express-rate-limit` DDoS mitigations, and prototype-pollution-safe recursive input sanitization.
- **Strict Schema Validation:** All request payloads are strictly validated via **Zod** schemas.
- **Zero Stack Leakage:** Express global error handlers prevent internal implementation details or stack traces from exposing in production.

For detailed security guidelines and vulnerability disclosures, see [SECURITY.md](SECURITY.md).

---

## 📄 License
Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.
