import React, { useState } from 'react';
import {
  QrCode,
  Users,
  FolderGit2,
  BellRing,
  Sparkles,
  Award
} from 'lucide-react';
import { ParticipantQRPass } from '../components/qr/ParticipantQRPass';
import { TeamMatchmaker } from '../components/matchmaking/TeamMatchmaker';
import { ProjectSubmissionForm } from '../components/submission/ProjectSubmissionForm';
import { useSocket } from '../contexts/SocketContext';

export const ParticipantHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pass' | 'matchmaker' | 'submission' | 'feed'>('pass');
  const { activeAnnouncements } = useSocket();

  return (
    <div className="space-y-6">
      
      {/* Participant Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">Participant Hacker Hub</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Access your signed QR pass, find teammates, manage project submissions, and track live announcements.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center p-1 bg-slate-900/90 rounded-2xl border border-slate-800 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('pass')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'pass'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Digital QR Pass
          </button>

          <button
            onClick={() => setActiveTab('matchmaker')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'matchmaker'
                ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Team Matchmaker
          </button>

          <button
            onClick={() => setActiveTab('submission')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'submission'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            Submit Project
          </button>

          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'feed'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            Live Feed ({activeAnnouncements.length})
          </button>
        </div>
      </div>

      {/* Render Sub-View */}
      {activeTab === 'pass' && <ParticipantQRPass />}
      {activeTab === 'matchmaker' && <TeamMatchmaker />}
      {activeTab === 'submission' && <ProjectSubmissionForm />}
      {activeTab === 'feed' && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-base font-extrabold text-white">Live Broadcast Feed</h3>
          <div className="space-y-3">
            {activeAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-2xl border text-xs ${
                  ann.severity === 'urgent'
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    : ann.severity === 'warning'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-slate-900/40 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold uppercase font-mono text-[10px]">
                    {ann.severity} {ann.isPinned && '📌 PINNED'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • by {ann.authorName}
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm mb-1">{ann.title}</h4>
                <p className="text-slate-300 leading-relaxed">{ann.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
