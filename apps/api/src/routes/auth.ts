import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { store } from '../db/store.js';
import { UserRole } from '@abhiyantrix/shared-types';
import { strictOperationLimiter } from '../middleware/security.js';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'abhiyantrix_jwt_dev_key_2026';

// Fast switch or login for demo / role sandbox
authRouter.post('/login', strictOperationLimiter, (req: Request, res: Response) => {
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

  // Issue real cryptographic JWT token
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.fullName
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({ token, user });
});

authRouter.get('/users', (req: Request, res: Response) => {
  const role = req.query.role as UserRole;
  let users = Array.from(store.users.values());
  if (role) {
    users = users.filter(u => u.role === role);
  }
  return res.json(users);
});

authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    const defaultUser = store.users.get('usr-org-1');
    return res.json({ user: defaultUser });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    const user = store.users.get(decoded.sub);
    if (user) {
      return res.json({ user });
    }
  } catch (_err) {
    // Fallback for legacy demo token format
    const match = token.match(/demo_jwt_token_([^_]+)_/);
    if (match) {
      const user = store.users.get(match[1]);
      if (user) return res.json({ user });
    }
  }

  const defaultUser = store.users.get('usr-org-1');
  return res.json({ user: defaultUser });
});
