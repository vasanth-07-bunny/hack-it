import {
  User,
  Event,
  Registration,
  CheckInRecord,
  Team,
  Submission,
  Rubric,
  ScoreSubmission,
  Announcement,
  EventAnalytics,
  LeaderboardData,
  TeamRanking
} from '@abhiyantrix/shared-types';

// Real-Time Cross-Tab / In-Memory Event Bus
class EventBus {
  private channel: BroadcastChannel | null = null;
  private listeners: { [event: string]: ((data: any) => void)[] } = {};

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('abhiyantrix_bus');
      this.channel.onmessage = (msg) => {
        const { event, data } = msg.data;
        this.emitLocal(event, data);
      };
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event: string, callback: (data: any) => void) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, data: any) {
    this.emitLocal(event, data);
    if (this.channel) {
      this.channel.postMessage({ event, data });
    }
  }

  private emitLocal(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

export const realtimeBus = new EventBus();

// Persistent Local Database Engine for Static Cloud Deployments (Netlify)
class LocalStore {
  users: Map<string, User> = new Map();
  events: Map<string, Event> = new Map();
  registrations: Map<string, Registration> = new Map();
  checkIns: Map<string, CheckInRecord> = new Map();
  teams: Map<string, Team> = new Map();
  submissions: Map<string, Submission> = new Map();
  rubrics: Map<string, Rubric> = new Map();
  scores: Map<string, ScoreSubmission> = new Map();
  announcements: Map<string, Announcement> = new Map();
  previousRankings: Map<string, number> = new Map(); // teamId -> rank

  constructor() {
    this.initSeedData();
  }

  // Cryptographic token simulator
  generateQRToken(regId: string, userId: string, eventId: string): string {
    const payload = `${regId}:${userId}:${eventId}`;
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      hash = (hash << 5) - hash + payload.charCodeAt(i);
      hash |= 0;
    }
    const sig = Math.abs(hash).toString(16).padStart(8, '0');
    return btoa(`${payload}:${sig}`).replace(/=/g, '');
  }

  verifyQRToken(token: string): { valid: boolean; registrationId?: string; userId?: string; eventId?: string; error?: string } {
    try {
      const decoded = atob(token);
      const parts = decoded.split(':');
      if (parts.length !== 4) {
        return { valid: false, error: 'Malformed QR Token structure' };
      }
      const [regId, uId, evId, sig] = parts;
      const payload = `${regId}:${uId}:${evId}`;
      let hash = 0;
      for (let i = 0; i < payload.length; i++) {
        hash = (hash << 5) - hash + payload.charCodeAt(i);
        hash |= 0;
      }
      const expectedSig = Math.abs(hash).toString(16).padStart(8, '0');
      if (sig !== expectedSig) {
        return { valid: false, error: 'Invalid Cryptographic Signature (Tampered QR)' };
      }
      return { valid: true, registrationId: regId, userId: uId, eventId: evId };
    } catch {
      return { valid: false, error: 'Cryptographic decoding failed' };
    }
  }

  initSeedData() {
    // 1. Event
    const flagshipEvent: Event = {
      id: 'ev-abhiyantrix-2026',
      title: 'Abhiyantrix Global HackFest 2026',
      slug: 'abhiyantrix-2026',
      description: 'The premier 48-hour multidisciplinary hackathon tackling AI Agents, Web3 DeFi, HealthTech, and Climate Innovation.',
      startDate: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      endDate: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      venue: 'Innovation Tech Hub, Convention Grand Hall & Virtual Metaverse',
      status: 'judging',
      tracks: [
        'AI & Autonomous Agents',
        'Web3 & Decentralized Finance',
        'HealthTech & BioInformatics',
        'ClimateTech & Smart Cities'
      ],
      config: {
        allowVirtualCheckIn: true,
        teamRosterLocked: false,
        maxTeamSize: 4,
        minTeamSize: 2,
        tracks: [
          'AI & Autonomous Agents',
          'Web3 & Decentralized Finance',
          'HealthTech & BioInformatics',
          'ClimateTech & Smart Cities'
        ]
      }
    };
    this.events.set(flagshipEvent.id, flagshipEvent);

    // 2. Users
    const organizer: User = {
      id: 'usr-org-1',
      email: 'lead.organizer@abhiyantrix.io',
      fullName: 'Alex Vance (Lead Organizer)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'organizer',
      collegeOrCompany: 'Abhiyantrix Foundation',
      skills: ['Event Operations', 'System Architecture', 'Community Management'],
      preferredRole: 'Event Director',
      bio: 'Leading operations and hackathon infrastructure for 5,000+ engineers globally.',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
    };
    this.users.set(organizer.id, organizer);

    const judges: User[] = [
      {
        id: 'usr-judge-1',
        email: 'sarah.chen@deepai.org',
        fullName: 'Dr. Sarah Chen',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        role: 'judge',
        collegeOrCompany: 'DeepMind Research Fellow / MIT',
        skills: ['Generative AI', 'LLM Architectures', 'Computer Vision', 'PyTorch'],
        preferredRole: 'AI & Agents Lead Judge',
        bio: 'Research scientist focusing on autonomous multi-agent reasoning.',
        createdAt: new Date(Date.now() - 8 * 86400000).toISOString()
      },
      {
        id: 'usr-judge-2',
        email: 'marcus.vance@soliditylabs.io',
        fullName: 'Marcus Vance',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: 'judge',
        collegeOrCompany: 'Decentralized Capital Ventures',
        skills: ['Smart Contracts', 'Zero Knowledge', 'DeFi Protocols', 'Rust'],
        preferredRole: 'Web3 Lead Judge',
        bio: 'Backing seed-stage cryptographic infrastructure.',
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
      },
      {
        id: 'usr-judge-3',
        email: 'elena.rostova@healthpulse.ai',
        fullName: 'Dr. Elena Rostova',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        role: 'judge',
        collegeOrCompany: 'BioTech Innovations Stanford',
        skills: ['BioInformatics', 'Clinical ML', 'Medical Devices', 'Python'],
        preferredRole: 'HealthTech Lead Judge',
        bio: 'Evaluating next-generation biomedical AI solutions.',
        createdAt: new Date(Date.now() - 6 * 86400000).toISOString()
      },
      {
        id: 'usr-judge-4',
        email: 'dave.kumar@cloudscale.net',
        fullName: 'Dave Kumar',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        role: 'judge',
        collegeOrCompany: 'CloudScale Principal Architect',
        skills: ['Distributed Systems', 'Kubernetes', 'Scalability', 'Go'],
        preferredRole: 'Infrastructure & Climate Judge',
        bio: 'Architecting high-throughput distributed systems.',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
      }
    ];
    judges.forEach(j => this.users.set(j.id, j));

    // Participants
    const participantsData = [
      { id: 'usr-p-1', name: 'Rohan Sharma', email: 'rohan.sharma@tech.edu', college: 'Stanford University', skills: ['Python', 'FastAPI', 'PyTorch', 'LangChain'], role: 'AI/ML Engineer', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-p-2', name: 'Maya Lin', email: 'maya.lin@design.io', college: 'RISD / Berkeley', skills: ['UI/UX', 'Figma', 'React', 'TailwindCSS'], role: 'Product Designer', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-p-3', name: 'Kabir Patel', email: 'kabir.p@dev.org', college: 'Carnegie Mellon', skills: ['Rust', 'Solidity', 'Ethereum', 'TypeScript'], role: 'Smart Contract Dev', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-p-4', name: 'Chloe Dubois', email: 'chloe.d@sorbonne.fr', college: 'École Polytechnique', skills: ['Computer Vision', 'PyTorch', 'C++', 'OpenCV'], role: 'ML Researcher', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-p-5', name: 'Arjun Nair', email: 'arjun.nair@iitb.ac.in', college: 'IIT Bombay', skills: ['Node.js', 'Go', 'PostgreSQL', 'Docker'], role: 'Backend Architect', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-p-6', name: 'Aisha Al-Mansoor', email: 'aisha.m@kaust.edu.sa', college: 'KAUST', skills: ['BioInformatics', 'Genomics', 'Python', 'Next.js'], role: 'HealthTech Specialist', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-p-7', name: 'Liam O’Connor', email: 'liam.oc@trinity.ie', college: 'Trinity College Dublin', skills: ['React Native', 'WebSockets', 'TailwindCSS', 'GraphQL'], role: 'Frontend Engineer', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-p-8', name: 'Sophia Chen', email: 'sophia.chen@waterloo.ca', college: 'University of Waterloo', skills: ['Solidity', 'Zero Knowledge', 'Rust', 'Web3.js'], role: 'DeFi Engineer', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-p-9', name: 'David Kim', email: 'david.kim@kaist.ac.kr', college: 'KAIST', skills: ['IoT', 'Embedded C', 'Climate Sensors', 'MQTT'], role: 'IoT / Hardware Dev', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-p-10', name: 'Priya Sundaram', email: 'priya.sundaram@gatech.edu', college: 'Georgia Tech', skills: ['NLP', 'Transformers', 'FastAPI', 'RAG'], role: 'AI/ML Engineer', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-p-11', name: 'Vikram Joshi (Looking for Team)', email: 'vikram.j@outlook.com', college: 'UT Austin', skills: ['React', 'TypeScript', 'TailwindCSS', 'Figma'], role: 'Frontend Dev', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' }
    ];

    participantsData.forEach((p, idx) => {
      const user: User = {
        id: p.id,
        email: p.email,
        fullName: p.name,
        avatarUrl: p.avatar,
        role: 'participant',
        collegeOrCompany: p.college,
        skills: p.skills,
        preferredRole: p.role,
        bio: `Hacker and builder from ${p.college}.`,
        createdAt: new Date(Date.now() - (15 - idx) * 86400000).toISOString()
      };
      this.users.set(user.id, user);

      const regId = `reg-${p.id}`;
      const qrToken = this.generateQRToken(regId, user.id, flagshipEvent.id);
      const isCheckedIn = idx < 8; // first 8 checked in
      const registration: Registration = {
        id: regId,
        userId: user.id,
        eventId: flagshipEvent.id,
        qrToken,
        status: isCheckedIn ? 'checked_in' : 'registered',
        tShirtSize: (['M', 'L', 'XL', 'S'][idx % 4] as any),
        dietaryRequirements: idx % 3 === 0 ? 'Vegetarian' : 'None',
        registeredAt: new Date(Date.now() - (10 - idx * 0.5) * 86400000).toISOString(),
        checkedInAt: isCheckedIn ? new Date(Date.now() - (24 - idx * 2) * 3600 * 1000).toISOString() : undefined,
        checkInMethod: isCheckedIn ? (idx % 2 === 0 ? 'onsite_qr_scan' : 'virtual_self_checkin') : undefined,
        user
      };
      this.registrations.set(registration.id, registration);

      if (isCheckedIn) {
        const checkInRecord: CheckInRecord = {
          id: `chk-${regId}`,
          registrationId: regId,
          eventId: flagshipEvent.id,
          userId: user.id,
          scannedByUserId: organizer.id,
          method: registration.checkInMethod!,
          checkedInAt: registration.checkedInAt!,
          user
        };
        this.checkIns.set(checkInRecord.id, checkInRecord);
      }
    });

    // 3. Rubric
    const defaultRubric: Rubric = {
      id: 'rub-flagship-2026',
      eventId: flagshipEvent.id,
      name: 'Abhiyantrix Grand Evaluation Rubric',
      description: 'Official 100-point weighted scoring standard across Technical Rigor, Innovation, Market Impact, UI/UX, and Pitch Quality.',
      criteria: [
        { id: 'crit-tech', title: 'Technical Depth & Architecture', description: 'Code complexity, scalability, and stack mastery.', maxScore: 10, weight: 0.25, orderIndex: 1 },
        { id: 'crit-innov', title: 'Innovation & Originality', description: 'Uniqueness of approach and competitive advantage.', maxScore: 10, weight: 0.25, orderIndex: 2 },
        { id: 'crit-impact', title: 'Real-World Impact & Viability', description: 'Practical utility, demographic value, commercial potential.', maxScore: 10, weight: 0.20, orderIndex: 3 },
        { id: 'crit-ux', title: 'UI/UX & User Experience', description: 'Design polish, accessibility, responsiveness, micro-interactions.', maxScore: 10, weight: 0.15, orderIndex: 4 },
        { id: 'crit-demo', title: 'Presentation & Live Demo', description: 'Clarity of pitch, live demonstration, team delivery.', maxScore: 10, weight: 0.15, orderIndex: 5 }
      ]
    };
    this.rubrics.set(defaultRubric.id, defaultRubric);

    // 4. Teams & Submissions
    const teamsData = [
      {
        id: 'team-neuroflow',
        name: 'NeuroFlow AI',
        pitch: 'Autonomous self-healing distributed agents for real-time edge telemetry and reasoning.',
        track: 'AI & Autonomous Agents',
        leaderId: 'usr-p-1',
        members: [{ userId: 'usr-p-1', roleInTeam: 'AI Lead' }, { userId: 'usr-p-2', roleInTeam: 'Design Lead' }],
        openRoles: ['Distributed Systems Dev'],
        neededSkills: ['Rust', 'gRPC'],
        isLocked: true,
        sub: {
          id: 'sub-neuroflow',
          title: 'NeuroFlow: Zero-Latency Autonomous Multi-Agent Fabric',
          description: 'A breakthrough agentic orchestrator dynamically allocating sub-tasks to localized SLMs, saving 80% compute while preserving privacy.',
          repoUrl: 'https://github.com/abhiyantrix-demo/neuroflow-agents',
          demoUrl: 'https://neuroflow.ai.demo.live',
          pitchDeckUrl: 'https://pitch.com/neuroflow-grand-pitch'
        }
      },
      {
        id: 'team-zeropay',
        name: 'ZeroPay Protocol',
        pitch: 'Zero-Knowledge rollups for instantaneous micro-transactions and compliant remittances.',
        track: 'Web3 & Decentralized Finance',
        leaderId: 'usr-p-3',
        members: [{ userId: 'usr-p-3', roleInTeam: 'Smart Contract Dev' }, { userId: 'usr-p-8', roleInTeam: 'ZK Cryptographer' }],
        openRoles: ['Frontend Web3 Dev'],
        neededSkills: ['Wagmi', 'TailwindCSS'],
        isLocked: true,
        sub: {
          id: 'sub-zeropay',
          title: 'ZeroPay: Sub-cent ZK Remittances for Cross-Border Workers',
          description: 'Enables global freelance payments settled in under 400ms with verifiable zero-knowledge proofs.',
          repoUrl: 'https://github.com/abhiyantrix-demo/zeropay-zk',
          demoUrl: 'https://zeropay.finance.demo',
          pitchDeckUrl: 'https://pitch.com/zeropay-pitch-deck'
        }
      },
      {
        id: 'team-pulseguard',
        name: 'PulseGuard Health',
        pitch: 'Early biomarker detection and on-device ECG anomaly classification using lightweight vision transformers.',
        track: 'HealthTech & BioInformatics',
        leaderId: 'usr-p-6',
        members: [{ userId: 'usr-p-6', roleInTeam: 'BioInformatics Lead' }, { userId: 'usr-p-4', roleInTeam: 'ML Specialist' }],
        openRoles: ['Mobile Dev (Flutter/React Native)'],
        neededSkills: ['React Native', 'Bluetooth Low Energy'],
        isLocked: true,
        sub: {
          id: 'sub-pulseguard',
          title: 'PulseGuard: Wearable ML Alert System for Silent Cardiac Events',
          description: 'Instant local inference engine detecting arrhythmias with 98.4% clinical sensitivity on ultra low-power smartwatches.',
          repoUrl: 'https://github.com/abhiyantrix-demo/pulseguard-health',
          demoUrl: 'https://pulseguard.health.demo',
          pitchDeckUrl: 'https://pitch.com/pulseguard-clinical-deck'
        }
      },
      {
        id: 'team-ecovolt',
        name: 'EcoVolt Grid',
        pitch: 'Decentralized peer-to-peer renewable microgrid dispatch powered by smart city IoT telemetry.',
        track: 'ClimateTech & Smart Cities',
        leaderId: 'usr-p-9',
        members: [{ userId: 'usr-p-9', roleInTeam: 'Hardware/IoT Dev' }, { userId: 'usr-p-5', roleInTeam: 'Backend Architect' }],
        openRoles: ['Energy Trading Specialist'],
        neededSkills: ['Smart Contracts', 'Time Series DB'],
        isLocked: true,
        sub: {
          id: 'sub-ecovolt',
          title: 'EcoVolt: Algorithmic Solar Microgrid Balancing for Smart Communities',
          description: 'Dynamic load balancing protocol saving municipal microgrids over 24 metric tons of CO2 weekly through automated arbitrage.',
          repoUrl: 'https://github.com/abhiyantrix-demo/ecovolt-microgrid',
          demoUrl: 'https://ecovolt.energy.demo',
          pitchDeckUrl: 'https://pitch.com/ecovolt-deck'
        }
      },
      {
        id: 'team-synthetix',
        name: 'Synthetix Bio',
        pitch: 'Generative protein design pipeline leveraging diffusion models for targeted molecular docking.',
        track: 'HealthTech & BioInformatics',
        leaderId: 'usr-p-10',
        members: [{ userId: 'usr-p-10', roleInTeam: 'AI/ML Engineer' }, { userId: 'usr-p-7', roleInTeam: 'Frontend Lead' }],
        openRoles: ['Computational Chemist'],
        neededSkills: ['PyMOL', 'BioPython'],
        isLocked: false,
        sub: {
          id: 'sub-synthetix',
          title: 'Synthetix: Rapid De Novo Antibody Candidate Synthesis',
          description: 'Generates de novo antibody loop structures against novel viral epitopes in seconds instead of months of wet-lab assays.',
          repoUrl: 'https://github.com/abhiyantrix-demo/synthetix-bio',
          demoUrl: 'https://synthetix.bio.demo',
          pitchDeckUrl: 'https://pitch.com/synthetix-pitch'
        }
      }
    ];

    teamsData.forEach(t => {
      const team: Team = {
        id: t.id,
        eventId: flagshipEvent.id,
        name: t.name,
        pitch: t.pitch,
        track: t.track,
        leaderId: t.leaderId,
        members: t.members.map(m => ({
          userId: m.userId,
          roleInTeam: m.roleInTeam,
          joinedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
          user: this.users.get(m.userId)
        })),
        openRoles: t.openRoles,
        neededSkills: t.neededSkills,
        isLocked: t.isLocked,
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      };
      this.teams.set(team.id, team);

      if (t.sub) {
        const sub: Submission = {
          id: t.sub.id,
          teamId: team.id,
          eventId: flagshipEvent.id,
          title: t.sub.title,
          description: t.sub.description,
          track: team.track,
          repoUrl: t.sub.repoUrl,
          demoUrl: t.sub.demoUrl,
          pitchDeckUrl: t.sub.pitchDeckUrl,
          submittedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
          team
        };
        this.submissions.set(sub.id, sub);
      }
    });

    // 5. Initial Scores
    const seedScores = [
      { subId: 'sub-neuroflow', judge: judges[0], scoreVal: 95.8, strengths: 'Spectacular multi-agent orchestration architecture!' },
      { subId: 'sub-neuroflow', judge: judges[3], scoreVal: 94.6, strengths: 'Very solid containerized orchestration and crisp telemetry.' },
      { subId: 'sub-zeropay', judge: judges[1], scoreVal: 93.2, strengths: 'Flawless ZK circuits implemented in Circom.' },
      { subId: 'sub-pulseguard', judge: judges[2], scoreVal: 94.2, strengths: 'Life-saving clinical application with high accuracy.' },
      { subId: 'sub-ecovolt', judge: judges[3], scoreVal: 90.0, strengths: 'Ingenious IoT sensor telemetry integration.' },
      { subId: 'sub-synthetix', judge: judges[0], scoreVal: 91.5, strengths: 'Impressive 3D molecular protein diffusion visualization.' }
    ];

    seedScores.forEach((s, idx) => {
      const scoreEntry: ScoreSubmission = {
        id: `sc-${idx + 1}`,
        submissionId: s.subId,
        eventId: flagshipEvent.id,
        judgeId: s.judge.id,
        judgeName: s.judge.fullName,
        criteriaScores: [
          { criterionId: 'crit-tech', score: 9.5 },
          { criterionId: 'crit-innov', score: 9.6 },
          { criterionId: 'crit-impact', score: 9.4 },
          { criterionId: 'crit-ux', score: 9.2 },
          { criterionId: 'crit-demo', score: 9.5 }
        ],
        totalWeightedScore: s.scoreVal,
        feedbackStrengths: s.strengths,
        feedbackImprovements: 'Expand production error boundaries.',
        isLocked: true,
        submittedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
      };
      this.scores.set(scoreEntry.id, scoreEntry);
    });

    // 6. Announcements
    const seedAnnouncements: Announcement[] = [
      {
        id: 'ann-1',
        eventId: flagshipEvent.id,
        authorId: organizer.id,
        authorName: 'Alex Vance (Operations)',
        title: '🚨 CRITICAL: Final Project Submission & Demo Lock at 6:00 PM Sharp!',
        message: 'All teams must push final code commits, update their GitHub READMEs, and test their live demo URLs before the 6:00 PM hard cutoff.',
        severity: 'urgent',
        targetAudience: 'all',
        isPinned: true,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 'ann-2',
        eventId: flagshipEvent.id,
        authorId: organizer.id,
        authorName: 'Alex Vance (Operations)',
        title: '⚡ Sponsor Workshop: Building Low-Latency Agents on Cloud GPUs',
        message: 'Join Stage B for a 30-minute deep-dive on optimizing vLLM inference and speculative decoding with free API credits.',
        severity: 'info',
        targetAudience: 'all',
        isPinned: false,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      }
    ];
    seedAnnouncements.forEach(a => this.announcements.set(a.id, a));
  }

  // Action: Check-in Verification
  verifyCheckIn(qrToken: string, method: string, scannedByUserId?: string) {
    const ver = this.verifyQRToken(qrToken);
    if (!ver.valid || !ver.registrationId) {
      return { success: false, error: ver.error || 'Invalid or Tampered QR Token' };
    }

    const reg = this.registrations.get(ver.registrationId);
    if (!reg) {
      return { success: false, error: 'Registration not found' };
    }

    const user = this.users.get(reg.userId);

    if (reg.status === 'checked_in') {
      return {
        success: false,
        alreadyCheckedIn: true,
        error: `Attendee ${user?.fullName || 'User'} already checked in at ${new Date(reg.checkedInAt!).toLocaleTimeString()}`,
        registration: reg,
        user
      };
    }

    const checkedInAt = new Date().toISOString();
    reg.status = 'checked_in';
    reg.checkedInAt = checkedInAt;
    reg.checkInMethod = method as any;

    const checkInRecord: CheckInRecord = {
      id: `chk-${Date.now()}`,
      registrationId: reg.id,
      eventId: reg.eventId,
      userId: reg.userId,
      scannedByUserId: scannedByUserId || 'usr-org-1',
      method: method as any,
      checkedInAt,
      user
    };
    this.checkIns.set(checkInRecord.id, checkInRecord);

    const totalRegistered = this.registrations.size;
    const totalCheckedIn = this.checkIns.size;

    // Realtime broadcast
    realtimeBus.emit('checkin:update', {
      totalCheckedIn,
      totalRegistered,
      record: checkInRecord
    });

    return {
      success: true,
      message: `Verification Successful! Welcome ${user?.fullName}`,
      registration: reg,
      user,
      checkInRecord,
      checkedInAt
    };
  }

  // Action: Submit Score
  submitScore(submissionId: string, judgeId: string, criteriaScores: any[], feedbackStrengths: string, feedbackImprovements: string) {
    const sub = this.submissions.get(submissionId);
    const judge = this.users.get(judgeId);
    const rubric = this.rubrics.get('rub-flagship-2026');

    let totalWeightedScore = 0;
    criteriaScores.forEach((cs: { criterionId: string; score: number }) => {
      const crit = rubric?.criteria.find(c => c.id === cs.criterionId);
      if (crit) {
        totalWeightedScore += (cs.score / crit.maxScore) * (crit.weight * 100);
      }
    });
    totalWeightedScore = Math.round(totalWeightedScore * 10) / 10;

    let scoreEntry = Array.from(this.scores.values()).find(
      sc => sc.submissionId === submissionId && sc.judgeId === judgeId
    );

    const now = new Date().toISOString();
    if (scoreEntry) {
      scoreEntry.criteriaScores = criteriaScores;
      scoreEntry.totalWeightedScore = totalWeightedScore;
      scoreEntry.feedbackStrengths = feedbackStrengths;
      scoreEntry.feedbackImprovements = feedbackImprovements;
      scoreEntry.updatedAt = now;
    } else {
      scoreEntry = {
        id: `sc-${Date.now().toString().slice(-6)}`,
        submissionId,
        eventId: 'ev-abhiyantrix-2026',
        judgeId,
        judgeName: judge?.fullName || 'Judge',
        criteriaScores,
        totalWeightedScore,
        feedbackStrengths,
        feedbackImprovements,
        isLocked: true,
        submittedAt: now,
        updatedAt: now
      };
      this.scores.set(scoreEntry.id, scoreEntry);
    }

    // Real-time broadcast
    realtimeBus.emit('score:submitted', {
      submissionId,
      teamId: sub?.teamId,
      judgeId,
      totalWeightedScore
    });

    const updatedLeaderboard = this.getLeaderboard();
    realtimeBus.emit('leaderboard:update', updatedLeaderboard);

    return {
      message: 'Score recorded and leaderboard recalculated in real time!',
      score: scoreEntry,
      totalWeightedScore,
      leaderboard: updatedLeaderboard
    };
  }

  // Action: Broadcast Announcement
  postAnnouncement(title: string, message: string, severity: any, isPinned: boolean, authorName?: string) {
    const ann: Announcement = {
      id: `ann-${Date.now().toString().slice(-6)}`,
      eventId: 'ev-abhiyantrix-2026',
      authorId: 'usr-org-1',
      authorName: authorName || 'Alex Vance (Operations)',
      title,
      message,
      severity,
      targetAudience: 'all',
      isPinned,
      createdAt: new Date().toISOString()
    };
    this.announcements.set(ann.id, ann);
    realtimeBus.emit('announcement:new', ann);
    return ann;
  }

  // Calculate Leaderboard
  getLeaderboard(filterTrack?: string): LeaderboardData {
    const subs = Array.from(this.submissions.values());
    const allScores = Array.from(this.scores.values());
    const rubric = this.rubrics.get('rub-flagship-2026');

    const rankings: TeamRanking[] = [];

    subs.forEach(sub => {
      const team = this.teams.get(sub.teamId);
      if (!team) return;
      if (filterTrack && filterTrack !== 'All' && team.track !== filterTrack) return;

      const subScores = allScores.filter(sc => sc.submissionId === sub.id);
      const judgeCount = subScores.length;
      let averageScore = 0;
      const criteriaBreakdown: { [criterionId: string]: number } = {};

      if (judgeCount > 0) {
        const sum = subScores.reduce((acc, s) => acc + s.totalWeightedScore, 0);
        averageScore = Math.round((sum / judgeCount) * 10) / 10;

        rubric?.criteria.forEach(crit => {
          const values = subScores.map(sc => {
            const val = sc.criteriaScores.find(cs => cs.criterionId === crit.id);
            return val ? val.score : 0;
          });
          const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
          criteriaBreakdown[crit.id] = Math.round(avg * 10) / 10;
        });
      }

      rankings.push({
        rank: 0,
        teamId: team.id,
        teamName: team.name,
        track: team.track,
        submissionTitle: sub.title,
        totalScore: averageScore,
        judgeCount,
        criteriaBreakdown,
        rankDelta: 0,
        submissionId: sub.id
      });
    });

    rankings.sort((a, b) => b.totalScore - a.totalScore || b.judgeCount - a.judgeCount);

    rankings.forEach((r, idx) => {
      r.rank = idx + 1;
      const prev = this.previousRankings.get(r.teamId);
      if (prev !== undefined) {
        r.rankDelta = prev - r.rank;
      }
      this.previousRankings.set(r.teamId, r.rank);
    });

    return {
      eventId: 'ev-abhiyantrix-2026',
      lastUpdated: new Date().toISOString(),
      rankings,
      tracks: [
        'AI & Autonomous Agents',
        'Web3 & Decentralized Finance',
        'HealthTech & BioInformatics',
        'ClimateTech & Smart Cities'
      ]
    };
  }

  // Calculate Analytics
  getAnalytics(): EventAnalytics {
    const totalReg = this.registrations.size;
    const totalChk = this.checkIns.size;
    const teams = Array.from(this.teams.values());
    const subs = Array.from(this.submissions.values());
    const scores = Array.from(this.scores.values());

    const trackCounts: { [t: string]: number } = {};
    teams.forEach(t => { trackCounts[t.track] = (trackCounts[t.track] || 0) + 1; });
    const trackDistribution = Object.entries(trackCounts).map(([track, teamCount]) => ({ track, teamCount }));

    return {
      eventId: 'ev-abhiyantrix-2026',
      totalRegistered: totalReg,
      totalCheckedIn: totalChk,
      checkInRatePercentage: Math.round((totalChk / totalReg) * 100),
      totalTeams: teams.length,
      totalSubmissions: subs.length,
      totalJudges: 4,
      totalScoresSubmitted: scores.length,
      judgingCompletionPercentage: Math.min(100, Math.round((scores.length / 10) * 100)),
      registrationFunnel: {
        registered: totalReg,
        checkedIn: totalChk,
        teamFormed: teams.reduce((acc, t) => acc + t.members.length, 0),
        submitted: subs.length
      },
      checkInTimeline: [
        { timeBucket: '08:00 - 10:00', count: 4 },
        { timeBucket: '10:00 - 12:00', count: 3 },
        { timeBucket: '12:00 - 14:00', count: 2 },
        { timeBucket: 'Live / Virtual', count: Array.from(this.checkIns.values()).filter(c => c.method === 'virtual_self_checkin').length }
      ],
      trackDistribution,
      topSkillsCloud: [
        { skill: 'PyTorch', count: 8 },
        { skill: 'React', count: 7 },
        { skill: 'Solidity', count: 5 },
        { skill: 'Rust', count: 4 },
        { skill: 'FastAPI', count: 4 },
        { skill: 'Figma', count: 3 }
      ]
    };
  }
}

export const localStore = new LocalStore();
