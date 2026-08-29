import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { Team, TeamMember } from '@abhiyantrix/shared-types';
import { broadcastTeamUpdate } from '../sockets/index.js';
import { validateBody, CreateTeamSchema, JoinTeamSchema, LockTeamSchema } from '../middleware/validate.js';

export const teamsRouter = Router({ mergeParams: true });

// Get Matchmaking Participants (Filtered by skills, role, unassigned status)
teamsRouter.get('/matchmaking/participants', (req: Request, res: Response) => {
  const eventId = (req.params as { id: string }).id;
  const { skill, role, unassignedOnly } = req.query;

  const registrations = Array.from(store.registrations.values()).filter(r => r.eventId === eventId);
  const teams = Array.from(store.teams.values()).filter(t => t.eventId === eventId);

  // Set of user IDs already in a team
  const assignedUserIds = new Set<string>();
  teams.forEach(t => {
    t.members.forEach(m => assignedUserIds.add(m.userId));
  });

  let participantUsers = registrations.map(r => {
    const user = store.users.get(r.userId)!;
    const team = teams.find(t => t.members.some(m => m.userId === user?.id));
    return {
      ...user,
      registrationStatus: r.status,
      teamId: team?.id,
      teamName: team?.name,
      isAssigned: !!team
    };
  });

  if (unassignedOnly === 'true') {
    participantUsers = participantUsers.filter(p => !p.isAssigned);
  }

  if (role) {
    participantUsers = participantUsers.filter(p =>
      p.preferredRole?.toLowerCase().includes((role as string).toLowerCase())
    );
  }

  if (skill) {
    const skillTerm = (skill as string).toLowerCase();
    participantUsers = participantUsers.filter(p =>
      p.skills?.some(s => s.toLowerCase().includes(skillTerm))
    );
  }

  return res.json(participantUsers);
});

// Get Matchmaking Teams (Filtered by track, needed skills, open roles)
teamsRouter.get('/matchmaking/teams', (req: Request, res: Response) => {
  const eventId = (req.params as { id: string }).id;
  const { track, neededSkill, hasOpenRoles } = req.query;

  let teams = Array.from(store.teams.values())
    .filter(t => t.eventId === eventId)
    .map(t => ({
      ...t,
      members: t.members.map(m => ({
        ...m,
        user: store.users.get(m.userId)
      }))
    }));

  if (track && track !== 'All') {
    teams = teams.filter(t => t.track === track);
  }

  if (neededSkill) {
    const skillTerm = (neededSkill as string).toLowerCase();
    teams = teams.filter(t =>
      t.neededSkills.some(s => s.toLowerCase().includes(skillTerm))
    );
  }

  if (hasOpenRoles === 'true') {
    teams = teams.filter(t => t.openRoles.length > 0 && !t.isLocked);
  }

  return res.json(teams);
});

// Create a new Team with Zod validation
teamsRouter.post('/teams', validateBody(CreateTeamSchema), (req: Request, res: Response) => {
  const eventId = (req.params as { id: string }).id;
  const { name, pitch, track, leaderId, openRoles, neededSkills } = req.body;

  const leaderUser = store.users.get(leaderId);
  if (!leaderUser) {
    return res.status(404).json({ error: 'Leader user not found' });
  }

  const newTeam: Team = {
    id: `team-${Date.now().toString().slice(-6)}`,
    eventId,
    name,
    pitch,
    track,
    leaderId,
    members: [
      {
        userId: leaderId,
        roleInTeam: leaderUser.preferredRole || 'Team Lead',
        joinedAt: new Date().toISOString(),
        user: leaderUser
      }
    ],
    openRoles: Array.isArray(openRoles) ? openRoles : ['Full-Stack Dev'],
    neededSkills: Array.isArray(neededSkills) ? neededSkills : ['React', 'Node.js'],
    isLocked: false,
    createdAt: new Date().toISOString()
  };

  store.teams.set(newTeam.id, newTeam);
  broadcastTeamUpdate(eventId, newTeam);

  return res.status(201).json(newTeam);
});

// Join Request / Direct Add to Team
teamsRouter.post('/teams/:teamId/join', validateBody(JoinTeamSchema), (req: Request, res: Response) => {
  const eventId = (req.params as { id: string; teamId: string }).id;
  const teamId = (req.params as { id: string; teamId: string }).teamId;
  const { userId, roleInTeam } = req.body;

  const team = store.teams.get(teamId);
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  if (team.isLocked) {
    return res.status(400).json({ error: 'Team roster is locked' });
  }

  const event = store.events.get(eventId);
  if (team.members.length >= (event?.config.maxTeamSize || 4)) {
    return res.status(400).json({ error: 'Team is already at maximum capacity' });
  }

  const user = store.users.get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if already in this team
  if (team.members.some(m => m.userId === userId)) {
    return res.status(400).json({ error: 'User already in this team' });
  }

  // Remove from any other team
  Array.from(store.teams.values()).forEach(t => {
    t.members = t.members.filter(m => m.userId !== userId);
  });

  const newMember: TeamMember = {
    userId,
    roleInTeam: roleInTeam || user.preferredRole || 'Member',
    joinedAt: new Date().toISOString(),
    user
  };

  team.members.push(newMember);

  // If user matched an open role or needed skill, update them
  if (team.openRoles.length > 0) {
    team.openRoles.shift();
  }

  broadcastTeamUpdate(eventId, team);

  return res.json({
    message: `Welcome to ${team.name}!`,
    team
  });
});

// Lock Team Roster
teamsRouter.patch('/teams/:teamId/lock', validateBody(LockTeamSchema), (req: Request, res: Response) => {
  const eventId = (req.params as { id: string; teamId: string }).id;
  const teamId = (req.params as { id: string; teamId: string }).teamId;
  const { isLocked } = req.body;

  const team = store.teams.get(teamId);
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  team.isLocked = isLocked !== undefined ? isLocked : true;
  broadcastTeamUpdate(eventId, team);

  return res.json({ team });
});
