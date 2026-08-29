import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { Announcement, AnnouncementSeverity } from '@abhiyantrix/shared-types';
import { broadcastAnnouncement } from '../sockets/index.js';
import { validateBody, CreateAnnouncementSchema } from '../middleware/validate.js';

export const announcementsRouter = Router({ mergeParams: true });

// Get Announcements
announcementsRouter.get('/announcements', (req: Request, res: Response) => {
  const eventId = (req.params as { id: string }).id;
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
announcementsRouter.post('/announcements', validateBody(CreateAnnouncementSchema), (req: Request, res: Response) => {
  const eventId = (req.params as { id: string }).id;
  const { title, message, severity, targetAudience, targetTrack, isPinned, authorId, authorName } = req.body;

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
  store.persist();

  // Real-time WebSocket push broadcast to all connected clients in this event room
  broadcastAnnouncement(eventId, announcement);

  return res.status(201).json(announcement);
});
