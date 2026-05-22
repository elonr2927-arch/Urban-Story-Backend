'use strict';

const { errors } = require('../utils/response');

/**
 * Wrap an async route handler to catch errors and pass them to next().
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handler. Must be the last middleware registered.
 */
function globalErrorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const fields = {};
    for (const [key, val] of Object.entries(err.errors)) {
      fields[key] = val.message;
    }
    return errors.validation(res, 'Validation failed', fields);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const fields = { [field]: `${field} already exists` };
    return errors.validation(res, 'Duplicate value', fields);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return errors.notFound(res, 'Resource not found.', 'NOT_FOUND');
  }

  // JWT errors (shouldn't reach here normally, caught in middleware)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return errors.unauthorized(res, 'Invalid token.', 'INVALID_TOKEN');
  }

  // Log unhandled errors
  console.error('[Error Handler]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  return errors.serverError(res);
}

/**
 * 404 handler for unmatched routes.
 */
function notFoundHandler(req, res) {
  return errors.notFound(res, `Cannot ${req.method} ${req.path}`, 'ROUTE_NOT_FOUND');
}

module.exports = { asyncHandler, globalErrorHandler, notFoundHandler };
