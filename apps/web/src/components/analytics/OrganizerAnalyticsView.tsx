import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  CheckCircle,
  FileSpreadsheet,
  Download,
  PieChart,
  Layers,
  Award,
  Sparkles,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { EventAnalytics } from '@abhiyantrix/shared-types';

export const OrganizerAnalyticsView: React.FC = () => {
  const { latestCheckIn } = useSocket();
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const eventId = 'ev-abhiyantrix-2026';

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/analytics`);
      if (res.ok) {
        const data: EventAnalytics = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error loading analytics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [latestCheckIn]);

  const handleExportCSV = () => {
    window.open(`/api/events/${eventId}/export/csv`, '_blank');
  };

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      
      {/* Header with 1-Click CSV Export */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-cyan" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">Executive Analytics & Telemetry</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time event lifecycle metrics, check-in velocity, and judging pipeline progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            className="p-2.5 rounded-xl glass-panel text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCSV}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV Report
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-cyan-500/20">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-brand-cyan">{analytics.checkInRatePercentage}%</span>
            <span className="text-xs text-slate-400">({analytics.totalCheckedIn}/{analytics.totalRegistered})</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-purple-500/20">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Judging Completion</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-purple-400">{analytics.judgingCompletionPercentage}%</span>
            <span className="text-xs text-slate-400">({analytics.totalScoresSubmitted} scored)</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-emerald-500/20">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Teams</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-emerald-400">{analytics.totalTeams}</span>
            <span className="text-xs text-slate-400">Formed</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-amber-500/20">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Submissions</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-amber-400">{analytics.totalSubmissions}</span>
            <span className="text-xs text-slate-400">In Review</span>
          </div>
        </div>
      </div>

      {/* Registration & Event Funnel */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-cyan" />
          Event Lifecycle Conversion Funnel
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">1. Registered</span>
            <p className="text-2xl font-extrabold text-white">{analytics.registrationFunnel.registered}</p>
            <p className="text-[11px] text-slate-400">100% of pipeline</p>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-1">
            <span className="text-[10px] uppercase font-bold text-cyan-300">2. Checked In</span>
            <p className="text-2xl font-extrabold text-cyan-300">{analytics.registrationFunnel.checkedIn}</p>
            <p className="text-[11px] text-cyan-400/80">{analytics.checkInRatePercentage}% check-in yield</p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-1">
            <span className="text-[10px] uppercase font-bold text-purple-300">3. In Teams</span>
            <p className="text-2xl font-extrabold text-purple-300">{analytics.registrationFunnel.teamFormed}</p>
            <p className="text-[11px] text-purple-400/80">Hackers matched</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-300">4. Submitted</span>
            <p className="text-2xl font-extrabold text-emerald-300">{analytics.registrationFunnel.submitted}</p>
            <p className="text-[11px] text-emerald-400/80">Active projects</p>
          </div>
        </div>
      </div>

      {/* Check-In Velocity Timeline & Track Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Check-In Velocity Timeline */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Check-In Velocity Timeline
          </h3>

          <div className="space-y-3 pt-2">
            {analytics.checkInTimeline.map((item) => (
              <div key={item.timeBucket} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{item.timeBucket}</span>
                  <span className="font-mono font-bold text-emerald-400">{item.count} attendees</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (item.count / 6) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Track Category Breakdown */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-400" />
            Track Project Distribution
          </h3>

          <div className="space-y-3 pt-2">
            {analytics.trackDistribution.map((t) => (
              <div key={t.track} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{t.track}</span>
                  <span className="font-mono font-bold text-purple-300">{t.teamCount} Teams</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (t.teamCount / analytics.totalTeams) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Top Skills Cloud */}
      <div className="glass-panel p-6 rounded-3xl space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-cyan" />
          Attendee Skills & Domain Stack Density
        </h3>

        <div className="flex items-center gap-2 flex-wrap pt-2">
          {analytics.topSkillsCloud.map((sk) => (
            <div
              key={sk.skill}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono flex items-center gap-2 hover:border-cyan-500/40 transition-colors"
            >
              <span>{sk.skill}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-brand-cyan/20 text-brand-cyan font-bold text-[10px]">
                {sk.count}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
