import crypto from 'crypto';
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

import { persistence } from './persistence.js';

const SECRET_KEY = process.env.HMAC_SECRET || 'abhiyantrix_super_secret_hmac_signing_key_2026';

export class DataStore {
  users: Map<string, User> = new Map();
  events: Map<string, Event> = new Map();
  registrations: Map<string, Registration> = new Map();
  checkIns: Map<string, CheckInRecord> = new Map();
  teams: Map<string, Team> = new Map();
  submissions: Map<string, Submission> = new Map();
  rubrics: Map<string, Rubric> = new Map();
  scores: Map<string, ScoreSubmission> = new Map();
  announcements: Map<string, Announcement> = new Map();
  previousRankings: Map<string, Map<string, number>> = new Map(); // eventId -> (teamId -> rank)

  constructor() {
    const loaded = this.hydrateFromDisk();
    if (!loaded) {
      this.seedDemoData();
      this.persist();
    }
  }

  public persist(): void {
    const snapshot = {
      users: Array.from(this.users.entries()),
      events: Array.from(this.events.entries()),
      registrations: Array.from(this.registrations.entries()),
      checkIns: Array.from(this.checkIns.entries()),
      teams: Array.from(this.teams.entries()),
      submissions: Array.from(this.submissions.entries()),
      rubrics: Array.from(this.rubrics.entries()),
      scores: Array.from(this.scores.entries()),
      announcements: Array.from(this.announcements.entries())
    };
    persistence.saveSnapshot(snapshot);
  }

  private hydrateFromDisk(): boolean {
    const snapshot = persistence.loadSnapshot();
    if (!snapshot) return false;

    try {
      if (Array.isArray(snapshot['users'])) this.users = new Map(snapshot['users'] as [string, User][]);
      if (Array.isArray(snapshot['events'])) this.events = new Map(snapshot['events'] as [string, Event][]);
      if (Array.isArray(snapshot['registrations'])) this.registrations = new Map(snapshot['registrations'] as [string, Registration][]);
      if (Array.isArray(snapshot['checkIns'])) this.checkIns = new Map(snapshot['checkIns'] as [string, CheckInRecord][]);
      if (Array.isArray(snapshot['teams'])) this.teams = new Map(snapshot['teams'] as [string, Team][]);
      if (Array.isArray(snapshot['submissions'])) this.submissions = new Map(snapshot['submissions'] as [string, Submission][]);
      if (Array.isArray(snapshot['rubrics'])) this.rubrics = new Map(snapshot['rubrics'] as [string, Rubric][]);
      if (Array.isArray(snapshot['scores'])) this.scores = new Map(snapshot['scores'] as [string, ScoreSubmission][]);
      if (Array.isArray(snapshot['announcements'])) this.announcements = new Map(snapshot['announcements'] as [string, Announcement][]);
      return this.events.size > 0;
    } catch {
      return false;
    }
  }

  // Cryptographic QR Token signing & verification
  generateQRToken(registrationId: string, userId: string, eventId: string): string {
    const payload = `${registrationId}:${userId}:${eventId}`;
    const signature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex').substring(0, 16);
    return Buffer.from(`${payload}:${signature}`).toString('base64url');
  }

  verifyQRToken(token: string): { valid: boolean; registrationId?: string; userId?: string; eventId?: string; error?: string } {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const parts = decoded.split(':');
      if (parts.length !== 4) {
        return { valid: false, error: 'Malformed QR Token' };
      }
      const [regId, uId, evId, sig] = parts;
      const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(`${regId}:${uId}:${evId}`).digest('hex').substring(0, 16);
      
      const sigBuffer = Buffer.from(sig, 'utf8');
      const expectedSigBuffer = Buffer.from(expectedSig, 'utf8');
      
      if (sigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
        return { valid: false, error: 'Invalid Cryptographic Signature (Tampered QR)' };
      }
      return { valid: true, registrationId: regId, userId: uId, eventId: evId };
    } catch (err) {
      return { valid: false, error: 'Failed to decode QR token' };
    }
  }

  seedDemoData() {
    // 1. Flagship Event
    const flagshipEvent: Event = {
      id: 'ev-abhiyantrix-2026',
      title: 'Abhiyantrix Global HackFest 2026',
      slug: 'abhiyantrix-2026',
      description: 'The premier 48-hour multidisciplinary hackathon tackling AI Agents, Web3 DeFi, HealthTech, and Climate Innovation with $50,000+ in prize pools.',
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

    // 2. Users (Organizer, Judges, Participants)
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
        bio: 'Research scientist focusing on autonomous multi-agent reasoning and neural architectures.',
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
        bio: 'General Partner backing seed-stage cryptographic infrastructure and DeFi protocols.',
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
        bio: 'Physician-engineer evaluating next-generation diagnostic and biomedical AI solutions.',
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
        bio: 'Architecting high-throughput distributed systems and low-carbon computing grids.',
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
      { id: 'usr-p-11', name: 'Vikram Joshi (Looking for Team)', email: 'vikram.j@outlook.com', college: 'UT Austin', skills: ['React', 'TypeScript', 'TailwindCSS', 'Figma'], role: 'Frontend Dev', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-p-12', name: 'Zara Hadid (Looking for Team)', email: 'zara.hadid@cam.ac.uk', college: 'Cambridge University', skills: ['AI Agents', 'Reinforcement Learning', 'Python'], role: 'AI Specialist', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
      { id: 'usr-p-13', name: 'Ethan Hunt (Looking for Team)', email: 'ethan.h@mit.edu', college: 'MIT Media Lab', skills: ['Smart Contracts', 'DeFi', 'Rust'], role: 'Web3 Researcher', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }
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
        bio: `Passionate hacker and engineer working on cutting edge tech at ${p.college}.`,
        createdAt: new Date(Date.now() - (15 - idx) * 86400000).toISOString()
      };
      this.users.set(user.id, user);

      // Create Registration & Signed QR Token
      const regId = `reg-${p.id}`;
      const qrToken = this.generateQRToken(regId, user.id, flagshipEvent.id);
      const isCheckedIn = idx < 9; // first 9 are checked in
      const registration: Registration = {
        id: regId,
        userId: user.id,
        eventId: flagshipEvent.id,
        qrToken,
        status: isCheckedIn ? 'checked_in' : 'registered',
        tShirtSize: (['M', 'L', 'XL', 'S'][idx % 4] as any),
        dietaryRequirements: idx % 3 === 0 ? 'Vegetarian' : 'None',
        registeredAt: new Date(Date.now() - (10 - idx * 0.5) * 86400000).toISOString(),
        checkedInAt: isCheckedIn ? new Date(Date.now() - (30 - idx * 2) * 3600 * 1000).toISOString() : undefined,
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

    // 3. Rubric & Criteria
    const defaultRubric: Rubric = {
      id: 'rub-flagship-2026',
      eventId: flagshipEvent.id,
      name: 'Abhiyantrix Grand Evaluation Rubric',
      description: 'Official 100-point weighted scoring standard across Technical Rigor, Innovation, Market Impact, UI/UX, and Pitch Quality.',
      criteria: [
        { id: 'crit-tech', title: 'Technical Depth & Architecture', description: 'Code complexity, elegance of architecture, robust error handling, scalability, and stack mastery.', maxScore: 10, weight: 0.25, orderIndex: 1 },
        { id: 'crit-innov', title: 'Innovation & Originality', description: 'Uniqueness of approach, breakthrough creative problem solving, and distinct competitive advantage.', maxScore: 10, weight: 0.25, orderIndex: 2 },
        { id: 'crit-impact', title: 'Real-World Impact & Viability', description: 'Practical utility, target demographic value, commercial or open-source potential, and feasibility.', maxScore: 10, weight: 0.20, orderIndex: 3 },
        { id: 'crit-ux', title: 'UI/UX & User Experience', description: 'Design polish, accessibility, responsiveness, micro-interactions, and frictionless onboarding.', maxScore: 10, weight: 0.15, orderIndex: 4 },
        { id: 'crit-demo', title: 'Presentation & Live Demo', description: 'Clarity of pitch, live demonstration execution, structured roadmap, and cohesive team delivery.', maxScore: 10, weight: 0.15, orderIndex: 5 }
      ]
    };
    this.rubrics.set(defaultRubric.id, defaultRubric);

    // 4. Teams & Submissions
    const teamsData = [
      {
        id: 'team-neuroflow',
        name: 'NeuroFlow AI',
        pitch: 'Autonomous self-healing distributed agents for real-time edge telemetry and neuro-symbolic reasoning.',
        track: 'AI & Autonomous Agents',
        leaderId: 'usr-p-1',
        members: [{ userId: 'usr-p-1', roleInTeam: 'AI Lead' }, { userId: 'usr-p-2', roleInTeam: 'Design Lead' }],
        openRoles: ['Distributed Systems Dev'],
        neededSkills: ['Rust', 'gRPC'],
        isLocked: true,
        submission: {
          id: 'sub-neuroflow',
          title: 'NeuroFlow: Zero-Latency Autonomous Multi-Agent Fabric',
          description: 'A breakthrough agentic orchestrator that dynamically allocates sub-tasks to localized SLMs, saving 80% inference compute while preserving privacy.',
          repoUrl: 'https://github.com/abhiyantrix-demo/neuroflow-agents',
          demoUrl: 'https://neuroflow.ai.demo.live',
          pitchDeckUrl: 'https://pitch.com/neuroflow-grand-pitch'
        }
      },
      {
        id: 'team-zeropay',
        name: 'ZeroPay Protocol',
        pitch: 'Zero-Knowledge rollups for instantaneous micro-transactions and compliant privacy-preserving DeFi remittances.',
        track: 'Web3 & Decentralized Finance',
        leaderId: 'usr-p-3',
        members: [{ userId: 'usr-p-3', roleInTeam: 'Smart Contract Dev' }, { userId: 'usr-p-8', roleInTeam: 'ZK Cryptographer' }],
        openRoles: ['Frontend Web3 Dev'],
        neededSkills: ['Wagmi', 'TailwindCSS'],
        isLocked: true,
        submission: {
          id: 'sub-zeropay',
          title: 'ZeroPay: Sub-cent ZK Remittances for Cross-Border Gig Workers',
          description: 'Enables global freelance payments settled in under 400ms with verifiable zero-knowledge identity proofs.',
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
        submission: {
          id: 'sub-pulseguard',
          title: 'PulseGuard: Wearable ML Alert System for Silent Cardiac Events',
          description: 'Instant local inference engine that detects arrhythmias with 98.4% clinical sensitivity on ultra low-power smartwatches.',
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
        submission: {
          id: 'sub-ecovolt',
          title: 'EcoVolt: Algorithmic Solar Microgrid Balancing for Smart Communities',
          description: 'Dynamic load balancing protocol saving municipal microgrids over 24 metric tons of CO2 weekly through automated battery arbitrage.',
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
        submission: {
          id: 'sub-synthetix',
          title: 'Synthetix: Rapid De Novo Antibody Candidate Synthesis',
          description: 'Generates de novo antibody loop structures against novel viral epitopes in seconds instead of months of laboratory wet-lab assays.',
          repoUrl: 'https://github.com/abhiyantrix-demo/synthetix-bio',
          demoUrl: 'https://synthetix.bio.demo',
          pitchDeckUrl: 'https://pitch.com/synthetix-pitch'
        }
      },
      {
        id: 'team-sentinel',
        name: 'Sentinel DAO',
        pitch: 'Autonomous smart contract exploit prediction and automated firewall pausing mechanism.',
        track: 'Web3 & Decentralized Finance',
        leaderId: 'usr-p-5',
        members: [{ userId: 'usr-p-5', roleInTeam: 'Security Architect' }],
        openRoles: ['Solidity Auditor', 'DevRel'],
        neededSkills: ['EVM Bytecode', 'Foundry'],
        isLocked: false
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

      if (t.submission) {
        const sub: Submission = {
          id: t.submission.id,
          teamId: team.id,
          eventId: flagshipEvent.id,
          title: t.submission.title,
          description: t.submission.description,
          track: team.track,
          repoUrl: t.submission.repoUrl,
          demoUrl: t.submission.demoUrl,
          pitchDeckUrl: t.submission.pitchDeckUrl,
          submittedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
          team
        };
        this.submissions.set(sub.id, sub);
      }
    });

    // 5. Initial Judge Scores
    const seedScores = [
      // NeuroFlow evaluated by Dr. Sarah Chen & Dave Kumar
      {
        subId: 'sub-neuroflow',
        judge: judges[0],
        scores: [{ criterionId: 'crit-tech', score: 9.8 }, { criterionId: 'crit-innov', score: 9.9 }, { criterionId: 'crit-impact', score: 9.5 }, { criterionId: 'crit-ux', score: 9.0 }, { criterionId: 'crit-demo', score: 9.6 }],
        strengths: 'Spectacular multi-agent orchestration architecture! The dynamic SLM load-balancing benchmark demonstrated real zero-latency execution.',
        improvements: 'Provide more unit tests around edge network partition recovery.'
      },
      {
        subId: 'sub-neuroflow',
        judge: judges[3],
        scores: [{ criterionId: 'crit-tech', score: 9.5 }, { criterionId: 'crit-innov', score: 9.6 }, { criterionId: 'crit-impact', score: 9.4 }, { criterionId: 'crit-ux', score: 9.2 }, { criterionId: 'crit-demo', score: 9.5 }],
        strengths: 'Very solid containerized orchestration and crisp telemetry dashboard.',
        improvements: 'Quantify energy savings under heavy concurrency.'
      },

      // ZeroPay evaluated by Marcus Vance
      {
        subId: 'sub-zeropay',
        judge: judges[1],
        scores: [{ criterionId: 'crit-tech', score: 9.4 }, { criterionId: 'crit-innov', score: 9.2 }, { criterionId: 'crit-impact', score: 9.6 }, { criterionId: 'crit-ux', score: 8.8 }, { criterionId: 'crit-demo', score: 9.0 }],
        strengths: 'Flawless ZK circuits implemented in Circom with verified on-chain verification contracts.',
        improvements: 'Enhance the mobile wallet browser UX for faster proof generation on low-end devices.'
      },

      // PulseGuard evaluated by Dr. Elena Rostova
      {
        subId: 'sub-pulseguard',
        judge: judges[2],
        scores: [{ criterionId: 'crit-tech', score: 9.2 }, { criterionId: 'crit-innov', score: 9.5 }, { criterionId: 'crit-impact', score: 9.8 }, { criterionId: 'crit-ux', score: 9.1 }, { criterionId: 'crit-demo', score: 9.4 }],
        strengths: 'Life-saving clinical application with rigorous false-positive reduction benchmarks.',
        improvements: 'Clarify FDA software as medical device (SaMD) regulatory compliance pathway.'
      },

      // EcoVolt evaluated by Dave Kumar
      {
        subId: 'sub-ecovolt',
        judge: judges[3],
        scores: [{ criterionId: 'crit-tech', score: 9.0 }, { criterionId: 'crit-innov', score: 8.9 }, { criterionId: 'crit-impact', score: 9.3 }, { criterionId: 'crit-ux', score: 8.5 }, { criterionId: 'crit-demo', score: 8.8 }],
        strengths: 'Ingenious IoT sensor telemetry integration with microgrid simulation testbed.',
        improvements: 'Integrate weather forecast API for predictive solar storage dispatch.'
      },

      // Synthetix evaluated by Dr. Sarah Chen & Dr. Elena Rostova
      {
        subId: 'sub-synthetix',
        judge: judges[0],
        scores: [{ criterionId: 'crit-tech', score: 8.9 }, { criterionId: 'crit-innov', score: 9.3 }, { criterionId: 'crit-impact', score: 9.0 }, { criterionId: 'crit-ux', score: 8.7 }, { criterionId: 'crit-demo', score: 8.9 }],
        strengths: 'Very impressive 3D molecular protein diffusion visualization!',
        improvements: 'Benchmark runtime against standard AlphaFold3 and RFdiffusion baselines.'
      }
    ];

    seedScores.forEach((s, idx) => {
      const rubric = this.rubrics.get(defaultRubric.id)!;
      let totalWeighted = 0;
      s.scores.forEach(cs => {
        const crit = rubric.criteria.find(c => c.id === cs.criterionId);
        if (crit) {
          totalWeighted += (cs.score / crit.maxScore) * (crit.weight * 100);
        }
      });

      const scoreEntry: ScoreSubmission = {
        id: `sc-${idx + 1}`,
        submissionId: s.subId,
        eventId: flagshipEvent.id,
        judgeId: s.judge.id,
        judgeName: s.judge.fullName,
        criteriaScores: s.scores,
        totalWeightedScore: Math.round(totalWeighted * 10) / 10,
        feedbackStrengths: s.strengths,
        feedbackImprovements: s.improvements,
        isLocked: true,
        submittedAt: new Date(Date.now() - (8 - idx) * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - (8 - idx) * 3600 * 1000).toISOString()
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
        message: 'All teams must push final code commits, update their GitHub READMEs, and test their live demo URLs before the 6:00 PM hard cutoff. Judging round 2 begins immediately after.',
        severity: 'urgent',
        targetAudience: 'all',
        isPinned: true,
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      },
      {
        id: 'ann-2',
        eventId: flagshipEvent.id,
        authorId: organizer.id,
        authorName: 'Alex Vance (Operations)',
        title: '⚡ Sponsor Workshop: Building Low-Latency Agents on Cloud GPUs',
        message: 'Join us in Stage B or the virtual stream for a 30-minute deep-dive on optimising vLLM inference and speculative decoding with free API credits for all participants.',
        severity: 'info',
        targetAudience: 'all',
        isPinned: false,
        createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      },
      {
        id: 'ann-3',
        eventId: flagshipEvent.id,
        authorId: organizer.id,
        authorName: 'Alex Vance (Operations)',
        title: '⚠️ Food & Refreshment Restock: Midnight Snack Station Open',
        message: 'Midnight energy drinks, gourmet pizza, and vegan wraps are now available at Hall 3 catering lounge.',
        severity: 'info',
        targetAudience: 'all',
        isPinned: false,
        createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString()
      }
    ];
    seedAnnouncements.forEach(a => this.announcements.set(a.id, a));
  }
}

export const store = new DataStore();
