import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  ExternalLink,
  Github,
  CheckCircle,
  FileText,
  Sliders,
  Sparkles,
  Send,
  MessageSquare,
  Lock,
  ChevronRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Rubric, Submission, ScoreSubmission } from '@abhiyantrix/shared-types';
import { apiFetch } from '../../services/api';

interface AssignmentItem {
  submission: Submission & { team?: any };
  hasEvaluated: boolean;
  score: ScoreSubmission | null;
  totalEvaluationsCount: number;
}

export const ScoringWorkspace: React.FC = () => {
  const { currentUser } = useAuth();
  const { playChime } = useSocket();

  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // Rubric Scoring State for selected submission
  const [criteriaScores, setCriteriaScores] = useState<{ [criterionId: string]: number }>({});
  const [feedbackStrengths, setFeedbackStrengths] = useState('');
  const [feedbackImprovements, setFeedbackImprovements] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const eventId = 'ev-abhiyantrix-2026';

  const fetchAssignments = async () => {
    if (!currentUser) return;
    try {
      const data = await apiFetch(`/api/events/${eventId}/judging/assignments?judgeId=${currentUser.id}`);
      if (data && data.assignments) {
        setRubric(data.rubric);
        setAssignments(data.assignments);

        // Select first assignment by default if none selected
        if (!selectedSubmissionId && data.assignments.length > 0) {
          selectSubmission(data.assignments[0]);
        } else if (selectedSubmissionId) {
          const current = data.assignments.find((a: AssignmentItem) => a.submission.id === selectedSubmissionId);
          if (current) selectSubmission(current);
        }
      }
    } catch (err) {
      console.error('Error fetching judging assignments', err);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [currentUser]);

  const selectSubmission = (item: AssignmentItem) => {
    setSelectedSubmissionId(item.submission.id);
    setSubmitSuccess(false);

    if (item.score) {
      // Pre-fill existing score
      const scoreMap: { [criterionId: string]: number } = {};
      item.score.criteriaScores.forEach(cs => {
        scoreMap[cs.criterionId] = cs.score;
      });
      setCriteriaScores(scoreMap);
      setFeedbackStrengths(item.score.feedbackStrengths || '');
      setFeedbackImprovements(item.score.feedbackImprovements || '');
    } else {
      // Initialize defaults
      const scoreMap: { [criterionId: string]: number } = {};
      rubric?.criteria.forEach(crit => {
        scoreMap[crit.id] = 8.5; // realistic starter
      });
      setCriteriaScores(scoreMap);
      setFeedbackStrengths('');
      setFeedbackImprovements('');
    }
  };

  // Calculate live total weighted score
  const calculateTotalWeighted = (): number => {
    if (!rubric) return 0;
    let total = 0;
    rubric.criteria.forEach(crit => {
      const score = criteriaScores[crit.id] || 0;
      total += (score / crit.maxScore) * (crit.weight * 100);
    });
    return Math.round(total * 10) / 10;
  };

  const handleScoreChange = (criterionId: string, val: number) => {
    setCriteriaScores(prev => ({
      ...prev,
      [criterionId]: val
    }));
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmissionId || !currentUser || !rubric) return;

    setIsSubmitting(true);
    try {
      const criteriaList = Object.entries(criteriaScores).map(([criterionId, score]) => ({
        criterionId,
        score
      }));

      const data = await apiFetch(`/api/events/${eventId}/judging/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmissionId,
          judgeId: currentUser.id,
          criteriaScores: criteriaList,
          feedbackStrengths,
          feedbackImprovements
        })
      });

      if (data) {
        setSubmitSuccess(true);
        playChime('score');
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 }
        });
        fetchAssignments();
        setTimeout(() => setSubmitSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Error submitting score', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedItem = assignments.find(a => a.submission.id === selectedSubmissionId);
  const totalEvaluated = assignments.filter(a => a.hasEvaluated).length;
  const progressPercent = assignments.length > 0 ? Math.round((totalEvaluated / assignments.length) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Judge Evaluation Header Ribbon */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">Interactive Judging Portal</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evaluating as <span className="text-purple-300 font-bold">{currentUser?.fullName}</span> ({currentUser?.preferredRole}).
            Scores update the live leaderboard instantly via WebSockets.
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="glass-panel px-4 py-2.5 rounded-xl border border-purple-500/20 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Your Progress</span>
            <div className="flex items-baseline gap-1.5 justify-end">
              <span className="text-lg font-extrabold text-purple-300">{totalEvaluated} / {assignments.length}</span>
              <span className="text-xs text-slate-400">Evaluated</span>
            </div>
            <div className="w-28 bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Submissions Queue / Right Scoring Rubric */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Assigned Submissions Queue */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Assigned Queue ({assignments.length})
            </span>
            <span className="text-[11px] text-slate-500">Click to evaluate</span>
          </div>

          <div className="space-y-2.5 max-h-[700px] overflow-y-auto">
            {assignments.map((item) => {
              const isSelected = item.submission.id === selectedSubmissionId;
              return (
                <button
                  key={item.submission.id}
                  onClick={() => selectSubmission(item)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/50'
                      : 'glass-panel hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold text-purple-300 truncate">
                      {item.submission.team?.name || 'Team'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      item.hasEvaluated
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {item.hasEvaluated ? `★ ${item.score?.totalWeightedScore} pts` : '⏳ Needs Score'}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-white text-xs line-clamp-1 mb-1">
                    {item.submission.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {item.submission.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 mt-2 border-t border-slate-800/80">
                    <span className="font-mono">{item.submission.track}</span>
                    <span className="flex items-center gap-1">
                      {item.totalEvaluationsCount} Judge{item.totalEvaluationsCount === 1 ? '' : 's'} Scored
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Rubric Scoring Workspace */}
        <div className="lg:col-span-8">
          {selectedItem ? (
            <form onSubmit={handleSubmitScore} className="glass-panel p-6 rounded-3xl space-y-6">
              
              {/* Project Detail Header */}
              <div className="space-y-3 pb-4 border-b border-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-brand-cyan uppercase tracking-wider">
                      {selectedItem.submission.track} • {selectedItem.submission.team?.name}
                    </span>
                    <h3 className="text-xl font-extrabold text-white mt-0.5">
                      {selectedItem.submission.title}
                    </h3>
                  </div>

                  {/* Calculated Live Total Score Meter */}
                  <div className="px-4 py-2 rounded-2xl bg-gradient-to-tr from-purple-950 to-slate-900 border border-purple-500/40 text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Weighted Score</span>
                    <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300">
                      {calculateTotalWeighted()} <span className="text-xs text-slate-400">/ 100</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedItem.submission.description}
                </p>

                {/* Artifact Link Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {selectedItem.submission.repoUrl && (
                    <a
                      href={selectedItem.submission.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Github className="w-3.5 h-3.5" />
                      GitHub Repo
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  )}

                  {selectedItem.submission.demoUrl && (
                    <a
                      href={selectedItem.submission.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan text-xs font-semibold border border-brand-cyan/30 flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Live Demo Preview
                      <ExternalLink className="w-3 h-3 text-brand-cyan" />
                    </a>
                  )}

                  {selectedItem.submission.pitchDeckUrl && (
                    <a
                      href={selectedItem.submission.pitchDeckUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 text-xs font-semibold border border-purple-500/30 flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Pitch Deck
                      <ExternalLink className="w-3 h-3 text-purple-400" />
                    </a>
                  )}
                </div>
              </div>

              {/* Rubric Criteria Matrix (Interactive Sliders) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    Official Evaluation Rubric
                  </h4>
                  <span className="text-[11px] text-slate-400">Drag sliders to score (0 – 10)</span>
                </div>

                <div className="space-y-3.5">
                  {rubric?.criteria.map((crit) => {
                    const currentScore = criteriaScores[crit.id] !== undefined ? criteriaScores[crit.id] : 8.0;
                    const weightedPoints = ((currentScore / crit.maxScore) * (crit.weight * 100)).toFixed(1);

                    return (
                      <div
                        key={crit.id}
                        className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{crit.title}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                Weight: {Math.round(crit.weight * 100)}%
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{crit.description}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-base font-extrabold text-white font-mono">{currentScore.toFixed(1)}</span>
                            <span className="text-xs text-slate-400">/ 10</span>
                            <div className="text-[10px] text-purple-300 font-mono">
                              +{weightedPoints} pts
                            </div>
                          </div>
                        </div>

                        {/* Interactive Slider */}
                        <div className="flex items-center gap-3 pt-1">
                          <span className="text-[10px] text-slate-500 font-mono">0</span>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.1"
                            value={currentScore}
                            onChange={(e) => handleScoreChange(crit.id, parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          />
                          <span className="text-[10px] text-slate-500 font-mono">10</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Structured Feedback Section */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-cyan" />
                  Structured Feedback to Team
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-400 uppercase mb-1">
                      Key Technical Strengths
                    </label>
                    <textarea
                      value={feedbackStrengths}
                      onChange={(e) => setFeedbackStrengths(e.target.value)}
                      rows={3}
                      placeholder="Highlight architectural elegance, exceptional UI finish, or novel algorithmic choices..."
                      className="w-full glass-input rounded-xl p-3 text-xs text-slate-100 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1">
                      Areas for Improvement & Feedback
                    </label>
                    <textarea
                      value={feedbackImprovements}
                      onChange={(e) => setFeedbackImprovements(e.target.value)}
                      rows={3}
                      placeholder="Suggested optimizations, edge case error recovery, market roadmap guidance..."
                      className="w-full glass-input rounded-xl p-3 text-xs text-slate-100 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Action & Success Notice */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  {selectedItem.hasEvaluated ? (
                    <span className="text-purple-300 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      Previously submitted • Updates will trigger real-time re-ranking
                    </span>
                  ) : (
                    <span>Ready for evaluation lock</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto py-3 px-8 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 text-slate-950 font-extrabold text-xs shadow-xl shadow-purple-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Submitting Score...' : 'Lock & Submit Score (Live Broadcast)'}
                </button>
              </div>

              {submitSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold">Score Locked & Dispatched to Global Leaderboard!</p>
                    <p className="text-[11px] text-emerald-300/80">Real-time WebSocket event was broadcasted to all active participants and organizers.</p>
                  </div>
                </div>
              )}

            </form>
          ) : (
            <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
              <p className="text-slate-400 text-sm">Select a submission from the left queue to begin scoring</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
