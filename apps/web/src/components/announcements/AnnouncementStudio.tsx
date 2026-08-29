import React, { useState } from 'react';
import {
  BellRing,
  Send,
  AlertTriangle,
  Info,
  Pin,
  CheckCircle,
  Radio,
  Sparkles,
  Filter,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useEvent } from '../../contexts/EventContext';
import { AnnouncementSeverity } from '@abhiyantrix/shared-types';

export const AnnouncementStudio: React.FC = () => {
  const { currentUser } = useAuth();
  const { activeAnnouncements } = useSocket();
  const { event } = useEvent();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AnnouncementSeverity>('urgent');
  const [targetAudience, setTargetAudience] = useState<'all' | 'track' | 'team'>('all');
  const [targetTrack, setTargetTrack] = useState<string>('All Tracks');
  const [isPinned, setIsPinned] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [successFeedback, setSuccessFeedback] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const eventId = 'ev-abhiyantrix-2026';

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setIsBroadcasting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          severity,
          targetAudience,
          targetTrack: targetAudience === 'track' ? targetTrack : undefined,
          isPinned,
          authorId: currentUser?.id,
          authorName: currentUser?.fullName
        })
      });

      if (res.ok) {
        setTitle('');
        setMessage('');
        setSuccessFeedback(true);
        setTimeout(() => setSuccessFeedback(false), 4000);
      }
    } catch (err) {
      console.error('Failed to broadcast announcement', err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const filteredAnnouncements = activeAnnouncements.filter((ann) => {
    const matchesSearch =
      ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ann.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSev = filterSeverity === 'all' || ann.severity === filterSeverity;
    return matchesSearch && matchesSev;
  });

  return (
    <div className="space-y-6">
      
      {/* Broadcast Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Input Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleBroadcast} className="glass-panel p-6 rounded-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-brand-cyan animate-pulse" />
                <h3 className="font-bold text-slate-100 text-base">Broadcast Center</h3>
              </div>
              <span className="text-[11px] font-mono text-brand-cyan bg-brand-cyan/10 px-2.5 py-1 rounded-full border border-brand-cyan/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Instant WebSocket Push
              </span>
            </div>

            {/* Severity Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Announcement Severity
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSeverity('urgent')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    severity === 'urgent'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-950/40 ring-1 ring-rose-500'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Urgent Alert 🚨
                </button>

                <button
                  type="button"
                  onClick={() => setSeverity('warning')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    severity === 'warning'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-950/40 ring-1 ring-amber-500'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Warning ⚠️
                </button>

                <button
                  type="button"
                  onClick={() => setSeverity('info')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    severity === 'info'
                      ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-md shadow-cyan-950/40 ring-1 ring-brand-cyan'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Info className="w-3.5 h-3.5 text-brand-cyan" />
                  General Info 📢
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Announcement Headline / Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Schedule Update: Mentorship Office Hours moved to Room 4B"
                required
                className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-slate-100"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Announcement Details / Body
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Write detailed instructions, venue locations, or critical deadline information..."
                required
                className="w-full glass-input rounded-xl p-3 text-xs text-slate-100 resize-none"
              />
            </div>

            {/* Target Audience & Pin Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Target Audience
                </label>
                <select
                  value={targetAudience}
                  onChange={(e: any) => setTargetAudience(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="all">All Attendees & Judges</option>
                  <option value="track">Specific Track Only</option>
                </select>
              </div>

              {targetAudience === 'track' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Select Track
                  </label>
                  <select
                    value={targetTrack}
                    onChange={(e) => setTargetTrack(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    {event?.tracks.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-brand-cyan focus:ring-brand-cyan w-4 h-4"
                />
                <Pin className="w-3.5 h-3.5 text-brand-cyan" />
                Pin to top of every active dashboard
              </label>

              <button
                type="submit"
                disabled={isBroadcasting || !title || !message}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple text-slate-950 font-extrabold text-xs shadow-lg shadow-brand-cyan/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isBroadcasting ? 'Broadcasting...' : 'Broadcast Live'}
              </button>
            </div>

            {successFeedback && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Broadcast successfully delivered to all connected clients!</span>
              </div>
            )}

          </form>
        </div>

        {/* Right: Live Preview Pane */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-6 rounded-2xl space-y-4 h-full flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Live Participant Banner Preview
              </h4>

              <div
                className={`p-4 rounded-xl border transition-all ${
                  severity === 'urgent'
                    ? 'bg-rose-950/50 border-rose-500/60 text-rose-100 shadow-lg shadow-rose-950/40'
                    : severity === 'warning'
                    ? 'bg-amber-950/50 border-amber-500/60 text-amber-100'
                    : 'bg-cyan-950/50 border-cyan-500/60 text-cyan-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-black/40 text-[10px] font-extrabold uppercase tracking-wider font-mono">
                    {severity} {isPinned && '📌 PINNED'}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-auto">Just Now</span>
                </div>
                <h5 className="font-bold text-sm text-white mb-1">
                  {title || 'Headline will appear here in real-time...'}
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {message || 'Body text will update instantly across participant and judge screens via WebSockets.'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">💡 Broadcast Rules:</p>
              <p>• <strong>Urgent</strong> triggers audio chime & persistent top banner across all views.</p>
              <p>• <strong>Info/Warning</strong> displays toast alerts and registers into the searchable announcement feed.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Announcement History / Feed */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-brand-cyan" />
            <h3 className="font-bold text-slate-100 text-sm">Active Announcement Feed</h3>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
              {filteredAnnouncements.length} Posts
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search feed..."
              className="glass-input rounded-xl px-3 py-1.5 text-xs text-slate-200 w-full sm:w-48"
            />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="glass-input rounded-xl px-2.5 py-1.5 text-xs text-slate-300"
            >
              <option value="all">All</option>
              <option value="urgent">Urgent</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                ann.severity === 'urgent'
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : ann.severity === 'warning'
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-slate-900/40 border-slate-800'
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    ann.severity === 'urgent'
                      ? 'bg-rose-500/20 text-rose-300'
                      : ann.severity === 'warning'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-cyan-500/20 text-brand-cyan'
                  }`}>
                    {ann.severity} {ann.isPinned && '📌'}
                  </span>
                  <span className="font-bold text-white text-sm">{ann.title}</span>
                </div>
                <p className="text-slate-300 text-xs">{ann.message}</p>
                <p className="text-[10px] text-slate-500">
                  Broadcasted {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {ann.authorName}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
