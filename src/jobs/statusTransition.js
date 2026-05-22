'use strict';

const Booking = require('../models/Booking');

/**
 * Background job: transition "upcoming" bookings to "completed"
 * when their viewing date has passed.
 *
 * This runs on a schedule and handles bulk transitions so that
 * GET /bookings/me always returns accurate statuses even without
 * the real-time virtual method on every read.
 *
 * Schedule recommendation: run every hour via setInterval or a cron job.
 */
async function transitionExpiredBookings() {
  const today = new Date().toISOString().split('T')[0];

  try {
    const result = await Booking.updateMany(
      {
        status: 'upcoming',
        date: { $lt: today }, // date is before today
      },
      {
        $set: { status: 'completed' },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `[StatusJob] Transitioned ${result.modifiedCount} bookings from upcoming → completed`
      );
    }
  } catch (err) {
    console.error('[StatusJob] Failed to transition bookings:', err.message);
  }
}

/**
 * Start the background job on a configurable interval.
 * @param {number} intervalMs - How often to run (default: 1 hour)
 */
function startStatusTransitionJob(intervalMs = 60 * 60 * 1000) {
  console.log(
    `[StatusJob] Starting booking status transition job (every ${intervalMs / 60000} min)`
  );

  // Run immediately on start
  transitionExpiredBookings();

  // Then on interval
  const timer = setInterval(transitionExpiredBookings, intervalMs);

  // Ensure the timer doesn't prevent process exit
  if (timer.unref) timer.unref();

  return timer;
}

module.exports = { startStatusTransitionJob, transitionExpiredBookings };
