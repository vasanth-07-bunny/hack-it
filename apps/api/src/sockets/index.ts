import { Server as SocketIOServer } from 'socket.io';
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

  io.on('connection', (socket) => {
    // console.log(`[WebSocket] Client connected: ${socket.id}`);

    socket.on('subscribe:event', (payload: { eventId: string; role: string; userId?: string }) => {
      const eventRoom = `event:${payload.eventId}`;
      const roleRoom = `event:${payload.eventId}:role:${payload.role}`;
      socket.join(eventRoom);
      socket.join(roleRoom);
      if (payload.userId) {
        socket.join(`user:${payload.userId}`);
      }
      // console.log(`[WebSocket] ${socket.id} subscribed to ${eventRoom} as ${payload.role}`);
    });

    socket.on('unsubscribe:event', (payload: { eventId: string }) => {
      socket.leave(`event:${payload.eventId}`);
    });

    socket.on('disconnect', () => {
      // console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });
}

export function broadcastAnnouncement(eventId: string, announcement: Announcement) {
  if (!ioInstance) return;
  ioInstance.to(`event:${eventId}`).emit('announcement:new', announcement);
}

export function broadcastCheckInUpdate(eventId: string, totalCheckedIn: number, totalRegistered: number, record: CheckInRecord) {
  if (!ioInstance) return;
  ioInstance.to(`event:${eventId}`).emit('checkin:update', {
    totalCheckedIn,
    totalRegistered,
    record
  });
}

export function broadcastScoreSubmitted(eventId: string, payload: { submissionId: string; teamId: string; judgeId: string; totalWeightedScore: number }) {
  if (!ioInstance) return;
  ioInstance.to(`event:${eventId}`).emit('score:submitted', payload);
}

export function broadcastLeaderboardUpdate(eventId: string, leaderboard: LeaderboardData) {
  if (!ioInstance) return;
  ioInstance.to(`event:${eventId}`).emit('leaderboard:update', leaderboard);
}

export function broadcastTeamUpdate(eventId: string, team: Team) {
  if (!ioInstance) return;
  ioInstance.to(`event:${eventId}`).emit('team:updated', team);
}

export function broadcastEventStatus(eventId: string, status: EventStatus) {
  if (!ioInstance) return;
  ioInstance.to(`event:${eventId}`).emit('event:status_changed', { eventId, status });
}
