'use strict';

require('dotenv').config();

const createApp = require('./app');
const connectDB = require('./config/database');
const { startStatusTransitionJob } = require('./jobs/statusTransition');

// Railway injects PORT automatically. Must bind to 0.0.0.0 (not 127.0.0.1).
const PORT = parseInt(process.env.PORT || '8000', 10);
const HOST = '0.0.0.0';

async function main() {
  // Startup diagnostics — visible in Railway's deploy logs
  console.log('[Server] Starting NestQuest API...');
  console.log('[Server] NODE_ENV           =', process.env.NODE_ENV || 'development');
  console.log('[Server] PORT               =', PORT, process.env.PORT ? '(from $PORT env)' : '(fallback default)');
  console.log('[Server] MONGODB_URI        =', process.env.MONGODB_URI ? 'SET' : 'NOT SET -- will crash');
  console.log('[Server] JWT_ACCESS_SECRET  =', process.env.JWT_ACCESS_SECRET ? 'SET' : 'NOT SET');
  console.log('[Server] JWT_REFRESH_SECRET =', process.env.JWT_REFRESH_SECRET ? 'SET' : 'NOT SET');
  console.log('[Server] FRONTEND_ORIGIN    =', process.env.FRONTEND_ORIGIN || 'NOT SET (CORS will block browser requests)');

  // Bail early if critical env vars are missing
  if (!process.env.MONGODB_URI) {
    console.error('[Server] FATAL: MONGODB_URI is not set. Add it to Railway environment variables.');
    process.exit(1);
  }
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    console.error('[Server] FATAL: JWT secrets are not set. Add JWT_ACCESS_SECRET and JWT_REFRESH_SECRET to Railway.');
    process.exit(1);
  }

  // Connect to MongoDB
  await connectDB();

  const app = createApp();

  // Bind to 0.0.0.0 so Railway's proxy can reach the process
  const server = app.listen(PORT, HOST, () => {
    console.log('[Server] Listening on ' + HOST + ':' + PORT);
    console.log('[Server] Health check: /api/health');
  });

  // Start background jobs
  startStatusTransitionJob();

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log('[Server] ' + signal + ' received. Shutting down gracefully...');
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      console.log('[Server] MongoDB connection closed.');
      process.exit(0);
    });

    // Force exit after 10s if graceful shutdown stalls
    setTimeout(() => {
      console.error('[Server] Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('[Server] Unhandled Promise Rejection:', reason);
    if (process.env.NODE_ENV === 'production') {
      shutdown('UNHANDLED_REJECTION');
    }
  });

  process.on('uncaughtException', (err) => {
    console.error('[Server] Uncaught Exception:', err);
    shutdown('UNCAUGHT_EXCEPTION');
  });
}

main().catch((err) => {
  console.error('[Server] Failed to start:', err.message);
  process.exit(1);
});
