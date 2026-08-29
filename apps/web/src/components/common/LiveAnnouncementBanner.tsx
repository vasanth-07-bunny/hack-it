import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { AlertTriangle, BellRing, ChevronRight, X } from 'lucide-react';

export const LiveAnnouncementBanner: React.FC = () => {
  const { latestAnnouncement, activeAnnouncements } = useSocket();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);

  // Find most important active announcement (urgent or pinned)
  const currentBanner = activeAnnouncements.find(a => a.severity === 'urgent') || latestAnnouncement;

  // Keyboard accessibility: Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAllModal) {
        setShowAllModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAllModal]);

  if (!currentBanner || isDismissed) return null;

  const isUrgent = currentBanner.severity === 'urgent';
  const isWarning = currentBanner.severity === 'warning';

  return (
    <>
      <section
        role={isUrgent ? 'alert' : 'status'}
        aria-live={isUrgent ? 'assertive' : 'polite'}
        aria-atomic="true"
        aria-label="Live Event Announcement"
        className={`w-full py-2.5 px-4 transition-all duration-300 relative border-b ${
          isUrgent
            ? 'bg-gradient-to-r from-rose-950/90 via-rose-900/80 to-amber-950/90 border-rose-500/50 text-rose-100 shadow-lg shadow-rose-950/50'
            : isWarning
            ? 'bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-yellow-950/90 border-amber-500/40 text-amber-100'
            : 'bg-gradient-to-r from-slate-900/90 via-cyan-950/80 to-slate-900/90 border-cyan-500/30 text-cyan-100'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className={`p-1.5 rounded-lg shrink-0 ${isUrgent ? 'bg-rose-500 text-white animate-bounce' : 'bg-brand-cyan/20 text-brand-cyan'}`}>
              {isUrgent ? <AlertTriangle className="w-4 h-4" aria-hidden="true" /> : <BellRing className="w-4 h-4" aria-hidden="true" />}
            </div>
            
            <div className="truncate">
              <span className="font-extrabold uppercase tracking-wider text-[11px] mr-2 px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                {currentBanner.severity}
              </span>
              <span className="font-bold mr-2 text-white">{currentBanner.title}</span>
              <span className="text-slate-300 hidden md:inline truncate">{currentBanner.message}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAllModal(true)}
              aria-label={`View all ${activeAnnouncements.length} announcements`}
              className="text-xs font-semibold px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-colors flex items-center gap-1"
            >
              Feed ({activeAnnouncements.length})
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              aria-label="Dismiss announcement banner"
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Modal for All Announcements */}
      {showAllModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="announcements-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-brand-cyan" aria-hidden="true" />
                <h3 id="announcements-modal-title" className="font-bold text-slate-100 text-base">Broadcast Announcements</h3>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                  {activeAnnouncements.length} Total
                </span>
              </div>
              <button
                onClick={() => setShowAllModal(false)}
                aria-label="Close announcements modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {activeAnnouncements.map((ann) => (
                <article
                  key={ann.id}
                  className={`p-4 rounded-xl border transition-all ${
                    ann.severity === 'urgent'
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                      : ann.severity === 'warning'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      : 'bg-slate-800/50 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/40">
                      {ann.severity} {ann.isPinned && '📌 PINNED'}
                    </span>
                    <time dateTime={ann.createdAt} className="text-[11px] text-slate-400">
                      {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • by {ann.authorName}
                    </time>
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm mb-1">{ann.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{ann.message}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
