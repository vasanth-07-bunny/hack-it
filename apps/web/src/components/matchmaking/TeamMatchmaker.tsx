import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Sparkles,
  CheckCircle,
  Tag,
  Briefcase,
  Lock,
  Plus,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import { useSocket } from '../../contexts/SocketContext';
import { Team, User } from '@abhiyantrix/shared-types';
import { apiFetch } from '../../services/api';

export const TeamMatchmaker: React.FC = () => {
  const { currentUser } = useAuth();
  const { event } = useEvent();
  const { socket } = useSocket();

  const [activeSubTab, setActiveSubTab] = useState<'teams' | 'hackers'>('teams');
  const [teams, setTeams] = useState<Team[]>([]);
  const [participants, setParticipants] = useState<(User & { isAssigned?: boolean; teamName?: string })[]>([]);
  const [selectedTrack, setSelectedTrack] = useState('All');
  const [skillSearch, setSkillSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Team Form State
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPitch, setNewTeamPitch] = useState('');
  const [newTeamTrack, setNewTeamTrack] = useState(event?.tracks[0] || 'AI & Autonomous Agents');
  const [newTeamOpenRoles, setNewTeamOpenRoles] = useState('Backend Dev, AI Engineer');
  const [newTeamNeededSkills, setNewTeamNeededSkills] = useState('Python, PyTorch');
  const [isCreating, setIsCreating] = useState(false);

  const eventId = 'ev-abhiyantrix-2026';

  const fetchData = async () => {
    try {
      const [teamsData, partsData] = await Promise.all([
        apiFetch(`/api/events/${eventId}/matchmaking/teams?track=${selectedTrack}`),
        apiFetch(`/api/events/${eventId}/matchmaking/participants`)
      ]);
      if (Array.isArray(teamsData)) {
        setTeams(teamsData);
      }
      if (Array.isArray(partsData)) {
        setParticipants(partsData);
      }
    } catch (err) {
      console.error('Failed to load matchmaking data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedTrack]);

  // Listen to live team updates
  useEffect(() => {
    if (!socket) return;
    const handleTeamUpdate = () => {
      fetchData();
    };
    socket.on('team:updated', handleTeamUpdate);
    return () => {
      socket.off('team:updated', handleTeamUpdate);
    };
  }, [socket]);

  // Calculate Match Score between user's skills and team's needed skills
  const calculateMatchScore = (team: Team): number => {
    if (!currentUser?.skills || currentUser.skills.length === 0) return 60;
    const teamSkills = team.neededSkills.map(s => s.toLowerCase());
    const userSkills = currentUser.skills.map(s => s.toLowerCase());

    const matching = userSkills.filter(us =>
      teamSkills.some(ts => ts.includes(us) || us.includes(ts))
    );

    if (matching.length > 0) {
      return Math.min(98, 75 + matching.length * 10);
    }
    return 65;
  };

  const handleJoinTeam = async (teamId: string) => {
    if (!currentUser) return;
    try {
      await apiFetch(`/api/events/${eventId}/teams/${teamId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          roleInTeam: currentUser.preferredRole
        })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to join team', err);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !newTeamPitch || !currentUser) return;

    setIsCreating(true);
    try {
      await apiFetch(`/api/events/${eventId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTeamName,
          pitch: newTeamPitch,
          track: newTeamTrack,
          leaderId: currentUser.id,
          openRoles: newTeamOpenRoles.split(',').map(s => s.trim()).filter(Boolean),
          neededSkills: newTeamNeededSkills.split(',').map(s => s.trim()).filter(Boolean)
        })
      });

      setShowCreateModal(false);
      setNewTeamName('');
      setNewTeamPitch('');
      fetchData();
    } catch (err) {
      console.error('Failed to create team', err);
    } finally {
      setIsCreating(false);
    }
  };

  const currentTeam = teams.find(t => t.members.some(m => m.userId === currentUser?.id));

  return (
    <div className="space-y-6">
      
      {/* Header & Matchmaker Tabs */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-cyan" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">Smart Team Matchmaker</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Discover teammates based on skill-gap overlap, browse open team rosters, or recruit specialized talent.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Sub-tab switcher */}
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab('teams')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'teams'
                  ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Explore Teams ({teams.length})
            </button>
            <button
              onClick={() => setActiveSubTab('hackers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'hackers'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Find Hackers ({participants.length})
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-blue text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </button>
        </div>
      </div>

      {/* Track & Skill Filter Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedTrack('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
              selectedTrack === 'All'
                ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/40 shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Tracks
          </button>
          {event?.tracks.map((track) => (
            <button
              key={track}
              onClick={() => setSelectedTrack(track)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                selectedTrack === track
                  ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/40 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {track}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            placeholder="Filter by skill (e.g. React, Rust)..."
            className="w-full glass-input rounded-xl px-3.5 py-1.5 text-xs text-slate-100 pl-8"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Content: Explore Teams */}
      {activeSubTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams
            .filter((t) => {
              if (!skillSearch) return true;
              return (
                t.neededSkills.some(s => s.toLowerCase().includes(skillSearch.toLowerCase())) ||
                t.openRoles.some(r => r.toLowerCase().includes(skillSearch.toLowerCase())) ||
                t.name.toLowerCase().includes(skillSearch.toLowerCase())
              );
            })
            .map((team) => {
              const matchScore = calculateMatchScore(team);
              const isUserInTeam = team.members.some(m => m.userId === currentUser?.id);
              const isFull = team.members.length >= (event?.config.maxTeamSize || 4);

              return (
                <div
                  key={team.id}
                  className={`glass-panel p-5 rounded-2xl space-y-4 flex flex-col justify-between transition-all hover:border-cyan-500/30 ${
                    isUserInTeam ? 'ring-2 ring-brand-cyan/40 bg-slate-900/90' : ''
                  }`}
                >
                  <div className="space-y-3">
                    
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-white text-base">{team.name}</h4>
                          {isUserInTeam && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
                              YOUR TEAM
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-brand-cyan">
                          {team.track}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30">
                          {matchScore}% Match
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {team.pitch}
                    </p>

                    {/* Team Members */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Members ({team.members.length}/{event?.config.maxTeamSize || 4})</span>
                        {team.isLocked && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {team.members.map((m) => (
                          <span
                            key={m.userId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-200 text-[10px] border border-slate-700"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {m.user?.fullName || 'Hacker'} ({m.roleInTeam.split(' ')[0]})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Needed Skills & Open Roles */}
                    {team.neededSkills.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Seeking Skills</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          {team.neededSkills.map((sk) => (
                            <span
                              key={sk}
                              className="px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-semibold"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800">
                    {isUserInTeam ? (
                      <div className="text-center text-xs font-bold text-brand-cyan py-1">
                        ✓ You are registered in this team
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoinTeam(team.id)}
                        disabled={isFull || team.isLocked}
                        className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-brand-cyan" />
                        {isFull ? 'Team Full' : 'Request to Join Team'}
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
        </div>
      )}

      {/* Content: Find Hackers */}
      {activeSubTab === 'hackers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants
            .filter((p) => {
              if (!skillSearch) return true;
              return (
                p.fullName.toLowerCase().includes(skillSearch.toLowerCase()) ||
                p.skills.some(s => s.toLowerCase().includes(skillSearch.toLowerCase())) ||
                p.preferredRole.toLowerCase().includes(skillSearch.toLowerCase())
              );
            })
            .map((hacker) => (
              <div
                key={hacker.id}
                className="glass-panel p-5 rounded-2xl space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={hacker.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={hacker.fullName}
                      className="w-11 h-11 rounded-full border border-slate-700 object-cover"
                    />
                    <div>
                      <h4 className="font-extrabold text-white text-sm">{hacker.fullName}</h4>
                      <p className="text-xs text-brand-cyan font-semibold">{hacker.preferredRole}</p>
                      <p className="text-[11px] text-slate-400">{hacker.collegeOrCompany}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {hacker.skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    hacker.isAssigned
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {hacker.isAssigned ? `In ${hacker.teamName}` : '🌟 Looking for Team'}
                  </span>

                  {!hacker.isAssigned && currentTeam && (
                    <button
                      onClick={() => handleJoinTeam(currentTeam.id)}
                      className="px-2.5 py-1 rounded bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 text-xs font-bold transition-colors"
                    >
                      Invite to Team
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Create a New Team</h3>
            
            <form onSubmit={handleCreateTeam} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Team Name</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Quantum Leapers"
                  required
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Project Idea Pitch</label>
                <textarea
                  value={newTeamPitch}
                  onChange={(e) => setNewTeamPitch(e.target.value)}
                  rows={2}
                  placeholder="Briefly describe what your team plans to build..."
                  required
                  className="w-full glass-input rounded-xl p-3 text-xs text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Track Category</label>
                <select
                  value={newTeamTrack}
                  onChange={(e) => setNewTeamTrack(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                >
                  {event?.tracks.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Open Roles</label>
                  <input
                    type="text"
                    value={newTeamOpenRoles}
                    onChange={(e) => setNewTeamOpenRoles(e.target.value)}
                    placeholder="e.g. Frontend, Designer"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Needed Skills</label>
                  <input
                    type="text"
                    value={newTeamNeededSkills}
                    onChange={(e) => setNewTeamNeededSkills(e.target.value)}
                    placeholder="e.g. React, Tailwind"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple text-slate-950 font-extrabold text-xs shadow-lg"
                >
                  {isCreating ? 'Creating...' : 'Launch Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
