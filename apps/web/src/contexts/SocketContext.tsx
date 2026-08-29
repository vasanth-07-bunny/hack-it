import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Announcement,
  CheckInRecord,
  LeaderboardData,
  Team
} from '@abhiyantrix/shared-types';
import { useAuth } from './AuthContext';

import { getApiUrl, getSocketUrl } from '../services/api';

export interface LiveToast {
  id: string;
  type: 'announcement' | 'checkin' | 'score' | 'leaderboard';
  title: string;
  message: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'urgent';
  data?: any;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  latestAnnouncement: Announcement | null;
  activeAnnouncements: Announcement[];
  latestCheckIn: CheckInRecord | null;
  latestLeaderboard: LeaderboardData | null;
  toasts: LiveToast[];
  dismissToast: (id: string) => void;
  audioEnabled: boolean;
  toggleAudio: () => void;
  playChime: (type: 'announcement' | 'checkin' | 'score') => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Web Audio API Synthesizer for rich interactive feedback
function playSyntheticChime(type: 'announcement' | 'checkin' | 'score') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'announcement') {
      // Urgent attention dual-tone chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } else if (type === 'checkin') {
      // Crisp positive check-in ping (Major triad)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16); // G5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'score') {
      // Fanfare score chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (err) {
    // Audio context may be blocked by browser policy before first interaction
  }
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, currentRole } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
  const [activeAnnouncements, setActiveAnnouncements] = useState<Announcement[]>([]);
  const [latestCheckIn, setLatestCheckIn] = useState<CheckInRecord | null>(null);
  const [latestLeaderboard, setLatestLeaderboard] = useState<LeaderboardData | null>(null);
  const [toasts, setToasts] = useState<LiveToast[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const eventId = 'ev-abhiyantrix-2026';

  // Initial fetch for announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(getApiUrl(`/api/events/${eventId}/announcements`));
        if (res.ok) {
          const data: Announcement[] = await res.json();
          setActiveAnnouncements(data);
          const pinned = data.find(a => a.isPinned);
          if (pinned) setLatestAnnouncement(pinned);
        }
      } catch (err) {
        console.error('Failed to load initial announcements', err);
      }
    };
    fetchAnnouncements();
  }, []);

  const addToast = (toast: Omit<LiveToast, 'id' | 'timestamp'>) => {
    const newToast: LiveToast = {
      ...toast,
      id: `toast-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString()
    };
    setToasts(prev => [newToast, ...prev.slice(0, 4)]);

    // Auto dismiss after 6s
    setTimeout(() => {
      dismissToast(newToast.id);
    }, 6000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toggleAudio = () => {
    setAudioEnabled(prev => !prev);
  };

  const playChime = (type: 'announcement' | 'checkin' | 'score') => {
    if (audioEnabled) {
      playSyntheticChime(type);
    }
  };

  useEffect(() => {
    const socketClient = io(getSocketUrl(), {
      transports: ['websocket', 'polling']
    });

    socketClient.on('connect', () => {
      // console.log('[Socket] Connected to backend');
      setIsConnected(true);
      socketClient.emit('subscribe:event', {
        eventId,
        role: currentRole,
        userId: currentUser?.id
      });
    });

    socketClient.on('disconnect', () => {
      // console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    // Real-time Event Listeners
    socketClient.on('announcement:new', (announcement: Announcement) => {
      setLatestAnnouncement(announcement);
      setActiveAnnouncements(prev => [announcement, ...prev]);
      playChime('announcement');
      addToast({
        type: 'announcement',
        title: announcement.severity === 'urgent' ? '🚨 URGENT BROADCAST' : '📢 Live Announcement',
        message: announcement.title,
        severity: announcement.severity,
        data: announcement
      });
    });

    socketClient.on('checkin:update', (payload: { totalCheckedIn: number; totalRegistered: number; record: CheckInRecord }) => {
      setLatestCheckIn(payload.record);
      playChime('checkin');
      addToast({
        type: 'checkin',
        title: '🎟️ Attendee Verified',
        message: `${payload.record.user?.fullName || 'Attendee'} checked in successfully (${payload.totalCheckedIn}/${payload.totalRegistered})`,
        data: payload
      });
    });

    socketClient.on('score:submitted', (payload: { submissionId: string; teamId: string; judgeId: string; totalWeightedScore: number }) => {
      playChime('score');
      addToast({
        type: 'score',
        title: '⚖️ Evaluation Recorded',
        message: `Score of ${payload.totalWeightedScore}/100 submitted! Recalculating Leaderboard...`,
        data: payload
      });
    });

    socketClient.on('leaderboard:update', (leaderboard: LeaderboardData) => {
      setLatestLeaderboard(leaderboard);
      const topTeam = leaderboard.rankings[0];
      if (topTeam) {
        addToast({
          type: 'leaderboard',
          title: '🏆 Leaderboard Re-ranked',
          message: `Rank #1: ${topTeam.teamName} with ${topTeam.totalScore} pts!`,
          data: leaderboard
        });
      }
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, [currentRole, currentUser?.id, audioEnabled]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        latestAnnouncement,
        activeAnnouncements,
        latestCheckIn,
        latestLeaderboard,
        toasts,
        dismissToast,
        audioEnabled,
        toggleAudio,
        playChime
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
