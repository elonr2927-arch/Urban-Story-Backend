'use strict';

const express = require('express');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const { asyncHandler } = require('../middleware/errorHandler');
const { errors, sendSuccess } = require('../utils/response');
const { ALL_SLOTS, isSlotlessDay } = require('../utils/booking');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: /featured and /cities MUST be registered BEFORE /:id
// to prevent those strings being treated as ID params.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// GET /properties/featured
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/featured',
  asyncHandler(async (req, res) => {
    const properties = await Property.find({ featured: true })
      .sort({ isNewListing: -1, createdAt: -1 })
      .limit(9)
      .lean();

    return sendSuccess(res, {
      properties: properties.map(serializeProperty),
    });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /properties/cities  [FUTURE CONTRACT — now implemented]
// Returns city counts for city spotlight section
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/cities',
  asyncHandler(async (_req, res) => {
    const results = await Property.aggregate([
      { $match: { available: true } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, city: '$_id', count: 1 } },
    ]);

    return sendSuccess(res, { cities: results });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /properties  (search + filter + paginate)
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      city,
      zip,
      type,
      minPrice,
      maxPrice,
      beds,
      baths,
      amenities,
      availableFrom,
      sort = 'newest',
      page = '1',
      limit = '9',
    } = req.query;

    const filter = {};

    // City — case-insensitive substring match
    if (city && city.trim()) {
      filter.$or = [
        { city: { $regex: city.trim(), $options: 'i' } },
        { address: { $regex: city.trim(), $options: 'i' } },
      ];
    }

    // ZIP — prefix match
    if (zip && zip.trim()) {
      filter.zip = { $regex: `^${zip.trim()}` };
    }

    // Type — exact match
    if (type && ['Apartment', 'House', 'Studio', 'Condo'].includes(type)) {
      filter.type = type;
    }

    // Price range
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!isNaN(min) && min > 0) {
      filter.price = { ...filter.price, $gte: min };
    }
    if (!isNaN(max) && max < 20000) {
      filter.price = { ...filter.price, $lte: max };
    }

    // Beds
    if (beds) {
      const bedsNum = parseInt(beds, 10);
      if (!isNaN(bedsNum)) {
        filter.beds = bedsNum >= 4 ? { $gte: 4 } : bedsNum;
      }
    }

    // Baths
    if (baths) {
      const bathsNum = parseInt(baths, 10);
      if (!isNaN(bathsNum)) {
        filter.baths = bathsNum >= 3 ? { $gte: 3 } : bathsNum;
      }
    }

    // Amenities — AND logic (all must be present)
    if (amenities && amenities.trim()) {
      const amenityList = amenities
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);
      if (amenityList.length > 0) {
        filter.amenities = { $all: amenityList };
      }
    }

    // availableFrom — properties available on or before this date
    if (availableFrom && /^\d{4}-\d{2}-\d{2}$/.test(availableFrom)) {
      filter.availableFrom = { $lte: availableFrom };
    }

    // ── Sort ────────────────────────────────────────────────────────────────
    let sortObj = {};
    switch (sort) {
      case 'price_asc':
        sortObj = { price: 1 };
        break;
      case 'price_desc':
        sortObj = { price: -1 };
        break;
      case 'popular':
        sortObj = { reviewCount: -1 };
        break;
      case 'newest':
      default:
        sortObj = { isNewListing: -1, createdAt: -1 };
        break;
    }

    // ── Pagination ──────────────────────────────────────────────────────────
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 9));
    const skip = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      Property.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Property.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      properties: properties.map(serializeProperty),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /properties/:id/related  [FUTURE CONTRACT — now implemented]
// Returns related properties (same city or type, excluding self)
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/:id/related',
  asyncHandler(async (req, res) => {
    const property = await findPropertyById(req.params.id);
    if (!property) {
      return errors.notFound(res, 'Property not found.', 'PROPERTY_NOT_FOUND');
    }

    const related = await Property.find({
      _id: { $ne: property._id },
      $or: [{ city: property.city }, { type: property.type }],
    })
      .sort({ featured: -1, reviewCount: -1 })
      .limit(6)
      .lean();

    return sendSuccess(res, {
      properties: related.map(serializeProperty),
    });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /properties/:id/slots
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/:id/slots',
  asyncHandler(async (req, res) => {
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return errors.badRequest(
        res,
        'date query parameter is required in YYYY-MM-DD format.',
        'INVALID_DATE'
      );
    }

    // Check property exists
    const property = await findPropertyById(req.params.id);
    if (!property) {
      return errors.notFound(res, 'Property not found.', 'PROPERTY_NOT_FOUND');
    }

    // No slots on Sundays or past dates
    if (isSlotlessDay(date)) {
      return sendSuccess(res, { slots: [] });
    }

    // Fetch already-booked slots for this property+date
    const bookedSlots = await Booking.find({
      propertyId: req.params.id,
      date,
      status: { $ne: 'cancelled' },
    }).select('slot');

    const bookedSet = new Set(bookedSlots.map((b) => b.slot));
    const availableSlots = ALL_SLOTS.filter((s) => !bookedSet.has(s));

    return sendSuccess(res, { slots: availableSlots });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /properties/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const property = await findPropertyById(req.params.id);

    if (!property) {
      return errors.notFound(res, 'Property not found.', 'PROPERTY_NOT_FOUND');
    }

    return sendSuccess(res, { property: serializeProperty(property) });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find a property by slug (e.g. "prop-001") or MongoDB _id.
 */
async function findPropertyById(idParam) {
  // Try slug first
  let doc = await Property.findOne({ slug: idParam }).lean();
  if (!doc) {
    // Try Mongo _id (only if it looks like a valid ObjectId)
    if (/^[a-f\d]{24}$/i.test(idParam)) {
      doc = await Property.findById(idParam).lean();
    }
  }
  return doc || null;
}

/**
 * Transform a raw Mongo document to the frontend-expected shape.
 * Ensures arrays are never null, id is the slug when available.
 */
function serializeProperty(doc) {
  return {
    id: doc.slug || doc._id.toString(),
    title: doc.title,
    type: doc.type,
    city: doc.city,
    zip: doc.zip,
    address: doc.address,
    price: doc.price,
    beds: doc.beds,
    baths: doc.baths,
    area: doc.area,
    description: doc.description,
    images: doc.images || [],
    videoUrl: doc.videoUrl || null,
    amenities: doc.amenities || [],
    available: doc.available,
    availableFrom: doc.availableFrom,
    rating: doc.rating ?? null,
    reviewCount: doc.reviewCount || 0,
    featured: doc.featured,
    isNew: doc.isNewListing,
    agent: {
      name: doc.agent?.name || '',
      phone: doc.agent?.phone || '',
      email: doc.agent?.email || '',
      avatar: doc.agent?.avatar || null,
    },
    lat: doc.lat,
    lng: doc.lng,
    neighbourhood: doc.neighbourhood || null,
  };
}

module.exports = router;
module.exports.serializeProperty = serializeProperty;
module.exports.findPropertyById = findPropertyById;
