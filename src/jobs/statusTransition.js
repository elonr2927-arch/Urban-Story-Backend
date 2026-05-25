'use strict';

const Booking = require('../models/Booking');

async function transitionExpiredBookings() {
  const today = new Date().toISOString().split('T')[0];
  try {
    const result = await Booking.updateMany(
      { status: 'upcoming', date: { $lt: today } },
      { $set: { status: 'completed' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[StatusJob] Transitioned ${result.modifiedCount} bookings upcoming → completed`);
    }
  } catch (err) {
    // Log but never throw — a job failure must never crash the server
    console.error('[StatusJob] Failed to transition bookings:', err.message);
  }
}

function startStatusTransitionJob(intervalMs = 60 * 60 * 1000) {
  console.log(`[StatusJob] Starting booking status transition job (every ${intervalMs / 60000} min)`);

  // Explicitly catch so a floating promise never becomes an unhandled rejection
  transitionExpiredBookings().catch((err) => {
    console.error('[StatusJob] Initial run error (non-fatal):', err.message);
  });

  const timer = setInterval(() => {
    transitionExpiredBookings().catch((err) => {
      console.error('[StatusJob] Interval run error (non-fatal):', err.message);
    });
  }, intervalMs);

  if (timer.unref) timer.unref();
  return timer;
}

module.exports = { startStatusTransitionJob, transitionExpiredBookings };
