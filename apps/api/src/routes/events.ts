import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { broadcastEventStatus } from '../sockets/index.js';

export const eventsRouter = Router();

eventsRouter.get('/', (_req: Request, res: Response) => {
  const events = Array.from(store.events.values());
  res.json(events);
});

eventsRouter.get('/:id', (req: Request, res: Response) => {
  const event = store.events.get(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(event);
});

eventsRouter.patch('/:id/status', (req: Request, res: Response) => {
  const event = store.events.get(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const { status } = req.body;
  if (status) {
    event.status = status;
    broadcastEventStatus(event.id, status);
  }

  res.json(event);
});

eventsRouter.patch('/:id/config', (req: Request, res: Response) => {
  const event = store.events.get(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const { allowVirtualCheckIn, teamRosterLocked, maxTeamSize, minTeamSize } = req.body;
  if (allowVirtualCheckIn !== undefined) event.config.allowVirtualCheckIn = allowVirtualCheckIn;
  if (teamRosterLocked !== undefined) event.config.teamRosterLocked = teamRosterLocked;
  if (maxTeamSize !== undefined) event.config.maxTeamSize = maxTeamSize;
  if (minTeamSize !== undefined) event.config.minTeamSize = minTeamSize;

  res.json(event);
});
