'use strict';

const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

let retryCount = 0;

/**
 * Connect to MongoDB with retry logic and connection health monitoring.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set.');
  }

  mongoose.set('strictQuery', true);

  // ── Event listeners ───────────────────────────────────────────────────────
  mongoose.connection.on('connected', () => {
    console.log(`[MongoDB] Connected → ${sanitizeUri(uri)}`);
    retryCount = 0;
  });

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected. Attempting reconnect…');
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('[MongoDB] Connection closed via SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    console.log('[MongoDB] Connection closed via SIGTERM');
    process.exit(0);
  });

  await attemptConnect(uri);
}

async function attemptConnect(uri) {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
  } catch (err) {
    retryCount += 1;
    console.error(`[MongoDB] Connection failed (attempt ${retryCount}/${MAX_RETRIES}): ${err.message}`);

    if (retryCount >= MAX_RETRIES) {
      console.error('[MongoDB] Max retries reached. Exiting.');
      process.exit(1);
    }

    console.log(`[MongoDB] Retrying in ${RETRY_DELAY_MS / 1000}s…`);
    await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
    await attemptConnect(uri);
  }
}

/** Strip credentials from URI for safe logging */
function sanitizeUri(uri) {
  try {
    const url = new URL(uri);
    url.password = '***';
    url.username = url.username ? '***' : '';
    return url.toString();
  } catch {
    return '[unparseable URI]';
  }
}

module.exports = connectDB;
