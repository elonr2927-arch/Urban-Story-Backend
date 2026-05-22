'use strict';

const express = require('express');
const Booking = require('../models/Booking');
const { findPropertyById } = require('./properties');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { validate, runValidation } = require('../middleware/validation');
const { errors, sendSuccess } = require('../utils/response');
const { generateBookingReference, validateBookingDate, ALL_SLOTS } = require('../utils/booking');
const { sendBookingConfirmationEmail } = require('../utils/email');

const router = express.Router();

// All booking routes require auth
router.use(requireAuth);

// ─────────────────────────────────────────────────────────────────────────────
// POST /bookings  — create a booking
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { propertyId, date, slot, guestDetails = {} } = req.body;
    const { name, email, phone, message } = guestDetails;

    // ── Field validation ────────────────────────────────────────────────────
    const { isValid, fields } = runValidation([
      {
        field: 'propertyId',
        checks: [() => validate.required(propertyId, 'Property ID')],
      },
      {
        field: 'date',
        checks: [
          () => validate.required(date, 'Date'),
          () => validate.date(date),
        ],
      },
      {
        field: 'slot',
        checks: [() => validate.required(slot, 'Time slot')],
      },
      {
        field: 'guestDetails.name',
        checks: [
          () => validate.required(name, 'Name'),
          () => validate.minLength(name, 2, 'Name'),
          () => validate.maxLength(name, 60, 'Name'),
        ],
      },
      {
        field: 'guestDetails.email',
        checks: [
          () => validate.required(email, 'Email'),
          () => validate.email(email),
        ],
      },
      {
        field: 'guestDetails.phone',
        checks: [
          () => validate.required(phone, 'Phone'),
          () => validate.phone(phone),
        ],
      },
      {
        field: 'guestDetails.message',
        checks: [() => validate.maxLength(message, 500, 'Message')],
      },
    ]);

    if (!isValid) {
      return errors.validation(res, 'Validation failed', fields);
    }

    // ── Business rule validation ────────────────────────────────────────────

    // Validate date
    const dateCheck = validateBookingDate(date);
    if (!dateCheck.valid) {
      return errors.badRequest(res, dateCheck.reason, 'INVALID_BOOKING');
    }

    // Validate slot value
    if (!ALL_SLOTS.includes(slot)) {
      return errors.badRequest(res, 'The selected time slot is invalid.', 'INVALID_BOOKING');
    }

    // Check property exists
    const property = await findPropertyById(propertyId);
    if (!property) {
      return errors.notFound(res, 'Property not found.', 'PROPERTY_NOT_FOUND');
    }

    // ── Atomic slot conflict check (transaction-safe) ───────────────────────
    // Check if this exact slot is already booked (non-cancelled)
    const existingSlot = await Booking.findOne({
      propertyId,
      date,
      slot,
      status: { $ne: 'cancelled' },
    });

    if (existingSlot) {
      return sendSuccess(
        res,
        {
          error: {
            code: 'SLOT_CONFLICT',
            message: 'This time slot is no longer available.',
          },
        },
        409
      );
    }

    // Check for duplicate booking by same user
    const duplicateCheck = await Booking.findOne({
      userId: req.user._id,
      propertyId,
      date,
      slot,
      status: { $ne: 'cancelled' },
    });

    if (duplicateCheck) {
      return sendSuccess(
        res,
        {
          error: {
            code: 'SLOT_CONFLICT',
            message: 'This time slot is no longer available.',
          },
        },
        409
      );
    }

    // ── Generate unique reference ───────────────────────────────────────────
    let reference;
    let attempts = 0;
    do {
      reference = generateBookingReference();
      const exists = await Booking.findOne({ reference });
      if (!exists) break;
      attempts++;
    } while (attempts < 5);

    // ── Build property snapshot (denormalized) ──────────────────────────────
    const propertySnapshot = {
      id: property.slug || property._id.toString(),
      title: property.title,
      address: property.address,
      city: property.city,
      images: (property.images || []).slice(0, 1), // Only first image needed
    };

    // ── Create booking ──────────────────────────────────────────────────────
    let booking;
    try {
      booking = await Booking.create({
        userId: req.user._id,
        propertyId: propertySnapshot.id,
        propertySnapshot,
        date,
        slot,
        reference,
        guestDetails: {
          name,
          email,
          phone,
          message: message || '',
        },
      });
    } catch (err) {
      // Handle race condition — duplicate key on the compound unique index
      if (err.code === 11000) {
        return sendSuccess(
          res,
          {
            error: {
              code: 'SLOT_CONFLICT',
              message: 'This time slot is no longer available.',
            },
          },
          409
        );
      }
      throw err;
    }

    const publicBooking = booking.toPublic();

    // ── Send confirmation email (non-blocking) ──────────────────────────────
    sendBookingConfirmationEmail(email, publicBooking).catch((err) => {
      console.error('[booking] Confirmation email failed:', err.message);
    });

    return sendSuccess(res, { booking: publicBooking }, 201);
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /bookings/me  — all bookings for authenticated user
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Apply real-time status computation
    const publicBookings = bookings.map((b) => {
      const doc = new Booking(b);
      return doc.toPublic();
    });

    return sendSuccess(res, { bookings: publicBookings });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /bookings/:id  — cancel a booking
// ─────────────────────────────────────────────────────────────────────────────
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return errors.notFound(res, 'Booking not found.', 'BOOKING_NOT_FOUND');
    }

    // Authorization check — user can only cancel their own bookings
    if (booking.userId.toString() !== req.user._id.toString()) {
      return errors.forbidden(res, 'You do not have permission to cancel this booking.', 'FORBIDDEN');
    }

    // Cannot cancel if already cancelled or completed
    const currentStatus = booking.computedStatus();
    if (currentStatus === 'cancelled') {
      return sendSuccess(
        res,
        {
          error: {
            code: 'BOOKING_UNMODIFIABLE',
            message: 'This booking cannot be cancelled.',
          },
        },
        409
      );
    }

    if (currentStatus === 'completed') {
      return sendSuccess(
        res,
        {
          error: {
            code: 'BOOKING_UNMODIFIABLE',
            message: 'This booking cannot be cancelled.',
          },
        },
        409
      );
    }

    await Booking.findByIdAndUpdate(booking._id, {
      $set: { status: 'cancelled' },
    });

    return sendSuccess(res, {
      success: true,
      bookingId: booking._id.toString(),
    });
  })
);

module.exports = router;
