import React, { useState, useEffect } from 'react';
import {
  Sliders,
  ShieldCheck,
  CheckCircle,
  FileSpreadsheet,
  Layers,
  Award,
  RefreshCw
} from 'lucide-react';
import { Rubric } from '@abhiyantrix/shared-types';

export const RubricManager: React.FC = () => {
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [auditScores, setAuditScores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const eventId = 'ev-abhiyantrix-2026';

  const fetchData = async () => {
    try {
      const [rubricRes, auditRes] = await Promise.all([
        fetch(`/api/events/${eventId}/judging/rubrics`),
        fetch(`/api/events/${eventId}/judging/audit-trail`)
      ]);
      if (rubricRes.ok) {
        const rubricData = await rubricRes.json();
        setRubric(rubricData);
      }
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditScores(auditData);
      }
    } catch (err) {
      console.error('Error fetching rubric data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWeightChange = (criterionId: string, newWeightPercent: number) => {
    if (!rubric) return;
    const newWeight = newWeightPercent / 100;
    setRubric({
      ...rubric,
      criteria: rubric.criteria.map(c =>
        c.id === criterionId ? { ...c, weight: newWeight } : c
      )
    });
  };

  const handleSaveRubric = async () => {
    if (!rubric) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/judging/rubrics`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rubric)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save rubric', err);
    } finally {
      setIsSaving(false);
    }
  };

  const totalWeightPercent = rubric?.criteria.reduce((acc, c) => acc + Math.round(c.weight * 100), 0) || 0;

  return (
    <div className="space-y-6">
      
      {/* Rubric Criteria Configuration */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-brand-cyan" />
              <h3 className="font-bold text-white text-base">Scoring Rubric & Weights Config</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust criteria weights. Total weight should equal 100%. Leaderboards recalculate on save.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              totalWeightPercent === 100
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}>
              Total Weight: {totalWeightPercent}%
            </span>

            <button
              onClick={handleSaveRubric}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple text-slate-950 font-bold text-xs shadow-lg hover:brightness-110 transition-all"
            >
              {isSaving ? 'Updating...' : 'Save Rubric'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rubric?.criteria.map((crit) => (
            <div key={crit.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-white text-xs">{crit.title}</h4>
                  <p className="text-[11px] text-slate-400">{crit.description}</p>
                </div>
                <span className="text-sm font-extrabold text-brand-cyan font-mono">
                  {Math.round(crit.weight * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={Math.round(crit.weight * 100)}
                  onChange={(e) => handleWeightChange(crit.id, parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          ))}
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Rubric weights updated and broadcasted to all judge dashboards.</span>
          </div>
        )}
      </div>

      {/* Real-time Judging Audit Trail */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-base">Live Judging Audit Trail</h3>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
              {auditScores.length} Submissions Logged
            </span>
          </div>
          <button
            onClick={fetchData}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <th className="py-2.5 px-3">Team & Project</th>
                <th className="py-2.5 px-3">Track</th>
                <th className="py-2.5 px-3">Judge</th>
                <th className="py-2.5 px-3">Score (/100)</th>
                <th className="py-2.5 px-3">Judge Feedback Snippet</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditScores.map((sc) => (
                <tr key={sc.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3">
                    <p className="font-bold text-white">{sc.teamName || 'Team'}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-xs">{sc.submissionTitle}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                      {sc.track}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-purple-300">
                    {sc.judgeName}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-sm font-extrabold text-brand-cyan font-mono">
                      {sc.totalWeightedScore}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                    {sc.feedbackStrengths || sc.feedbackImprovements || 'Evaluated against rubric'}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">
                    {new Date(sc.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
