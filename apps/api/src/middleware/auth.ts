import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { store } from '../db/store.js';
import { User, UserRole } from '@abhiyantrix/shared-types';

const JWT_SECRET = process.env.JWT_SECRET || 'abhiyantrix_jwt_dev_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Middleware: Authenticate incoming Bearer JWT token
 */
export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Authentication token is missing or invalid' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    const user = store.users.get(decoded.sub);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User account no longer exists' });
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    // Fallback for legacy demo token format
    const match = token.match(/demo_jwt_token_([^_]+)_/);
    if (match) {
      const user = store.users.get(match[1]);
      if (user) {
        req.user = user;
        next();
        return;
      }
    }
    res.status(403).json({ error: 'Forbidden: Invalid or expired authentication token' });
  }
}

/**
 * Middleware: Require specific role(s) for protected endpoints (RBAC)
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
      });
      return;
    }

    next();
  };
}
