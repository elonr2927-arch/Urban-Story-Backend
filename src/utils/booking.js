'use strict';

const crypto = require('crypto');

// ── Booking Reference ────────────────────────────────────────────────────────

/**
 * Generate a unique booking reference matching pattern: NQ-YYYY-XXXX
 * Uses a combination of year + random alphanumeric to ensure uniqueness.
 */
function generateBookingReference() {
  const year = new Date().getFullYear();
  // 4-character alphanumeric (uppercase)
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  // Add numeric component from timestamp for additional uniqueness
  const ts = Date.now().toString().slice(-4);
  return `NQ-${year}-${suffix}${ts}`;
}

// ── Slot Definitions ─────────────────────────────────────────────────────────

/** All possible viewing slots in a day (chronological) */
const ALL_SLOTS = [
  '9:00 AM',
  '10:30 AM',
  '12:00 PM',
  '2:00 PM',
  '3:30 PM',
  '5:00 PM',
];

/**
 * Validate a date string is valid, not in the past, and not a Sunday.
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateBookingDate(dateStr) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return { valid: false, reason: 'Date must be in YYYY-MM-DD format.' };
  }

  const today = new Date().toISOString().split('T')[0];
  if (dateStr < today) {
    return { valid: false, reason: 'Viewing date cannot be in the past.' };
  }

  const date = new Date(dateStr + 'T12:00:00Z');
  if (date.getUTCDay() === 0) {
    return { valid: false, reason: 'Viewings are not available on Sundays.' };
  }

  return { valid: true };
}

/**
 * Check if a given date is a Sunday or in the past.
 * Returns true if no slots should be available.
 */
function isSlotlessDay(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  if (dateStr < today) return true;
  const date = new Date(dateStr + 'T12:00:00Z');
  return date.getUTCDay() === 0;
}

module.exports = {
  generateBookingReference,
  ALL_SLOTS,
  validateBookingDate,
  isSlotlessDay,
};
