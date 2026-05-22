'use strict';

const { verifyAccessToken } = require('../utils/tokens');
const { errors } = require('../utils/response');
const User = require('../models/User');

/**
 * Middleware: require a valid Bearer access token.
 * Attaches `req.user` (full User document, without password).
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errors.unauthorized(res, 'Authentication required.', 'MISSING_TOKEN');
  }

  const token = authHeader.slice(7);

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errors.unauthorized(res, 'Access token expired.', 'TOKEN_EXPIRED');
    }
    return errors.unauthorized(res, 'Invalid access token.', 'INVALID_TOKEN');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    return errors.unauthorized(res, 'User not found.', 'USER_NOT_FOUND');
  }

  req.user = user;
  next();
}

/**
 * Middleware: attach user if authenticated, but do NOT block unauthenticated requests.
 * Used for optional auth on public endpoints.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (user) req.user = user;
  } catch {
    // Ignore invalid tokens on optional auth
  }

  next();
}

module.exports = { requireAuth, optionalAuth };
