import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useEvent } from '../../contexts/EventContext';
import {
  Sparkles,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  Award,
  Users,
  Trophy,
  Columns3,
  UserCheck,
  Radio
} from 'lucide-react';

export type ActiveTab = 'organizer' | 'judge' | 'participant' | 'leaderboard' | 'splitscreen';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, currentRole, allUsers, switchUser } = useAuth();
  const { isConnected, audioEnabled, toggleAudio, activeAnnouncements } = useSocket();
  const { event } = useEvent();

  const urgentCount = activeAnnouncements.filter(a => a.severity === 'urgent').length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-cyan via-brand-purple to-brand-violet p-0.5 shadow-lg shadow-brand-cyan/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-cyan animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-purple text-lg sm:text-xl">
                  ABHIYANTRIX
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                  REAL-TIME v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">
                {event?.title || 'Smart Event Platform'}
              </p>
            </div>
          </div>

          {/* Navigation Role Tabs */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('organizer')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'organizer'
                  ? 'bg-gradient-to-r from-brand-cyan/20 to-brand-blue/20 text-brand-cyan border border-brand-cyan/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Organizer
            </button>

            <button
              onClick={() => setActiveTab('judge')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'judge'
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Judge Portal
            </button>

            <button
              onClick={() => setActiveTab('participant')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'participant'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Participant Hub
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Leaderboard
            </button>

            <button
              onClick={() => setActiveTab('splitscreen')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'splitscreen'
                  ? 'bg-gradient-to-r from-brand-cyan/20 via-purple-500/20 to-pink-500/20 text-brand-cyan border border-brand-cyan/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5 text-brand-cyan" />
              Split Demo
            </button>
          </nav>

          {/* Right Controls: Persona Switcher, Audio, Socket Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Live Socket Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
              title={isConnected ? 'WebSocket Connected — Live Updates Active' : 'Connecting to WebSocket...'}
            >
              {isConnected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="hidden sm:inline">LIVE FEED</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-rose-400 animate-pulse" />
                  <span className="hidden sm:inline">OFFLINE</span>
                </>
              )}
            </div>

            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-lg border transition-colors ${
                audioEnabled
                  ? 'bg-slate-800/80 border-slate-700 text-brand-cyan hover:bg-slate-700'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={audioEnabled ? 'Sound Alerts: Enabled (Click to Mute)' : 'Sound Alerts: Muted'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Persona Switcher Selector */}
            <div className="relative">
              <select
                value={currentUser?.id || ''}
                onChange={(e) => switchUser(e.target.value)}
                aria-label="Active Persona Role"
                className="bg-slate-900/90 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 py-1.5 pl-3 pr-8 appearance-none cursor-pointer focus:outline-none focus:border-brand-cyan hover:border-slate-600 transition-colors"
              >
                <optgroup label="👑 Organizer">
                  {allUsers
                    .filter(u => u.role === 'organizer')
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} (Admin)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="⚖️ Judges">
                  {allUsers
                    .filter(u => u.role === 'judge')
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.preferredRole.replace('Lead Judge', '')})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="🚀 Participants">
                  {allUsers
                    .filter(u => u.role === 'participant')
                    .slice(0, 6)
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.preferredRole})
                      </option>
                    ))}
                </optgroup>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>
        </div>

        {/* Mobile Sub-Navigation */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('organizer')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md ${
              activeTab === 'organizer' ? 'bg-brand-cyan/20 text-brand-cyan' : 'text-slate-400'
            }`}
          >
            Organizer
          </button>
          <button
            onClick={() => setActiveTab('judge')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md ${
              activeTab === 'judge' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400'
            }`}
          >
            Judge
          </button>
          <button
            onClick={() => setActiveTab('participant')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md ${
              activeTab === 'participant' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
            }`}
          >
            Participant
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md ${
              activeTab === 'leaderboard' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('splitscreen')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md ${
              activeTab === 'splitscreen' ? 'bg-brand-cyan/20 text-brand-cyan' : 'text-slate-400'
            }`}
          >
            Split
          </button>
        </div>

      </div>
    </header>
  );
};
