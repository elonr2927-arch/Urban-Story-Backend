'use strict';

require('dotenv').config();

const createApp = require('./app');
const connectDB = require('./config/database');
const { startStatusTransitionJob } = require('./jobs/statusTransition');

const PORT = parseInt(process.env.PORT || '8000', 10);

async function main() {
  // Connect to MongoDB first
  await connectDB();

  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║          NestQuest API — Running           ║
╠════════════════════════════════════════════╣
║  Port    : ${String(PORT).padEnd(33)}║
║  Env     : ${String(process.env.NODE_ENV || 'development').padEnd(33)}║
║  Base URL: /api                            ║
╚════════════════════════════════════════════╝
    `);
  });

  // Start background jobs
  startStatusTransitionJob();

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n[Server] ${signal} received. Shutting down gracefully…`);
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      console.log('[Server] MongoDB connection closed.');
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      console.error('[Server] Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('[Server] Unhandled Promise Rejection:', reason);
    // In production, you may want to exit and let the process manager restart
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
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
