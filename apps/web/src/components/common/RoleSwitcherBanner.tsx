import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldCheck, Award, User, Sparkles } from 'lucide-react';

interface RoleSwitcherBannerProps {
  onSelectTab?: (tab: 'organizer' | 'judge' | 'participant' | 'leaderboard' | 'splitscreen') => void;
}

export const RoleSwitcherBanner: React.FC<RoleSwitcherBannerProps> = ({ onSelectTab }) => {
  const { currentUser, allUsers, switchUser } = useAuth();

  const presets = [
    {
      label: '👔 Lead Organizer',
      userId: 'usr-org-1',
      tab: 'organizer' as const,
      color: 'border-cyan-500/30 hover:border-cyan-400 bg-cyan-500/10 text-cyan-300'
    },
    {
      label: '👩‍🔬 Lead Judge (Dr. Sarah Chen)',
      userId: 'usr-judge-1',
      tab: 'judge' as const,
      color: 'border-purple-500/30 hover:border-purple-400 bg-purple-500/10 text-purple-300'
    },
    {
      label: '⚡ Participant (Rohan - NeuroFlow)',
      userId: 'usr-p-1',
      tab: 'participant' as const,
      color: 'border-emerald-500/30 hover:border-emerald-400 bg-emerald-500/10 text-emerald-300'
    },
    {
      label: '🔍 Participant (Vikram - Need Team)',
      userId: 'usr-p-11',
      tab: 'participant' as const,
      color: 'border-amber-500/30 hover:border-amber-400 bg-amber-500/10 text-amber-300'
    }
  ];

  return (
    <div className="bg-slate-900/60 border-b border-slate-800/80 py-1.5 px-4 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
          <span className="hidden sm:inline">Active Persona:</span>
          <span className="text-slate-200 font-semibold bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            {currentUser?.fullName} ({currentUser?.role.toUpperCase()})
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 hidden md:inline">Quick Switch:</span>
          {presets.map((p) => {
            const isActive = currentUser?.id === p.userId;
            return (
              <button
                key={p.userId}
                onClick={() => {
                  switchUser(p.userId);
                  if (onSelectTab) onSelectTab(p.tab);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                  isActive
                    ? 'ring-2 ring-brand-cyan shadow-sm font-bold ' + p.color
                    : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
