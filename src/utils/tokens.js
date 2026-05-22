'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ── JWT ────────────────────────────────────────────────────────────────────────

/**
 * Sign a short-lived access token.
 * @param {string} userId - MongoDB ObjectId as string
 */
function signAccessToken(userId) {
  return jwt.sign({ sub: userId, type: 'access' }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    issuer: 'nestquest',
  });
}

/**
 * Sign a long-lived refresh token.
 * @param {string} userId
 * @param {string} tokenId - UUID to allow per-device revocation
 */
function signRefreshToken(userId, tokenId) {
  return jwt.sign(
    { sub: userId, jti: tokenId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      issuer: 'nestquest',
    }
  );
}

/**
 * Verify an access token. Throws on invalid/expired.
 * @returns {{ sub: string }}
 */
function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
    issuer: 'nestquest',
  });
}

/**
 * Verify a refresh token. Throws on invalid/expired.
 * @returns {{ sub: string, jti: string }}
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: 'nestquest',
  });
}

// ── Opaque tokens ──────────────────────────────────────────────────────────────

/** Generate a secure random opaque token (hex string). */
function generateOpaqueToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/** Hash an opaque token before storing in DB */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ── Cookie helpers ─────────────────────────────────────────────────────────────

const COOKIE_NAME = 'refreshToken';
const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

/** Send the refresh token as an HttpOnly cookie */
function setRefreshCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/auth',
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

/** Clear the refresh token cookie */
function clearRefreshCookie(res) {
  res.cookie(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/auth',
    maxAge: 0,
    expires: new Date(0),
  });
}

/** Get the refresh token from cookie */
function getRefreshCookie(req) {
  return req.cookies?.[COOKIE_NAME] || null;
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateOpaqueToken,
  hashToken,
  setRefreshCookie,
  clearRefreshCookie,
  getRefreshCookie,
  COOKIE_NAME,
};
