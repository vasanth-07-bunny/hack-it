# Context Prompt — Smart Event Management Platform (Abhiyantrix)

## 1. Project Brief

Build a **Unified Smart Event Management Platform** for large-scale tech events (hackathons, tech fests, conferences). Today, organizers stitch together separate tools for registration, check-in, team formation, announcements, judging, and leaderboards — causing admin overhead and a fragmented participant experience.

**Goal:** One real-time, multi-role dashboard covering the full event lifecycle — registration → check-in → team formation → live announcements → judging → leaderboard/analytics — for three roles: **Participant, Judge, Organizer**.

---

## 2. Tech Stack

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, Lucide Icons, Glassmorphic UI Design System
- **State/data sync:** React Query / React Context + Socket.IO Client for real-time WebSocket push
- **Backend:** Node.js Express with TypeScript, REST + WebSocket (Socket.IO) API
- **Database & Cache:** High-performance In-Memory + Relational Data Engine with realistic seeder + Real-time Leaderboard Cache
- **Auth & Security:** JWT-based auth with role claims (`participant`, `judge`, `organizer`), HMAC-SHA256 Signed QR verification
- **QR codes:** `qrcode.react` (generation) + `html5-qrcode` (camera scanning) + 1-Click Dev Simulators
- **Architecture:** Monorepo (`/apps/web`, `/apps/api`, `/packages/shared-types`)

---

## 3. Core Roles & Permissions

| Role | Can do |
|---|---|
| **Participant** | Register, receive signed QR code pass, check in, browse/join team formation board, view announcements, view own team's submission & live leaderboard position |
| **Judge** | View assigned submissions/teams, score against weighted rubric, leave structured feedback, view live leaderboard |
| **Organizer** | Full admin: manage event config, verify check-ins (camera or virtual), push live announcements, manage judging rubrics & assignments, view analytics dashboard & CSV export |

---

## 4. Deliverables to Produce

1. **System Architecture Diagram**
2. **UX Wireframes / User Flow Map**
3. **Data Model / ER Diagram**
4. **API Contract (REST + WebSocket events)**
5. **Interactive Prototype** with seeded demo event, QR scanner + dev simulator, live scoring leaderboard re-ranking, and real-time announcements
6. **Organizer Analytics Dashboard**
