import { Router } from 'express';
import { store } from '../db/store.js';
import { broadcastEventStatus } from '../sockets/index.js';

export const eventsRouter = Router();

eventsRouter.get('/', (req, res) => {
  const events = Array.from(store.events.values());
  res.json(events);
});

eventsRouter.get('/:id', (req, res) => {
  const event = store.events.get(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(event);
});

eventsRouter.patch('/:id/status', (req, res) => {
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

eventsRouter.patch('/:id/config', (req, res) => {
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
