'use strict';

const express = require('express');
const Property = require('../models/Property');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /locations/autocomplete
// Returns city/location suggestions for the search bar typeahead
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/autocomplete',
  asyncHandler(async (req, res) => {
    const { q } = req.query;

    // Return empty for missing or short queries
    if (!q || String(q).trim().length < 2) {
      return sendSuccess(res, { suggestions: [] });
    }

    const searchTerm = String(q).trim();
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Aggregate unique cities matching the search term
    // Match on city name or ZIP code
    const results = await Property.aggregate([
      {
        $match: {
          $or: [
            { city: { $regex: escapedTerm, $options: 'i' } },
            { zip: { $regex: `^${escapedTerm}` } },
            { address: { $regex: escapedTerm, $options: 'i' } },
          ],
        },
      },
      // Group by city to deduplicate
      {
        $group: {
          _id: '$city',
          // Get a representative zip code
          zip: { $first: '$zip' },
          // Count how many properties — for sorting by relevance
          count: { $sum: 1 },
          // Check if city starts with the search term (for ranking)
          startsWithTerm: {
            $first: {
              $cond: [
                {
                  $regexMatch: {
                    input: { $toLower: '$city' },
                    regex: `^${escapedTerm.toLowerCase()}`,
                  },
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { startsWithTerm: -1, count: -1 } },
      { $limit: 6 },
      {
        $project: {
          _id: 0,
          label: {
            $concat: ['$_id', ', ', { $substr: ['$zip', 0, 2] }, 'X'] // simplified
          },
          value: '$_id',
          zip: '$zip',
          city: '$_id',
        },
      },
    ]);

    // Post-process to create better labels
    // (Mongo aggregation concat for state code would need a state field; use city + zip as label)
    const suggestions = results.map((r) => ({
      label: r.city,
      value: r.city,
      zip: r.zip,
    }));

    return sendSuccess(res, { suggestions });
  })
);


router.post('/locations/cities', (req, res, next) => {
  
});

module.exports = router;
