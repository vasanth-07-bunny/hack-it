import { Router } from 'express';
import { store } from '../db/store.js';
import { UserRole } from '@abhiyantrix/shared-types';

export const authRouter = Router();

// Fast switch or login for demo / role sandbox
authRouter.post('/login', (req, res) => {
  const { email, role, userId } = req.body;

  let user = null;
  if (userId) {
    user = store.users.get(userId);
  } else if (email) {
    user = Array.from(store.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  } else if (role) {
    user = Array.from(store.users.values()).find(u => u.role === role);
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Issue demo session token
  const token = `demo_jwt_token_${user.id}_${user.role}_${Date.now()}`;
  return res.json({ token, user });
});

authRouter.get('/users', (req, res) => {
  const role = req.query.role as UserRole;
  let users = Array.from(store.users.values());
  if (role) {
    users = users.filter(u => u.role === role);
  }
  return res.json(users);
});

authRouter.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Default to organizer for convenience or participant
    const defaultUser = store.users.get('usr-org-1');
    return res.json({ user: defaultUser });
  }

  const token = authHeader.replace('Bearer ', '');
  const match = token.match(/demo_jwt_token_([^_]+)_/);
  if (match) {
    const userId = match[1];
    const user = store.users.get(userId);
    if (user) {
      return res.json({ user });
    }
  }

  const defaultUser = store.users.get('usr-org-1');
  return res.json({ user: defaultUser });
});
