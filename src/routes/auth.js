'use strict';

const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { validate, runValidation } = require('../middleware/validation');
const { errors, sendSuccess } = require('../utils/response');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  setRefreshCookie,
  clearRefreshCookie,
  getRefreshCookie,
} = require('../utils/tokens');
const { sendPasswordResetEmail } = require('../utils/email');

const router = express.Router();

const RESET_TOKEN_EXPIRES_MS = 60 * 60 * 1000; // 1 hour

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Issue an access + refresh token pair and set the cookie.
 * Stores hashed refresh token in user's refreshTokens array.
 */
async function issueTokenPair(res, user) {
  const tokenId = uuidv4();
  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = signRefreshToken(user._id.toString(), tokenId);

  // Store hashed refresh token (limit to 10 active devices)
  const hashed = hashToken(refreshToken);
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(hashed);
  if (user.refreshTokens.length > 10) {
    user.refreshTokens = user.refreshTokens.slice(-10);
  }
  await User.findByIdAndUpdate(user._id, {
    $set: { refreshTokens: user.refreshTokens },
  });

  setRefreshCookie(res, refreshToken);
  return accessToken;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { isValid, fields } = runValidation([
      {
        field: 'email',
        checks: [
          () => validate.required(email, 'Email'),
          () => validate.email(email),
        ],
      },
      {
        field: 'password',
        checks: [
          () => validate.required(password, 'Password'),
          () => validate.minLength(password, 6, 'Password'),
        ],
      },
    ]);

    if (!isValid) {
      return errors.validation(res, 'Validation failed', fields);
    }

    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      return errors.unauthorized(res, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    const passwordValid = await user.comparePassword(password);
    if (!passwordValid) {
      return errors.unauthorized(res, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    // Need refreshTokens field for issueTokenPair
    const userWithTokens = await User.findById(user._id).select('+refreshTokens');
    const accessToken = await issueTokenPair(res, userWithTokens);

    return sendSuccess(res, {
      user: user.toPublic(),
      accessToken,
    });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/register
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const { isValid, fields } = runValidation([
      {
        field: 'name',
        checks: [
          () => validate.required(name, 'Name'),
          () => validate.minLength(name, 2, 'Name'),
          () => validate.maxLength(name, 60, 'Name'),
        ],
      },
      {
        field: 'email',
        checks: [
          () => validate.required(email, 'Email'),
          () => validate.email(email),
        ],
      },
      {
        field: 'password',
        checks: [
          () => validate.required(password, 'Password'),
          () => validate.minLength(password, 6, 'Password'),
          () => validate.maxLength(password, 72, 'Password'),
        ],
      },
    ]);

    if (!isValid) {
      return errors.validation(res, 'Validation failed', fields);
    }

    // Check for existing email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return sendSuccess(
        res,
        {
          error: {
            code: 'EMAIL_CONFLICT',
            message: 'An account with this email already exists.',
            fields: { email: 'Already registered' },
          },
        },
        409
      );
    }

    const user = await User.create({ name, email, password });
    const userWithTokens = await User.findById(user._id).select('+refreshTokens');
    const accessToken = await issueTokenPair(res, userWithTokens);

    return sendSuccess(
      res,
      {
        user: user.toPublic(),
        accessToken,
      },
      201
    );
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/logout
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const rawToken = getRefreshCookie(req);

    if (rawToken) {
      try {
        const payload = verifyRefreshToken(rawToken);
        const hashed = hashToken(rawToken);
        // Remove this specific refresh token
        await User.findByIdAndUpdate(payload.sub, {
          $pull: { refreshTokens: hashed },
        });
      } catch {
        // Token invalid/expired — still clear cookie
      }
    }

    clearRefreshCookie(res);
    return sendSuccess(res, { success: true });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/refresh
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const rawToken = getRefreshCookie(req);

    if (!rawToken) {
      return errors.unauthorized(
        res,
        'Session expired. Please sign in again.',
        'REFRESH_TOKEN_INVALID'
      );
    }

    let payload;
    try {
      payload = verifyRefreshToken(rawToken);
    } catch {
      clearRefreshCookie(res);
      return errors.unauthorized(
        res,
        'Session expired. Please sign in again.',
        'REFRESH_TOKEN_INVALID'
      );
    }

    const hashed = hashToken(rawToken);
    const user = await User.findById(payload.sub).select('+refreshTokens');

    if (!user || !user.refreshTokens?.includes(hashed)) {
      clearRefreshCookie(res);
      return errors.unauthorized(
        res,
        'Session expired. Please sign in again.',
        'REFRESH_TOKEN_INVALID'
      );
    }

    // Rotate: remove old token, issue new pair
    user.refreshTokens = user.refreshTokens.filter((t) => t !== hashed);
    const accessToken = await issueTokenPair(res, user);

    // Frontend checks data.accessToken || data.token — return both per contract §11.1
    return sendSuccess(res, { accessToken, token: accessToken });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /auth/profile
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const rawToken = getRefreshCookie(req);

    if (!rawToken) {
      return res.status(401).json({});
    }

    let payload;
    try {
      payload = verifyRefreshToken(rawToken);
    } catch {
      clearRefreshCookie(res);
      return res.status(401).json({});
    }

    const hashed = hashToken(rawToken);
    const user = await User.findById(payload.sub).select('+refreshTokens');

    if (!user || !user.refreshTokens?.includes(hashed)) {
      clearRefreshCookie(res);
      return res.status(401).json({});
    }

    // Issue fresh access token
    user.refreshTokens = user.refreshTokens.filter((t) => t !== hashed);
    const accessToken = await issueTokenPair(res, user);

    return sendSuccess(res, {
      user: user.toPublic(),
      accessToken,
    });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// PUT /auth/profile
// ─────────────────────────────────────────────────────────────────────────────
router.put(
  '/profile',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, phone } = req.body;

    const { isValid, fields } = runValidation([
      {
        field: 'name',
        checks: [
          () => validate.required(name, 'Name'),
          () => validate.minLength(name, 2, 'Name'),
          () => validate.maxLength(name, 60, 'Name'),
        ],
      },
      {
        field: 'phone',
        checks: [() => validate.phone(phone)],
      },
    ]);

    if (!isValid) {
      return errors.validation(res, 'Validation failed', fields);
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { name, phone: phone || null } },
      { new: true, runValidators: true }
    );

    // Return the user object directly (not wrapped) — per frontend contract
    return sendSuccess(res, updated.toPublic());
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/change-password
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const { isValid, fields } = runValidation([
      {
        field: 'currentPassword',
        checks: [
          () => validate.required(currentPassword, 'Current password'),
          () => validate.minLength(currentPassword, 6, 'Current password'),
        ],
      },
      {
        field: 'newPassword',
        checks: [
          () => validate.required(newPassword, 'New password'),
          () => validate.minLength(newPassword, 6, 'New password'),
          () => validate.maxLength(newPassword, 72, 'New password'),
        ],
      },
    ]);

    if (!isValid) {
      return errors.validation(res, 'Validation failed', fields);
    }

    // Fetch user with password
    const user = await User.findById(req.user._id).select('+password');
    const passwordValid = await user.comparePassword(currentPassword);

    if (!passwordValid) {
      return errors.unauthorized(
        res,
        'Current password is incorrect.',
        'INCORRECT_PASSWORD'
      );
    }

    if (currentPassword === newPassword) {
      return errors.validation(res, 'Validation failed', {
        newPassword: 'New password must differ from current password',
      });
    }

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, {
      success: true,
      message: 'Password updated successfully.',
    });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/forgot-password  [FUTURE CONTRACT — now implemented]
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Always return 200 to prevent email enumeration
    const successResponse = {
      success: true,
      message:
        "If an account with that email exists, we've sent a password reset link.",
    };

    if (!email || !require('validator').isEmail(email)) {
      return sendSuccess(res, successResponse);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendSuccess(res, successResponse);
    }

    // Generate reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');

    await User.findByIdAndUpdate(user._id, {
      $set: {
        passwordResetToken: hashed,
        passwordResetExpires: new Date(Date.now() + RESET_TOKEN_EXPIRES_MS),
      },
    });

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (emailErr) {
      console.error('[forgot-password] Email send failed:', emailErr.message);
      // Clear the token if email fails so user can retry
      await User.findByIdAndUpdate(user._id, {
        $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
      });
      return errors.serverError(res, 'Failed to send reset email. Please try again.');
    }

    return sendSuccess(res, successResponse);
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/reset-password  [FUTURE CONTRACT — now implemented]
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { token, email, newPassword } = req.body;

    const { isValid, fields } = runValidation([
      {
        field: 'token',
        checks: [() => validate.required(token, 'Reset token')],
      },
      {
        field: 'email',
        checks: [
          () => validate.required(email, 'Email'),
          () => validate.email(email),
        ],
      },
      {
        field: 'newPassword',
        checks: [
          () => validate.required(newPassword, 'New password'),
          () => validate.minLength(newPassword, 6, 'New password'),
          () => validate.maxLength(newPassword, 72, 'New password'),
        ],
      },
    ]);

    if (!isValid) {
      return errors.validation(res, 'Validation failed', fields);
    }

    const hashed = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password +passwordResetToken +passwordResetExpires');

    if (!user) {
      return errors.badRequest(
        res,
        'Password reset link is invalid or has expired.',
        'INVALID_RESET_TOKEN'
      );
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Invalidate all refresh tokens on password reset
    await User.findByIdAndUpdate(user._id, {
      $set: { refreshTokens: [] },
    });
    await user.save();

    return sendSuccess(res, {
      success: true,
      message: 'Password reset successfully. Please sign in.',
    });
  })
);

module.exports = router;
