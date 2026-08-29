import React, { useState } from 'react';
import {
  Columns3,
  Award,
  Trophy,
  ShieldCheck,
  Users,
  Sparkles,
  RefreshCw,
  QrCode
} from 'lucide-react';
import { ScoringWorkspace } from '../components/judging/ScoringWorkspace';
import { LiveLeaderboardView } from '../components/leaderboard/LiveLeaderboardView';
import { QRCheckInStation } from '../components/qr/QRCheckInStation';
import { AnnouncementStudio } from '../components/announcements/AnnouncementStudio';
import { ParticipantQRPass } from '../components/qr/ParticipantQRPass';

export const SplitScreenDemo: React.FC = () => {
  const [leftView, setLeftView] = useState<'judge' | 'organizer_checkin' | 'announcements'>('judge');
  const [rightView, setRightView] = useState<'leaderboard' | 'participant_pass'>('leaderboard');

  return (
    <div className="space-y-4">
      
      {/* Top Banner explaining Real-Time Syncing */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-brand-cyan/30">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-cyan/20 text-brand-cyan">
            <Columns3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
              Dual-Pane Real-Time WebSocket Sandbox
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-cyan/20 text-brand-cyan">
                LIVE INTERACTIVE
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Submit a score or broadcast an alert on the left pane → watch the right pane update instantly without reloading!
            </p>
          </div>
        </div>

        {/* Pane Selectors */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Left Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-bold">Left:</span>
            <select
              value={leftView}
              onChange={(e: any) => setLeftView(e.target.value)}
              className="glass-input rounded-xl px-2.5 py-1 text-xs text-brand-cyan font-bold"
            >
              <option value="judge">⚖️ Judge Scoring</option>
              <option value="organizer_checkin">🎟️ QR Check-In</option>
              <option value="announcements">📢 Broadcasts</option>
            </select>
          </div>

          {/* Right Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-bold">Right:</span>
            <select
              value={rightView}
              onChange={(e: any) => setRightView(e.target.value)}
              className="glass-input rounded-xl px-2.5 py-1 text-xs text-amber-300 font-bold"
            >
              <option value="leaderboard">🏆 Live Leaderboard</option>
              <option value="participant_pass">🎫 Participant Pass</option>
            </select>
          </div>
        </div>
      </div>

      {/* Split Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        
        {/* Left View Column */}
        <div className="p-4 rounded-3xl bg-slate-950/40 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-300 uppercase">
            <span className="flex items-center gap-1.5 text-brand-cyan">
              <Sparkles className="w-3.5 h-3.5" />
              Source Action Pane ({leftView.toUpperCase()})
            </span>
          </div>
          {leftView === 'judge' && <ScoringWorkspace />}
          {leftView === 'organizer_checkin' && <QRCheckInStation />}
          {leftView === 'announcements' && <AnnouncementStudio />}
        </div>

        {/* Right View Column */}
        <div className="p-4 rounded-3xl bg-slate-950/40 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-300 uppercase">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Trophy className="w-3.5 h-3.5" />
              Real-time Output Target ({rightView.toUpperCase()})
            </span>
          </div>
          {rightView === 'leaderboard' && <LiveLeaderboardView compact={true} />}
          {rightView === 'participant_pass' && <ParticipantQRPass />}
        </div>

      </div>

    </div>
  );
};
