import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';

import { authRouter } from './routes/auth.js';
import { eventsRouter } from './routes/events.js';
import { checkinsRouter } from './routes/checkins.js';
import { teamsRouter } from './routes/teams.js';
import { judgingRouter } from './routes/judging.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { announcementsRouter } from './routes/announcements.js';
import { initSocketServer } from './sockets/index.js';

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/events/:id', checkinsRouter);
app.use('/api/events/:id', teamsRouter);
app.use('/api/events/:id', judgingRouter);
app.use('/api/events/:id', leaderboardRouter);
app.use('/api/events/:id', announcementsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Abhiyantrix Smart Event Engine API',
    timestamp: new Date().toISOString()
  });
});

// Initialize WebSocket Engine
initSocketServer(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Abhiyantrix API & WebSocket Server Running on port ${PORT}`);
  console.log(`⚡ Real-time Event Hub Ready`);
  console.log(`====================================================`);
});
