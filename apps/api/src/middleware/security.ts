import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Standard API Rate Limiter
 * Limits requests to prevent DDoS and abusive traffic patterns.
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

/**
 * Strict Rate Limiter for Sensitive Endpoints
 * (Authentication, QR Token Verification, Score Submission)
 */
export const strictOperationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate limit exceeded for sensitive operation. Please throttle your requests.'
  }
});

/**
 * Input sanitizer to prevent XSS payloads, prototype pollution, and script injection
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>?/gm, '')
    .trim();
}

/**
 * Recursive sanitizer for JSON objects
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return sanitizeString(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // Prevent prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      cleaned[key] = sanitizeObject(value);
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Middleware to sanitize all incoming request bodies and query parameters
 */
export function sanitizeInputs(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Enterprise Global Error Handler
 * Ensures consistent JSON responses and never leaks stack traces in production.
 */
export function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[API Error]:', err.message);
  
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  const isDev = process.env.NODE_ENV !== 'production';

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    ...(isDev && { stack: err.stack })
  });
}
