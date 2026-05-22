'use strict';

// ── Success responses ─────────────────────────────────────────────────────────

/**
 * Send a success response.
 * @param {object} res - Express response
 * @param {object} data - Payload to merge into response body
 * @param {number} [status=200]
 */
function sendSuccess(res, data, status = 200) {
  return res.status(status).json(data);
}

// ── Error responses ───────────────────────────────────────────────────────────

/**
 * Send a standardised error response matching the contract:
 * { error: { code, message, fields? } }
 */
function sendError(res, status, code, message, fields = undefined) {
  const body = { error: { code, message } };
  if (fields && Object.keys(fields).length > 0) {
    body.error.fields = fields;
  }
  return res.status(status).json(body);
}

// ── Shorthand error senders ───────────────────────────────────────────────────

const errors = {
  badRequest: (res, message = 'Bad request.', code = 'BAD_REQUEST') =>
    sendError(res, 400, code, message),

  unauthorized: (res, message = 'Authentication required.', code = 'UNAUTHORIZED') =>
    sendError(res, 401, code, message),

  forbidden: (res, message = 'You do not have permission.', code = 'FORBIDDEN') =>
    sendError(res, 403, code, message),

  notFound: (res, message = 'Resource not found.', code = 'NOT_FOUND') =>
    sendError(res, 404, code, message),

  conflict: (res, message = 'Conflict.', code = 'CONFLICT') =>
    sendError(res, 409, code, message),

  validation: (res, message = 'Validation failed', fields = {}) =>
    sendError(res, 422, 'VALIDATION_ERROR', message, fields),

  rateLimit: (res, retryAfter = 900) =>
    sendError(res, 429, 'RATE_LIMIT_EXCEEDED', `Too many requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`),

  serverError: (res, message = 'Something went wrong. Please try again.') =>
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', message),
};

module.exports = { sendSuccess, sendError, errors };
