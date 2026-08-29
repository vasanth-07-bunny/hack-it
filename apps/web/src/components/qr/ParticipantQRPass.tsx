import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Sparkles,
  CheckCircle,
  ShieldCheck,
  Download,
  Calendar,
  MapPin,
  Tag,
  Zap,
  Clock,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import { useSocket } from '../../contexts/SocketContext';
import { Registration } from '@abhiyantrix/shared-types';
import { apiFetch } from '../../services/api';

export const ParticipantQRPass: React.FC = () => {
  const { currentUser } = useAuth();
  const { event } = useEvent();
  const { latestCheckIn, playChime } = useSocket();

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelfCheckingIn, setIsSelfCheckingIn] = useState(false);

  const eventId = 'ev-abhiyantrix-2026';

  const fetchRegistration = async () => {
    if (!currentUser) return;
    try {
      const data = await apiFetch(`/api/events/${eventId}/my-registration?userId=${currentUser.id}`);
      if (data && data.registration) {
        setRegistration(data.registration);
      }
    } catch (err) {
      console.error('Error fetching registration', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistration();
  }, [currentUser, latestCheckIn]);

  const handleVirtualCheckIn = async () => {
    if (!registration) return;
    setIsSelfCheckingIn(true);
    try {
      const data = await apiFetch(`/api/events/${eventId}/check-in/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrToken: registration.qrToken,
          method: 'virtual_self_checkin',
          scannedByUserId: currentUser?.id
        })
      });
      if (data && data.registration) {
        setRegistration(data.registration);
        playChime('checkin');
      }
    } catch (err) {
      console.error('Virtual check-in failed', err);
    } finally {
      setIsSelfCheckingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-panel p-8 rounded-3xl text-center space-y-3 animate-pulse">
        <div className="w-48 h-48 bg-slate-800 rounded-2xl mx-auto" />
        <div className="h-4 bg-slate-800 rounded w-1/2 mx-auto" />
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="glass-panel p-8 rounded-3xl text-center space-y-4">
        <p className="text-slate-300 text-sm">No active registration found for {currentUser?.fullName}</p>
        <p className="text-xs text-slate-500">Please register for the event to generate your Signed QR Pass.</p>
      </div>
    );
  }

  const isCheckedIn = registration.status === 'checked_in';

  return (
    <div className="max-w-md mx-auto space-y-6">
      
      {/* Holographic Digital Pass Card */}
      <div className="relative rounded-3xl p-6 overflow-hidden glass-panel border border-cyan-500/30 shadow-2xl shadow-cyan-950/40">
        
        {/* Glowing Ambient Backgrounds */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-brand-cyan/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-brand-purple/15 blur-3xl pointer-events-none" />

        {/* Pass Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-cyan animate-pulse" />
              <span className="text-[11px] font-extrabold tracking-widest text-brand-cyan uppercase">
                OFFICIAL DIGITAL PASS
              </span>
            </div>
            <h3 className="font-extrabold text-white text-base tracking-tight mt-0.5">
              {event?.title || 'Abhiyantrix HackFest 2026'}
            </h3>
          </div>

          <div className="text-right">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              isCheckedIn
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {isCheckedIn ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Clock className="w-3 h-3 text-amber-400" />}
              {isCheckedIn ? 'VERIFIED' : 'PENDING'}
            </span>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="relative z-10 my-6 flex flex-col items-center">
          <div className="p-4 bg-white rounded-2xl shadow-xl shadow-cyan-500/10 border-2 border-slate-700/50">
            <QRCodeSVG
              value={registration.qrToken}
              size={180}
              level="H"
              includeMargin={false}
              fgColor="#090d16"
            />
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-cyan" />
            <span>HMAC Signed Token: {registration.qrToken.substring(0, 16)}...</span>
          </div>
        </div>

        {/* Attendee Info Grid */}
        <div className="relative z-10 space-y-3 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Attendee Name</p>
              <p className="font-extrabold text-white text-sm">{currentUser?.fullName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Role / Track</p>
              <p className="font-bold text-brand-cyan text-xs">{currentUser?.preferredRole}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Affiliation</p>
              <p className="text-slate-200 font-medium">{currentUser?.collegeOrCompany}</p>
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-800/80 text-[10px] font-mono border border-slate-700">
                👕 {registration.tShirtSize}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800/80 text-[10px] font-mono border border-slate-700">
                🥗 {registration.dietaryRequirements}
              </span>
            </div>
          </div>
        </div>

        {/* Check-In Timestamp / Status Footer */}
        <div className="relative z-10 mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>Innovation Tech Hub</span>
          </div>
          <div>
            {isCheckedIn ? (
              <span className="text-emerald-400 font-semibold">
                Checked in at {new Date(registration.checkedInAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : (
              <span className="text-amber-400 font-semibold">Scan at desk or click below</span>
            )}
          </div>
        </div>

      </div>

      {/* Action Buttons: Virtual Check-in & Save Pass */}
      <div className="flex items-center gap-3">
        {!isCheckedIn && (
          <button
            onClick={handleVirtualCheckIn}
            disabled={isSelfCheckingIn}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            {isSelfCheckingIn ? 'Verifying...' : 'Self-Serve Virtual Check-In'}
          </button>
        )}

        <button
          onClick={() => window.print()}
          className="px-4 py-3 rounded-2xl glass-panel text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          Save Pass
        </button>
      </div>

    </div>
  );
};
