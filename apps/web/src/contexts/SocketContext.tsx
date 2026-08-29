import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Announcement,
  CheckInRecord,
  LeaderboardData,
  Team
} from '@abhiyantrix/shared-types';
import { useAuth } from './AuthContext';
import { getApiUrl, getSocketUrl, apiFetch } from '../services/api';
import { realtimeBus } from '../services/localStore';

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
    // Audio context policy
  }
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, currentRole } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
  const [activeAnnouncements, setActiveAnnouncements] = useState<Announcement[]>([]);
  const [latestCheckIn, setLatestCheckIn] = useState<CheckInRecord | null>(null);
  const [latestLeaderboard, setLatestLeaderboard] = useState<LeaderboardData | null>(null);
  const [toasts, setToasts] = useState<LiveToast[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const eventId = 'ev-abhiyantrix-2026';

  const addToast = (toast: Omit<LiveToast, 'id' | 'timestamp'>) => {
    const newToast: LiveToast = {
      ...toast,
      id: `toast-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString()
    };
    setToasts(prev => [newToast, ...prev.slice(0, 4)]);

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

  // Initial fetch for announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await apiFetch(`/api/events/${eventId}/announcements`);
        if (Array.isArray(data)) {
          setActiveAnnouncements(data);
          const pinned = data.find((a: Announcement) => a.isPinned);
          if (pinned) setLatestAnnouncement(pinned);
        }
      } catch (err) {
        console.error('Failed to load initial announcements', err);
      }
    };
    fetchAnnouncements();
  }, []);

  // Shared event handlers
  const handleNewAnnouncement = (announcement: Announcement) => {
    setLatestAnnouncement(announcement);
    setActiveAnnouncements(prev => [announcement, ...prev.filter(a => a.id !== announcement.id)]);
    playChime('announcement');
    addToast({
      type: 'announcement',
      title: announcement.severity === 'urgent' ? '🚨 URGENT BROADCAST' : '📢 Live Announcement',
      message: announcement.title,
      severity: announcement.severity,
      data: announcement
    });
  };

  const handleCheckInUpdate = (payload: { totalCheckedIn: number; totalRegistered: number; record: CheckInRecord }) => {
    setLatestCheckIn(payload.record);
    playChime('checkin');
    addToast({
      type: 'checkin',
      title: '🎟️ Attendee Verified',
      message: `${payload.record.user?.fullName || 'Attendee'} checked in successfully (${payload.totalCheckedIn}/${payload.totalRegistered})`,
      data: payload
    });
  };

  const handleScoreSubmitted = (payload: { submissionId: string; teamId: string; judgeId: string; totalWeightedScore: number }) => {
    playChime('score');
    addToast({
      type: 'score',
      title: '⚖️ Evaluation Recorded',
      message: `Score of ${payload.totalWeightedScore}/100 submitted! Recalculating Leaderboard...`,
      data: payload
    });
  };

  const handleLeaderboardUpdate = (leaderboard: LeaderboardData) => {
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
  };

  // Subscribe to Realtime Bus (Cross-tab + Local simulation)
  useEffect(() => {
    realtimeBus.on('announcement:new', handleNewAnnouncement);
    realtimeBus.on('checkin:update', handleCheckInUpdate);
    realtimeBus.on('score:submitted', handleScoreSubmitted);
    realtimeBus.on('leaderboard:update', handleLeaderboardUpdate);

    return () => {
      realtimeBus.off('announcement:new', handleNewAnnouncement);
      realtimeBus.off('checkin:update', handleCheckInUpdate);
      realtimeBus.off('score:submitted', handleScoreSubmitted);
      realtimeBus.off('leaderboard:update', handleLeaderboardUpdate);
    };
  }, [audioEnabled]);

  // Connect to Socket.IO if backend available
  useEffect(() => {
    try {
      const socketClient = io(getSocketUrl(), {
        transports: ['websocket', 'polling'],
        timeout: 3000,
        autoConnect: true
      });

      socketClient.on('connect', () => {
        setIsConnected(true);
        socketClient.emit('subscribe:event', {
          eventId,
          role: currentRole,
          userId: currentUser?.id
        });
      });

      socketClient.on('announcement:new', handleNewAnnouncement);
      socketClient.on('checkin:update', handleCheckInUpdate);
      socketClient.on('score:submitted', handleScoreSubmitted);
      socketClient.on('leaderboard:update', handleLeaderboardUpdate);

      setSocket(socketClient);

      return () => {
        socketClient.disconnect();
      };
    } catch {
      // Local event bus remains active
    }
  }, [currentRole, currentUser?.id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected: true, // Always show active sync status for prototype/live
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
