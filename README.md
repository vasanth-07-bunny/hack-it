# 🚀 Abhiyantrix | Smart Event Management Platform

A unified, real-time event management platform built for hackathons, tech fests, and conferences that consolidates the end-to-end event lifecycle (Registration & QR Check-in, Smart Team Matchmaking, Broadcast Announcements, Interactive Judging, and Live Leaderboard Analytics) into a single high-performance interactive dashboard.

---

## 🌟 Key Features

1. **🎟️ Registration & QR Attendee Check-In**:
   - Holographic digital pass with HMAC-SHA256 cryptographically signed QR tokens.
   - Dual-mode check-in station with hardware camera scanning + 1-click rapid dev simulators + tampered token detection.
   - Self-serve virtual check-in for remote participants.

2. **🤝 Smart Team Formation & Matchmaking**:
   - Match compatibility percentage scores based on skill-gap overlap.
   - Dual-directory: Explore teams needing open roles or discover unassigned hackers.
   - 1-click join requests and roster lock controls.

3. **📢 Broadcast & Announcement Center**:
   - Real-time WebSocket push across all connected views with zero page refresh.
   - Urgent (`🚨`), Warning (`⚠️`), and General Info (`📢`) severity levels with Web Audio API synthesized chimes.
   - Searchable and filterable persistent announcement feed.

4. **⚖️ Interactive Judging Portal**:
   - Assigned submissions queue categorized by track.
   - Interactive weighted rubric sliders (0–10) with live calculated weighted totals.
   - Structured feedback inputs and one-click score locking triggering global real-time re-ranking.

5. **🏆 Dynamic Real-Time Leaderboard**:
   - Top 3 podium showcase with Gold 🥇, Silver 🥈, and Bronze 🥉 crowns.
   - Live rankings table with rank movement deltas (`▲ +2`, `▼ -1`, `― 0`) and criteria breakdown modals.

6. **📊 Executive Analytics & CSV Export**:
   - Event lifecycle conversion funnel (`Registered → Checked In → In Teams → Submitted`).
   - Check-in velocity time distribution charts.
   - 1-Click CSV export of full evaluation reports.

7. **⚡ Split-Screen Sandbox & Persona Switcher**:
   - Instant 1-click persona switching (Organizer, Lead Judge, Participants).
   - Dual-pane split screen to test real-time WebSocket syncing in a single window.

---

## 🛠️ Tech Stack

- **Monorepo Architecture**:
  - `apps/web`: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, QRCode.react, Html5-Qrcode, Canvas Confetti.
  - `apps/api`: Node.js, Express, Socket.IO, TypeScript, In-Memory Relational Engine, Crypto HMAC.
  - `packages/shared-types`: Shared TypeScript interfaces and WebSocket event contracts.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm / yarn / pnpm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/abhiyantrix.git
cd abhiyantrix

# 2. Install monorepo dependencies
npm install

# 3. Start the Backend API & Real-Time WebSocket Server (Port 4000)
cd apps/api
npm run dev

# 4. In a separate terminal, start the Frontend Dashboard (Port 5173)
cd apps/web
npm run dev
```

Visit **`http://localhost:5173/`** in your browser.

---

## 🧪 Running Verification Tests

To run the automated end-to-end verification test suite:

```bash
cd apps/api
node test-verification.mjs
```

---

## 📄 License
MIT
