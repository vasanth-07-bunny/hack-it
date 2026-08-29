import { Router } from 'express';
import { store } from '../db/store.js';
import { Announcement, AnnouncementSeverity } from '@abhiyantrix/shared-types';
import { broadcastAnnouncement } from '../sockets/index.js';

export const announcementsRouter = Router({ mergeParams: true });

// Get Announcements
announcementsRouter.get('/announcements', (req, res) => {
  const eventId = req.params.id as string;
  const announcements = Array.from(store.announcements.values())
    .filter(a => a.eventId === eventId)
    .sort((a, b) => {
      // Pinned first, then newest
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return res.json(announcements);
});

// Broadcast a new Announcement (Organizer)
announcementsRouter.post('/announcements', (req, res) => {
  const eventId = req.params.id as string;
  const { title, message, severity, targetAudience, targetTrack, isPinned, authorId, authorName } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  const announcement: Announcement = {
    id: `ann-${Date.now().toString().slice(-6)}`,
    eventId,
    authorId: authorId || 'usr-org-1',
    authorName: authorName || 'Event Operations',
    title,
    message,
    severity: (severity as AnnouncementSeverity) || 'info',
    targetAudience: targetAudience || 'all',
    targetTrack: targetTrack || undefined,
    isPinned: !!isPinned,
    createdAt: new Date().toISOString()
  };

  store.announcements.set(announcement.id, announcement);

  // Real-time WebSocket push broadcast to all connected clients in this event room
  broadcastAnnouncement(eventId, announcement);

  return res.status(201).json(announcement);
});
