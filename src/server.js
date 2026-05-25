'use strict';

require('dotenv').config();

const createApp = require('./app');
const connectDB = require('./config/database');
const { startStatusTransitionJob } = require('./jobs/statusTransition');

const PORT = parseInt(process.env.PORT || '8000', 10);
const HOST = '0.0.0.0';

async function main() {
  console.log('[Server] Starting NestQuest API...');
  console.log('[Server] NODE_ENV           =', process.env.NODE_ENV || 'development');
  console.log('[Server] PORT               =', PORT, process.env.PORT ? '(from $PORT env)' : '(fallback default)');
  console.log('[Server] MONGODB_URI        =', process.env.MONGODB_URI ? 'SET' : 'NOT SET -- will crash');
  console.log('[Server] JWT_ACCESS_SECRET  =', process.env.JWT_ACCESS_SECRET ? 'SET' : 'NOT SET');
  console.log('[Server] JWT_REFRESH_SECRET =', process.env.JWT_REFRESH_SECRET ? 'SET' : 'NOT SET');
  console.log('[Server] FRONTEND_ORIGIN    =', process.env.FRONTEND_ORIGIN || 'NOT SET');

  if (!process.env.MONGODB_URI) {
    console.error('[Server] FATAL: MONGODB_URI is not set.');
    process.exit(1);
  }
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    console.error('[Server] FATAL: JWT secrets are not set.');
    process.exit(1);
  }

  await connectDB();

  const app = createApp();

  const server = app.listen(PORT, HOST, () => {
    console.log('[Server] Listening on ' + HOST + ':' + PORT);
    console.log('[Server] Health check: /api/health');
  });

  // Start background jobs AFTER server is listening
  server.on('listening', () => {
    startStatusTransitionJob();
  });

  const shutdown = async (signal) => {
    console.log('[Server] ' + signal + ' received. Shutting down gracefully...');
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      console.log('[Server] MongoDB connection closed.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('[Server] Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  // Log but DO NOT exit on unhandled rejections in production —
  // a single bad async operation should not take down the whole server.
  process.on('unhandledRejection', (reason) => {
    console.error('[Server] Unhandled Promise Rejection (non-fatal):', reason);
  });

  // uncaughtException IS fatal (sync code threw) — exit and let Railway restart
  process.on('uncaughtException', (err) => {
    console.error('[Server] Uncaught Exception (fatal):', err.message);
    shutdown('UNCAUGHT_EXCEPTION');
  });
}

main().catch((err) => {
  console.error('[Server] Failed to start:', err.message);
  process.exit(1);
});
