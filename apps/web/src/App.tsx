import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { EventProvider } from './contexts/EventContext';
import { Navbar, ActiveTab } from './components/common/Navbar';
import { RoleSwitcherBanner } from './components/common/RoleSwitcherBanner';
import { LiveAnnouncementBanner } from './components/common/LiveAnnouncementBanner';
import { ToastContainer } from './components/common/ToastContainer';
import { PublicRegisterModal } from './components/common/PublicRegisterModal';

import { OrganizerDashboard } from './pages/OrganizerDashboard';
import { JudgePortal } from './pages/JudgePortal';
import { ParticipantHub } from './pages/ParticipantHub';
import { LiveLeaderboardView } from './components/leaderboard/LiveLeaderboardView';
import { SplitScreenDemo } from './pages/SplitScreenDemo';

import { UserPlus } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentRole } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('organizer');
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100 bg-grid-pattern relative">
      {/* Accessible Skip to Main Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-400 focus:text-slate-950 focus:font-bold focus:rounded-xl focus:shadow-xl focus:ring-2 focus:ring-cyan-300 focus:outline-none transition-all"
      >
        Skip to main content
      </a>
      
      {/* Live Announcement Banner with ARIA Live Region */}
      <header role="banner" className="w-full">
        <LiveAnnouncementBanner />

        {/* Top Role Switcher Sandbox Bar */}
        <RoleSwitcherBanner onSelectTab={(tab) => setActiveTab(tab)} />

        {/* Navigation Header */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      </header>

      {/* Main Content Landmark */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 focus:outline-none">
        {activeTab === 'organizer' && <OrganizerDashboard />}
        {activeTab === 'judge' && <JudgePortal />}
        {activeTab === 'participant' && <ParticipantHub />}
        {activeTab === 'leaderboard' && <LiveLeaderboardView />}
        {activeTab === 'splitscreen' && <SplitScreenDemo />}
      </main>

      {/* Floating Action Button: Quick Attendee Registration */}
      <aside aria-label="Quick Actions" className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setShowRegisterModal(true)}
          aria-label="Register New Attendee for Hackathon"
          className="p-3.5 sm:px-4 sm:py-2.5 rounded-2xl bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-purple text-slate-950 font-extrabold text-xs shadow-xl shadow-cyan-500/20 hover:brightness-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-all flex items-center gap-2"
          title="Register New Attendee"
        >
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Register New Attendee</span>
        </button>
      </aside>

      {/* Real-time Toasts Stack */}
      <ToastContainer />

      {/* Attendee Registration Modal */}
      <PublicRegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegistered={() => setActiveTab('participant')}
      />

      {/* Semantic Footer Landmark */}
      <footer role="contentinfo" className="border-t border-slate-900/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-400">ABHIYANTRIX</span>
            <span>• Unified Smart Event Platform</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>WebSocket Live Engine</span>
            <span>HMAC Signed QR Security</span>
            <span>Dynamic Leaderboard</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <EventProvider>
          <MainAppContent />
        </EventProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
