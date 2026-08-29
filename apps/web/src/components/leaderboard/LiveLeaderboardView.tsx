import React, { useState, useEffect } from 'react';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ExternalLink,
  Github,
  Award,
  Crown,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useEvent } from '../../contexts/EventContext';
import { LeaderboardData, TeamRanking } from '@abhiyantrix/shared-types';

interface LiveLeaderboardProps {
  compact?: boolean;
}

export const LiveLeaderboardView: React.FC<LiveLeaderboardProps> = ({ compact = false }) => {
  const { latestLeaderboard } = useSocket();
  const { event } = useEvent();

  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [selectedTrack, setSelectedTrack] = useState('All');
  const [highlightedTeamId, setHighlightedTeamId] = useState<string | null>(null);
  const [selectedTeamBreakdown, setSelectedTeamBreakdown] = useState<TeamRanking | null>(null);

  const eventId = 'ev-abhiyantrix-2026';

  const fetchLeaderboard = async () => {
    try {
      const url = selectedTrack === 'All'
        ? `/api/events/${eventId}/leaderboard`
        : `/api/events/${eventId}/leaderboard?track=${encodeURIComponent(selectedTrack)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data: LeaderboardData = await res.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error('Error fetching leaderboard', err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedTrack]);

  // Sync real-time WebSocket leaderboard updates
  useEffect(() => {
    if (latestLeaderboard) {
      if (selectedTrack === 'All' || latestLeaderboard.rankings.some(r => r.track === selectedTrack)) {
        setLeaderboard(latestLeaderboard);
        if (latestLeaderboard.rankings.length > 0) {
          const topRanked = latestLeaderboard.rankings[0];
          setHighlightedTeamId(topRanked.teamId);
          setTimeout(() => setHighlightedTeamId(null), 3000);
        }
      }
    }
  }, [latestLeaderboard]);

  const rankings = leaderboard?.rankings || [];
  const topThree = rankings.slice(0, 3);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Trophy className="w-32 h-32 text-amber-400" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
            <h2 className="text-2xl font-black text-white tracking-tight">Live Grand Leaderboard</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Real-time aggregate scores across all tracks. Dynamically recomputed as judges submit rubric evaluations.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-xs text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Updated {leaderboard?.lastUpdated ? new Date(leaderboard.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Live'}</span>
          </div>
          <button
            onClick={fetchLeaderboard}
            className="p-2 rounded-xl glass-panel text-slate-400 hover:text-white transition-colors"
            title="Refresh Leaderboard"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Track Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
        <button
          onClick={() => setSelectedTrack('All')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all whitespace-nowrap ${
            selectedTrack === 'All'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🏆 All Categories
        </button>
        {event?.tracks.map((track) => (
          <button
            key={track}
            onClick={() => setSelectedTrack(track)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all whitespace-nowrap ${
              selectedTrack === track
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {track}
          </button>
        ))}
      </div>

      {/* Top 3 Podium Showcase (Full Mode) */}
      {!compact && topThree.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          {/* #2 Silver Podium */}
          <div className="order-2 md:order-1 glass-panel p-5 rounded-3xl border-slate-400/30 relative flex flex-col justify-between space-y-3 bg-gradient-to-b from-slate-800/40 to-slate-900/80">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-slate-400/20 border border-slate-400/30 flex items-center justify-center font-black text-slate-200 text-lg">
                2
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                SILVER PODIUM
              </span>
            </div>
            <div>
              <h4 className="font-black text-white text-base truncate">{topThree[1]?.teamName}</h4>
              <p className="text-xs text-brand-cyan font-semibold truncate">{topThree[1]?.submissionTitle || 'Project'}</p>
              <span className="text-[11px] text-slate-400 font-mono">{topThree[1]?.track}</span>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-2xl font-black text-slate-200 font-mono">{topThree[1]?.totalScore}</span>
              <span className="text-[11px] text-slate-400">{topThree[1]?.judgeCount} Evaluations</span>
            </div>
          </div>

          {/* #1 Gold Podium (Elevated & Glowing) */}
          <div className="order-1 md:order-2 glass-panel p-6 rounded-3xl border-amber-500/50 relative flex flex-col justify-between space-y-3 bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-950 shadow-2xl shadow-amber-950/50 md:-translate-y-2 ring-1 ring-amber-400/30">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" />
              RANK #1 LEADER
            </div>
            <div className="flex items-start justify-between pt-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-300 text-2xl shadow-lg shadow-amber-500/20">
                🥇
              </div>
              <span className="text-xs font-mono uppercase font-black text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/30">
                {topThree[0]?.totalScore} PTS
              </span>
            </div>
            <div>
              <h3 className="font-black text-white text-lg truncate">{topThree[0]?.teamName}</h3>
              <p className="text-xs text-amber-300 font-bold truncate">{topThree[0]?.submissionTitle}</p>
              <span className="text-[11px] text-slate-300 font-mono">{topThree[0]?.track}</span>
            </div>
            <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">★ Grand Finalist</span>
              <span className="text-[11px] text-slate-400">{topThree[0]?.judgeCount} Evaluations</span>
            </div>
          </div>

          {/* #3 Bronze Podium */}
          <div className="order-3 glass-panel p-5 rounded-3xl border-amber-700/30 relative flex flex-col justify-between space-y-3 bg-gradient-to-b from-amber-950/20 to-slate-900/80">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-700/20 border border-amber-700/30 flex items-center justify-center font-black text-amber-400 text-lg">
                3
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-amber-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                BRONZE PODIUM
              </span>
            </div>
            <div>
              <h4 className="font-black text-white text-base truncate">{topThree[2]?.teamName}</h4>
              <p className="text-xs text-brand-cyan font-semibold truncate">{topThree[2]?.submissionTitle || 'Project'}</p>
              <span className="text-[11px] text-slate-400 font-mono">{topThree[2]?.track}</span>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-2xl font-black text-amber-400 font-mono">{topThree[2]?.totalScore}</span>
              <span className="text-[11px] text-slate-400">{topThree[2]?.judgeCount} Evaluations</span>
            </div>
          </div>

        </div>
      )}

      {/* Main Real-time Leaderboard Rankings Table */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-cyan" />
            <h3 className="font-bold text-white text-base">Current Standings</h3>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
              {rankings.length} Submissions
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">Click any team to view criteria breakdown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <th className="py-3 px-3 text-center w-14">Rank</th>
                <th className="py-3 px-3">Team & Project Title</th>
                <th className="py-3 px-3">Track Category</th>
                <th className="py-3 px-3 text-center">Trend</th>
                <th className="py-3 px-3">Score Progress</th>
                <th className="py-3 px-3 text-right">Weighted Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {rankings.map((teamRank) => {
                const isTop1 = teamRank.rank === 1;
                const isTop3 = teamRank.rank <= 3;
                const isHighlighted = highlightedTeamId === teamRank.teamId;

                return (
                  <tr
                    key={teamRank.teamId}
                    onClick={() => setSelectedTeamBreakdown(teamRank)}
                    className={`cursor-pointer transition-all duration-300 ${
                      isHighlighted ? 'bg-brand-cyan/20 ring-1 ring-brand-cyan' : 'hover:bg-slate-800/40'
                    } ${isTop1 ? 'bg-amber-500/5' : ''}`}
                  >
                    {/* Rank Badge */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black font-mono text-xs ${
                        teamRank.rank === 1
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                          : teamRank.rank === 2
                          ? 'bg-slate-300 text-slate-950'
                          : teamRank.rank === 3
                          ? 'bg-amber-700 text-amber-100'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        #{teamRank.rank}
                      </span>
                    </td>

                    {/* Team & Project Details */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm hover:text-brand-cyan transition-colors">
                          {teamRank.teamName}
                        </span>
                        {isTop3 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            TOP {teamRank.rank}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {teamRank.submissionTitle || 'Project Submitted'}
                      </p>
                    </td>

                    {/* Track */}
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-mono">
                        {teamRank.track}
                      </span>
                    </td>

                    {/* Rank Delta / Movement Trend */}
                    <td className="py-3.5 px-3 text-center">
                      {teamRank.rankDelta > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <TrendingUp className="w-3.5 h-3.5" /> +{teamRank.rankDelta}
                        </span>
                      ) : teamRank.rankDelta < 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-rose-400 font-bold text-xs bg-rose-500/10 px-2 py-0.5 rounded-full">
                          <TrendingDown className="w-3.5 h-3.5" /> {teamRank.rankDelta}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-slate-500 text-xs">
                          <Minus className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>

                    {/* Score Bar Meter */}
                    <td className="py-3.5 px-3 w-40">
                      <div className="space-y-1">
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isTop1
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                                : 'bg-gradient-to-r from-brand-cyan to-brand-purple'
                            }`}
                            style={{ width: `${teamRank.totalScore}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {teamRank.judgeCount} judge{teamRank.judgeCount === 1 ? '' : 's'} evaluated
                        </span>
                      </div>
                    </td>

                    {/* Total Weighted Score */}
                    <td className="py-3.5 px-3 text-right">
                      <span className={`text-base font-black font-mono ${
                        isTop1 ? 'text-amber-300' : 'text-white'
                      }`}>
                        {teamRank.totalScore}
                      </span>
                      <span className="text-xs text-slate-500 font-mono"> / 100</span>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Criteria Breakdown Modal */}
      {selectedTeamBreakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-scaleUp">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-brand-cyan uppercase tracking-wider font-bold">
                  {selectedTeamBreakdown.track} • Rank #{selectedTeamBreakdown.rank}
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {selectedTeamBreakdown.teamName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTeamBreakdown(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300 font-semibold">{selectedTeamBreakdown.submissionTitle}</p>

              <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">Aggregate Weighted Score</span>
                  <span className="text-base text-brand-cyan font-mono">{selectedTeamBreakdown.totalScore} / 100</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Total Judge Evaluations</span>
                  <span className="font-mono text-white">{selectedTeamBreakdown.judgeCount}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Criteria Breakdown (Averages)</h5>
                <div className="space-y-1.5">
                  {Object.entries(selectedTeamBreakdown.criteriaBreakdown).map(([critId, score]) => (
                    <div key={critId} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-800/50">
                      <span className="text-slate-300 capitalize">{critId.replace('crit-', '')}</span>
                      <span className="font-mono font-bold text-white">{score} / 10</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTeamBreakdown(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
