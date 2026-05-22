'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRouter = require('./routes/auth');
const propertiesRouter = require('./routes/properties');
const bookingsRouter = require('./routes/bookings');
const locationsRouter = require('./routes/locations');
const usersRouter = require('./routes/users');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  // ── Security headers ───────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // ── CORS ───────────────────────────────────────────────────────────────────
  const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS: Origin ${origin} not allowed`));
      },
      credentials: true, // Required for HttpOnly cookies
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Total-Count'],
    })
  );

  // Pre-flight
  app.options('*', cors());

  // ── Request logging ────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'test') {
    app.use(
      morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')
    );
  }

  // ── Body parsing ───────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // ── Trust proxy (for rate limiting behind reverse proxy) ─────────────────
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // ── Global rate limiter ────────────────────────────────────────────────────
  const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '200', 10),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: 900,
        },
      });
    },
  });
  app.use(globalLimiter);

  // ── Auth-specific rate limiter (stricter) ──────────────────────────────────
  const authLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many login attempts. Please try again in 15 minutes.',
          retryAfter: 900,
        },
      });
    },
  });

  // ── Health check ───────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'nestquest-api',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'nestquest-api',
      timestamp: new Date().toISOString(),
    });
  });

  // ── Routes ─────────────────────────────────────────────────────────────────
  // Apply auth rate limiter only to sensitive auth endpoints
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/forgot-password', authLimiter);

  app.use('/api/auth', authRouter);

  // IMPORTANT: /properties/featured and /properties/cities are registered
  // BEFORE /properties/:id inside the properties router — this is handled
  // within the router file by route declaration order.
  app.use('/api/properties', propertiesRouter);

  app.use('/api/bookings', bookingsRouter);
  app.use('/api/locations', locationsRouter);
  app.use('/api/users', usersRouter);

  // ── 404 catch-all ─────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── Global error handler (must be last) ───────────────────────────────────
  app.use(globalErrorHandler);

  return app;
}

module.exports = createApp;
