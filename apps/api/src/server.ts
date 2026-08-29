import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { Server as SocketIOServer } from 'socket.io';

import { authRouter } from './routes/auth.js';
import { eventsRouter } from './routes/events.js';
import { checkinsRouter } from './routes/checkins.js';
import { teamsRouter } from './routes/teams.js';
import { judgingRouter } from './routes/judging.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { announcementsRouter } from './routes/announcements.js';
import { initSocketServer } from './sockets/index.js';
import { generalApiLimiter, sanitizeInputs, globalErrorHandler } from './middleware/security.js';

export const app = express();
export const server = http.createServer(app);

// Configure Socket.IO
export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitizeInputs);
app.use(generalApiLimiter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    service: 'Abhiyantrix Smart Event Engine API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Modular Routes
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/events/:id', checkinsRouter);
app.use('/api/events/:id', teamsRouter);
app.use('/api/events/:id', judgingRouter);
app.use('/api/events/:id', leaderboardRouter);
app.use('/api/events/:id', announcementsRouter);

// Global Error Handler
app.use(globalErrorHandler);

// Initialize WebSocket Engine
initSocketServer(io);

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Abhiyantrix API & WebSocket Server Running on port ${PORT}`);
    console.log(`🛡️ Enterprise Security & Rate Limiting Activated`);
    console.log(`⚡ Real-time Event Hub Ready`);
    console.log(`====================================================`);
  });
}
