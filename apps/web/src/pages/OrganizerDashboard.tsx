import React, { useState } from 'react';
import {
  ShieldCheck,
  QrCode,
  Radio,
  Sliders,
  BarChart3,
  Users
} from 'lucide-react';
import { QRCheckInStation } from '../components/qr/QRCheckInStation';
import { AnnouncementStudio } from '../components/announcements/AnnouncementStudio';
import { RubricManager } from '../components/judging/RubricManager';
import { OrganizerAnalyticsView } from '../components/analytics/OrganizerAnalyticsView';

export const OrganizerDashboard: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'checkin' | 'announcements' | 'rubric' | 'analytics'>('checkin');

  return (
    <div className="space-y-6">
      
      {/* Organizer Control Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-cyan" />
            <h1 className="text-2xl font-black text-white tracking-tight">Organizer Control Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time event operations, on-site attendee check-in desk, instant broadcasts, and judging governance.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center p-1 bg-slate-900/90 rounded-2xl border border-slate-800 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveSubTab('checkin')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'checkin'
                ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            QR Check-In Desk
          </button>

          <button
            onClick={() => setActiveSubTab('announcements')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'announcements'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Broadcast Center
          </button>

          <button
            onClick={() => setActiveSubTab('rubric')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'rubric'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Rubric & Audits
          </button>

          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'analytics'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics & Reports
          </button>
        </div>
      </div>

      {/* Render Active Sub-View */}
      {activeSubTab === 'checkin' && <QRCheckInStation />}
      {activeSubTab === 'announcements' && <AnnouncementStudio />}
      {activeSubTab === 'rubric' && <RubricManager />}
      {activeSubTab === 'analytics' && <OrganizerAnalyticsView />}

    </div>
  );
};
