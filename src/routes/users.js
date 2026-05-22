'use strict';

const express = require('express');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { errors, sendSuccess } = require('../utils/response');

const router = express.Router();

// All users routes require auth
router.use(requireAuth);

// ─────────────────────────────────────────────────────────────────────────────
// POST /users/me/saved/:propertyId  [FUTURE CONTRACT — now implemented]
// Save a property to the user's saved list
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/me/saved/:propertyId',
  asyncHandler(async (req, res) => {
    const { propertyId } = req.params;

    if (!propertyId) {
      return errors.badRequest(res, 'Property ID is required.', 'INVALID_PROPERTY_ID');
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { savedProperties: propertyId } }, // addToSet prevents duplicates
      { new: true }
    );

    return sendSuccess(res, {
      success: true,
      savedProperties: user.savedProperties,
    });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /users/me/saved/:propertyId  [FUTURE CONTRACT — now implemented]
// Remove a property from the user's saved list
// ─────────────────────────────────────────────────────────────────────────────
router.delete(
  '/me/saved/:propertyId',
  asyncHandler(async (req, res) => {
    const { propertyId } = req.params;

    if (!propertyId) {
      return errors.badRequest(res, 'Property ID is required.', 'INVALID_PROPERTY_ID');
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { savedProperties: propertyId } },
      { new: true }
    );

    return sendSuccess(res, {
      success: true,
      savedProperties: user.savedProperties,
    });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /users/me/saved  — Get user's saved properties list
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/me/saved',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    return sendSuccess(res, {
      savedProperties: user.savedProperties || [],
    });
  })
);

module.exports = router;
