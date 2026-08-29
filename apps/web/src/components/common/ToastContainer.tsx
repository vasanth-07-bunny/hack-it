import React from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { BellRing, CheckCircle, Trophy, Award, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useSocket();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isUrgent = toast.severity === 'urgent';
        const isCheckIn = toast.type === 'checkin';
        const isScore = toast.type === 'score';
        const isLeaderboard = toast.type === 'leaderboard';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all transform translate-y-0 duration-300 animate-slide-in flex items-start gap-3 ${
              isUrgent
                ? 'bg-rose-950/90 border-rose-500/60 text-rose-100 shadow-rose-950/50'
                : isCheckIn
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-100 shadow-emerald-950/50'
                : isScore
                ? 'bg-purple-950/90 border-purple-500/60 text-purple-100 shadow-purple-950/50'
                : isLeaderboard
                ? 'bg-amber-950/90 border-amber-500/60 text-amber-100 shadow-amber-950/50'
                : 'bg-slate-900/90 border-slate-700 text-slate-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isCheckIn && <CheckCircle className="w-5 h-5 text-emerald-400" />}
              {isScore && <Award className="w-5 h-5 text-purple-400" />}
              {isLeaderboard && <Trophy className="w-5 h-5 text-amber-400" />}
              {!isCheckIn && !isScore && !isLeaderboard && <BellRing className="w-5 h-5 text-brand-cyan" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="font-bold text-xs">{toast.title}</span>
                <span className="text-[10px] text-slate-400 font-mono">{toast.timestamp}</span>
              </div>
              <p className="text-xs text-slate-300 leading-snug line-clamp-2">{toast.message}</p>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss toast"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
