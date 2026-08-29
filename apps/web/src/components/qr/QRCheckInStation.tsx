import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  QrCode,
  CheckCircle,
  AlertCircle,
  XCircle,
  Camera,
  Play,
  Search,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  Zap,
  Tag
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Registration, CheckInRecord } from '@abhiyantrix/shared-types';
import { apiFetch } from '../../services/api';

export const QRCheckInStation: React.FC = () => {
  const { currentUser } = useAuth();
  const { latestCheckIn } = useSocket();

  const [scannerActive, setScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: 'idle' | 'success' | 'already_checked_in' | 'error';
    message: string;
    registration?: Registration;
    user?: any;
  }>({ status: 'idle', message: '' });

  const [stats, setStats] = useState<{
    totalRegistered: number;
    totalCheckedIn: number;
    checkInRate: number;
    recentCheckIns: CheckInRecord[];
  }>({ totalRegistered: 0, totalCheckedIn: 0, checkInRate: 0, recentCheckIns: [] });

  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const eventId = 'ev-abhiyantrix-2026';

  const fetchStats = async () => {
    try {
      const [statsData, regData] = await Promise.all([
        apiFetch(`/api/events/${eventId}/check-in/stats`),
        apiFetch(`/api/events/${eventId}/registrations`)
      ]);
      if (statsData && statsData.totalRegistered !== undefined) {
        setStats(statsData);
      }
      if (Array.isArray(regData)) {
        setAllRegistrations(regData);
      }
    } catch (err) {
      console.error('Error fetching check-in stats', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [latestCheckIn]);

  // Handle Verification Request
  const verifyToken = async (qrToken: string, method: string = 'onsite_qr_scan') => {
    setIsVerifying(true);
    try {
      const data = await apiFetch(`/api/events/${eventId}/check-in/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrToken,
          method,
          scannedByUserId: currentUser?.id
        })
      });

      if (data.success) {
        setScanResult({
          status: 'success',
          message: data.message,
          registration: data.registration,
          user: data.user
        });
      } else if (data.alreadyCheckedIn) {
        setScanResult({
          status: 'already_checked_in',
          message: data.error,
          registration: data.registration,
          user: data.user
        });
      } else {
        setScanResult({
          status: 'error',
          message: data.error || 'Verification failed'
        });
      }
      fetchStats();
    } catch (err) {
      setScanResult({
        status: 'error',
        message: 'Network error communicating with check-in verification engine'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Setup HTML5 Camera Scanner
  useEffect(() => {
    if (scannerActive) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader-container',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          verifyToken(decodedText, 'onsite_qr_scan');
          // Temporarily pause
        },
        (error) => {
          // ignore frame errors
        }
      );

      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
      };
    }
  }, [scannerActive]);

  // Demo Fast Simulator Scenarios
  const unverifiedRegistrations = allRegistrations.filter(r => r.status !== 'checked_in');

  return (
    <div className="space-y-6">
      
      {/* Top Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-cyan-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <QrCode className="w-16 h-16 text-brand-cyan" />
          </div>
          <p className="text-xs font-bold text-brand-cyan tracking-wider uppercase">Check-In Velocity</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-white">{stats.totalCheckedIn}</span>
            <span className="text-sm text-slate-400">/ {stats.totalRegistered} Registered</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-cyan to-brand-purple h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.checkInRate}%` }}
            />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-emerald-500/20 relative overflow-hidden">
          <p className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Check-in Completion</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-emerald-400">{stats.checkInRate}%</span>
            <span className="text-xs text-emerald-500/80 font-medium">Onsite & Virtual</span>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {stats.totalRegistered - stats.totalCheckedIn} attendees pending arrival
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-purple-500/20 relative overflow-hidden">
          <p className="text-xs font-bold text-purple-400 tracking-wider uppercase">Verification Security</p>
          <div className="flex items-center gap-2 mt-2">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            <span className="text-sm font-semibold text-slate-200">HMAC-SHA256 Signed Passports</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Cryptographic anti-tamper check active</p>
        </div>
      </div>

      {/* Main Scanner & Simulator Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Scanner + Dev Simulator */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Scanner Box */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-brand-cyan" />
                <h3 className="font-bold text-slate-100 text-base">QR Scanner Station</h3>
              </div>
              <button
                onClick={() => setScannerActive(!scannerActive)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  scannerActive
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 hover:bg-brand-cyan/30'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                {scannerActive ? 'Stop Camera' : 'Start Camera Feed'}
              </button>
            </div>

            {scannerActive ? (
              <div className="bg-black/80 rounded-xl overflow-hidden border border-slate-700 p-2">
                <div id="qr-reader-container" className="w-full"></div>
              </div>
            ) : (
              <div className="border border-dashed border-slate-700 bg-slate-900/40 rounded-xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center mx-auto">
                  <QrCode className="w-6 h-6 text-brand-cyan" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Camera Feed in Standby</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Click &ldquo;Start Camera Feed&rdquo; to scan physical or smartphone badges, or use the 1-Click Dev Simulators below.
                  </p>
                </div>
              </div>
            )}

            {/* Verification Status Result Card */}
            {scanResult.status !== 'idle' && (
              <div
                className={`p-4 rounded-xl border transition-all animate-fadeIn ${
                  scanResult.status === 'success'
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-100'
                    : scanResult.status === 'already_checked_in'
                    ? 'bg-amber-950/50 border-amber-500/50 text-amber-100'
                    : 'bg-rose-950/50 border-rose-500/50 text-rose-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  {scanResult.status === 'success' && <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />}
                  {scanResult.status === 'already_checked_in' && <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />}
                  {scanResult.status === 'error' && <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />}

                  <div className="space-y-2 flex-1">
                    <p className="font-bold text-sm">{scanResult.message}</p>

                    {scanResult.user && (
                      <div className="flex items-center gap-3 pt-2 border-t border-white/10 text-xs">
                        <img
                          src={scanResult.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={scanResult.user.fullName}
                          className="w-9 h-9 rounded-full border border-white/20 object-cover"
                        />
                        <div>
                          <p className="font-bold text-white text-sm">{scanResult.user.fullName}</p>
                          <p className="text-slate-300">{scanResult.user.collegeOrCompany} • {scanResult.user.preferredRole}</p>
                        </div>
                        {scanResult.registration && (
                          <div className="ml-auto flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-black/40 text-[10px] font-mono border border-white/10">
                              👕 {scanResult.registration.tShirtSize}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-black/40 text-[10px] font-mono border border-white/10">
                              🥗 {scanResult.registration.dietaryRequirements}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 1-Click Rapid Dev Simulators */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-cyan flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  1-Click Dev Simulators (Instant Test Scans)
                </span>
                <span className="text-[10px] text-slate-400">Simulates physical QR scanner read</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allRegistrations.slice(0, 6).map((reg) => {
                  const u = reg.user;
                  const isChecked = reg.status === 'checked_in';
                  return (
                    <button
                      key={reg.id}
                      disabled={isVerifying}
                      onClick={() => verifyToken(reg.qrToken, 'onsite_qr_scan')}
                      className={`p-2 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                        isChecked
                          ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200 hover:bg-emerald-900/30'
                          : 'border-cyan-500/30 bg-cyan-950/20 text-cyan-200 hover:bg-cyan-900/30'
                      }`}
                    >
                      <div className="font-semibold truncate">{u?.fullName || 'Hacker'}</div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1">
                        <span>{u?.preferredRole.split(' ')[0]}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] ${isChecked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-cyan/20 text-brand-cyan'}`}>
                          {isChecked ? 'Checked' : 'Scan'}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {/* Tampered Token Simulation */}
                <button
                  disabled={isVerifying}
                  onClick={() => verifyToken('invalid_tampered_fake_signature_token_xyz', 'onsite_qr_scan')}
                  className="p-2 rounded-xl text-left border border-rose-500/30 bg-rose-950/20 text-rose-300 hover:bg-rose-900/30 transition-all text-xs flex flex-col justify-between"
                >
                  <div className="font-semibold truncate">🚫 Test Tampered QR</div>
                  <div className="text-[10px] text-rose-400 mt-1">Simulate Security Reject</div>
                </button>
              </div>
            </div>

          </div>

          {/* Manual Attendee Search & Check-in Override */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-brand-cyan" />
              Manual Attendee Search & Override
            </h4>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by attendee name, email, or college..."
                className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-slate-100 pl-9"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            {searchTerm && (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pt-1">
                {allRegistrations
                  .filter(
                    r =>
                      r.user?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      r.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      r.user?.collegeOrCompany.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((reg) => (
                    <div
                      key={reg.id}
                      className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">{reg.user?.fullName}</p>
                        <p className="text-[11px] text-slate-400">{reg.user?.collegeOrCompany} • {reg.user?.preferredRole}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${reg.status === 'checked_in' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                          {reg.status === 'checked_in' ? 'Checked-in' : 'Registered'}
                        </span>
                        {reg.status !== 'checked_in' && (
                          <button
                            onClick={() => verifyToken(reg.qrToken, 'organizer_override')}
                            className="px-2.5 py-1 rounded bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 text-xs font-bold transition-colors"
                          >
                            Verify Pass
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Live Check-in Activity Stream */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-2xl space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-sm">Live Check-in Stream</h3>
              </div>
              <button
                onClick={fetchStats}
                aria-label="Refresh check-in stream"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 overflow-y-auto flex-1 max-h-[500px]">
              {stats.recentCheckIns.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No check-ins recorded yet</p>
              ) : (
                stats.recentCheckIns.map((chk) => (
                  <div
                    key={chk.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={chk.user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={chk.user?.fullName}
                        className="w-8 h-8 rounded-full border border-slate-700 object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-200 truncate">{chk.user?.fullName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{chk.user?.collegeOrCompany}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-brand-cyan bg-brand-cyan/10 px-1.5 py-0.5 rounded border border-brand-cyan/20">
                        {new Date(chk.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <p className="text-[10px] text-slate-500 capitalize mt-0.5">{chk.method.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
