'use strict';

const mongoose = require('mongoose');

const guestDetailsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String, default: '' },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    propertyId: {
      type: String, // Slug-based ID
      required: true,
    },

    // Denormalized property snapshot (for fast booking list rendering)
    propertySnapshot: {
      id: String,
      title: String,
      address: String,
      city: String,
      images: [String],
    },

    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },

    slot: {
      type: String, // e.g. "10:30 AM"
      required: true,
    },

    status: {
      type: String,
      enum: ['upcoming', 'completed', 'cancelled'],
      default: 'upcoming',
    },

    reference: {
      type: String,
      unique: true,
    },

    guestDetails: {
      type: guestDetailsSchema,
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ propertyId: 1, date: 1, slot: 1 });
// Note: reference unique index is declared on the field itself
bookingSchema.index({ date: 1, status: 1 }); // For status transition job

// ── Compound unique: prevent duplicate bookings (same user, property, date, slot) ──
bookingSchema.index(
  { userId: 1, propertyId: 1, date: 1, slot: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } }
);

// ── Virtual: expose _id as `id` ───────────────────────────────────────────────
bookingSchema.virtual('id').get(function () {
  return this._id.toString();
});

/**
 * Computed status: auto-transition upcoming → completed when date has passed.
 * The backend job (jobs/statusTransition.js) also handles this in bulk,
 * but this virtual provides real-time accuracy for individual document reads.
 */
bookingSchema.methods.computedStatus = function () {
  if (this.status === 'cancelled') return 'cancelled';
  const today = new Date().toISOString().split('T')[0];
  if (this.date < today) return 'completed';
  return 'upcoming';
};

/** Public booking representation matching frontend contract */
bookingSchema.methods.toPublic = function () {
  const status = this.computedStatus();
  return {
    id: this._id.toString(),
    propertyId: this.propertyId,
    property: this.propertySnapshot,
    date: this.date,
    slot: this.slot,
    status,
    reference: this.reference,
    guestDetails: this.guestDetails,
    createdAt: this.createdAt,
  };
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
