import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  Announcement,
  CheckInRecord,
  LeaderboardData,
  Team,
  EventStatus
} from '@abhiyantrix/shared-types';

let ioInstance: SocketIOServer | null = null;

export function initSocketServer(io: SocketIOServer) {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    socket.on('subscribe:event', (payload: { eventId?: string; role?: string; userId?: string }) => {
      if (!payload || !payload.eventId) return;

      const sanitizedEventId = String(payload.eventId).replace(/[^a-zA-Z0-9_-]/g, '');
      const eventRoom = `event:${sanitizedEventId}`;
      socket.join(eventRoom);

      if (payload.role) {
        const sanitizedRole = String(payload.role).replace(/[^a-zA-Z0-9_-]/g, '');
        const roleRoom = `event:${sanitizedEventId}:role:${sanitizedRole}`;
        socket.join(roleRoom);
      }

      if (payload.userId) {
        const sanitizedUserId = String(payload.userId).replace(/[^a-zA-Z0-9_-]/g, '');
        socket.join(`user:${sanitizedUserId}`);
      }
    });

    socket.on('unsubscribe:event', (payload: { eventId?: string }) => {
      if (!payload || !payload.eventId) return;
      const sanitizedEventId = String(payload.eventId).replace(/[^a-zA-Z0-9_-]/g, '');
      socket.leave(`event:${sanitizedEventId}`);
    });

    socket.on('error', (err) => {
      console.error('[WebSocket Error]:', err);
    });
  });
}

export function broadcastAnnouncement(eventId: string, announcement: Announcement) {
  if (!ioInstance) return;
  const sanitizedId = String(eventId).replace(/[^a-zA-Z0-9_-]/g, '');
  ioInstance.to(`event:${sanitizedId}`).emit('announcement:new', announcement);
}

export function broadcastCheckInUpdate(eventId: string, totalCheckedIn: number, totalRegistered: number, record: CheckInRecord) {
  if (!ioInstance) return;
  const sanitizedId = String(eventId).replace(/[^a-zA-Z0-9_-]/g, '');
  ioInstance.to(`event:${sanitizedId}`).emit('checkin:update', {
    totalCheckedIn,
    totalRegistered,
    record
  });
}

export function broadcastScoreSubmitted(eventId: string, payload: { submissionId: string; teamId: string; judgeId: string; totalWeightedScore: number }) {
  if (!ioInstance) return;
  const sanitizedId = String(eventId).replace(/[^a-zA-Z0-9_-]/g, '');
  ioInstance.to(`event:${sanitizedId}`).emit('score:submitted', payload);
}

export function broadcastLeaderboardUpdate(eventId: string, leaderboard: LeaderboardData) {
  if (!ioInstance) return;
  const sanitizedId = String(eventId).replace(/[^a-zA-Z0-9_-]/g, '');
  ioInstance.to(`event:${sanitizedId}`).emit('leaderboard:update', leaderboard);
}

export function broadcastTeamUpdate(eventId: string, team: Team) {
  if (!ioInstance) return;
  const sanitizedId = String(eventId).replace(/[^a-zA-Z0-9_-]/g, '');
  ioInstance.to(`event:${sanitizedId}`).emit('team:updated', team);
}

export function broadcastEventStatus(eventId: string, status: EventStatus) {
  if (!ioInstance) return;
  const sanitizedId = String(eventId).replace(/[^a-zA-Z0-9_-]/g, '');
  ioInstance.to(`event:${sanitizedId}`).emit('event:status_changed', { eventId: sanitizedId, status });
}
