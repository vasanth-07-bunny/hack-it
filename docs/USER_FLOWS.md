# 🧭 User Flows & UX Wireframes

This document outlines the end-to-end journey and user flows for each of the three platform personas in Abhiyantrix: **Participant**, **Judge**, and **Organizer**.

---

## 1. 🎟️ Participant Journey

```mermaid
flowchart TD
    Start([Visit Hackathon Portal]) --> Reg[Register: Name, Track, Skills, T-Shirt]
    Reg --> Pass[Receive Holographic Digital Pass with Signed QR Token]
    Pass --> CheckIn{Check-In Station}
    CheckIn -->|Onsite| Scan[Organizer Scans QR Camera / Scanner]
    CheckIn -->|Remote| Virtual[Click Self-Serve Virtual Check-In]
    Scan --> CheckedIn[Status: Checked In]
    Virtual --> CheckedIn
    CheckedIn --> TeamHub[Explore Team Formation & Matchmaker]
    TeamHub -->|Has Idea| CreateTeam[Create Team, Set Pitch & Needed Skills]
    TeamHub -->|Looking for Team| JoinTeam[Filter by Skills & Send Join Request]
    CreateTeam --> Work[Hackathon Hacking Phase]
    JoinTeam --> Work
    Work --> Submit[Submit Project: Title, Repo URL, Demo Link, Pitch Deck]
    Submit --> LiveBoard[Watch Live Dynamic Leaderboard & Real-Time Ranks]
```

---

## 2. ⚖️ Judge Journey

```mermaid
flowchart TD
    Start([Login as Judge]) --> Queue[View Assigned Submissions Queue]
    Queue --> Filter[Filter by Track: AI Agents, Web3, HealthTech, ClimateTech]
    Filter --> Select[Select Submission & Inspect Repo / Demo / Pitch]
    Select --> Rubric[Adjust Interactive Rubric Weighted Sliders (0-10)]
    Rubric --> Feedback[Write Structured Strengths & Improvement Notes]
    Feedback --> Submit[Click 'Submit & Lock Evaluation']
    Submit --> WS[Global WebSocket Event Dispatched]
    WS --> Recalc[Real-Time Leaderboard Standings Automatically Recalculate]
    Recalc --> Next[Proceed to Next Team in Queue]
```

---

## 3. 📢 Organizer & Operations Flow

```mermaid
flowchart TD
    Start([Organizer Dashboard]) --> Overview[View Real-Time Executive Analytics]
    Overview --> Funnel[Analyze Conversion Funnel: Registered -> Checked In -> Teams -> Submissions]
    Overview --> Ops[Operations Management]
    
    subgraph Station["Check-in Station"]
        ScanCam[Hardware QR Camera Scanner]
        DevSim[1-Click Dev Simulators]
        TamperTest[Tampered Token Security Test]
    end
    
    subgraph Broadcast["Broadcast Studio"]
        Write[Draft Title, Message, Severity]
        Push[Push Real-Time WebSocket Announcement with Audio Chime]
    end

    subgraph RubricMgmt["Rubric & Audit Engine"]
        EditCrit[Configure Weights & Criteria]
        Audit[View Evaluation Audit Logs & Export CSV Report]
    end

    Ops --> Station
    Ops --> Broadcast
    Ops --> RubricMgmt
```
