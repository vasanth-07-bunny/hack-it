import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  ExternalLink,
  Github,
  FileText,
  CheckCircle,
  Sparkles,
  Send,
  Lock,
  Layers
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import { useSocket } from '../../contexts/SocketContext';
import { Team, Submission } from '@abhiyantrix/shared-types';
import { apiFetch } from '../../services/api';
import confetti from 'canvas-confetti';

export const ProjectSubmissionForm: React.FC = () => {
  const { currentUser } = useAuth();
  const { event } = useEvent();
  const { playChime } = useSocket();

  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [pitchDeckUrl, setPitchDeckUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const eventId = 'ev-abhiyantrix-2026';

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      const [teamsData, subsData] = await Promise.all([
        apiFetch(`/api/events/${eventId}/matchmaking/teams`),
        apiFetch(`/api/events/${eventId}/submissions`)
      ]);

      if (Array.isArray(teamsData)) {
        const userTeams = teamsData.filter((t: Team) =>
          t.members.some(m => m.userId === currentUser.id)
        );
        setMyTeams(userTeams);

        if (userTeams.length > 0) {
          const currentTeam = userTeams[0];
          setSelectedTeamId(currentTeam.id);

          if (Array.isArray(subsData)) {
            const sub = subsData.find((s: Submission) => s.teamId === currentTeam.id);
            if (sub) {
              setExistingSubmission(sub);
              setTitle(sub.title);
              setDescription(sub.description);
              setRepoUrl(sub.repoUrl);
              setDemoUrl(sub.demoUrl || '');
              setPitchDeckUrl(sub.pitchDeckUrl || '');
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching submissions', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !title || !description || !repoUrl) return;

    setIsSubmitting(true);
    try {
      const data = await apiFetch(`/api/events/${eventId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeamId,
          title,
          description,
          repoUrl,
          demoUrl,
          pitchDeckUrl
        })
      });

      if (data && data.id) {
        setIsSuccess(true);
        playChime('score');
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 }
        });
        setTimeout(() => setIsSuccess(false), 5000);
        fetchData();
      }
    } catch (err) {
      console.error('Submission failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (myTeams.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-3xl text-center space-y-3">
        <FolderGit2 className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="font-extrabold text-white text-base">No Team Found</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          You must be part of a team to submit project artifacts (GitHub repo, demo link, pitch deck).
          Head to the Smart Matchmaker tab to join or create a team first!
        </p>
      </div>
    );
  }

  const selectedTeam = myTeams.find(t => t.id === selectedTeamId) || myTeams[0];

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-6">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-brand-cyan" />
            <h3 className="text-lg font-extrabold text-white">Project Artifacts & Submission</h3>
          </div>
          {selectedTeam && (
            <p className="text-xs text-slate-400 mt-0.5">
              Team: <strong className="text-brand-cyan">{selectedTeam.name}</strong> • Track: <strong className="text-slate-200">{selectedTeam.track}</strong>
            </p>
          )}
        </div>

        {existingSubmission && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Submitted for Judging
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Project Title / Name
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. NeuroFlow: Zero-Latency Autonomous Multi-Agent Fabric"
            required
            className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Project Overview / Technical Summary
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe problem solved, technical stack, architecture highlights, and breakthrough innovations..."
            required
            className="w-full glass-input rounded-xl p-3 text-xs text-white resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              GitHub / Code Repo URL
            </label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/org/repo"
              required
              className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              Live Demo / URL (Optional)
            </label>
            <input
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://my-app.vercel.app"
              className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              Pitch Deck URL (Optional)
            </label>
            <input
              type="url"
              value={pitchDeckUrl}
              onChange={(e) => setPitchDeckUrl(e.target.value)}
              placeholder="https://pitch.com/deck-xyz"
              className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Submissions are immediately routed to assigned judges in real time.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-blue text-slate-950 font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting ? 'Saving...' : existingSubmission ? 'Update Submission' : 'Submit Project'}
          </button>
        </div>

        {isSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Project submission updated! Judges can now evaluate your project against the rubric.</span>
          </div>
        )}

      </form>

    </div>
  );
};
