'use strict';

const express = require('express');
const Property = require('../models/Property');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');

const router = express.Router();

router.get(
  '/autocomplete',
  asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q || String(q).trim().length < 2) {
      return sendSuccess(res, { suggestions: [] });
    }

    const searchTerm = String(q).trim();
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
      {
        $group: {
          _id: '$city',
          zip: { $first: '$zip' },
          count: { $sum: 1 },
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
            $concat: ['$_id', ', ', { $substr: ['$zip', 0, 2] }, 'X']
          },
          value: '$_id',
          zip: '$zip',
          city: '$_id',
        },
      },
    ]);

    const suggestions = results.map((r) => ({
      label: r.city,
      value: r.city,
      zip: r.zip,
    }));

    return sendSuccess(res, { suggestions });
  })
);

router.get('/cities', (req, res, next) => {
  return res.status(201).json({
    status: 'success',
    cities: [
      {
        name: 'New York',
        image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80',
        count: 847,
      },
      {
        name: 'Los Angeles',
        image: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=600&q=80',
        count: 612,
      },
      {
        name: 'Chicago',
        image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80',
        count: 389,
      },
      {
        name: 'Miami',
        image: 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=600&q=80',
        count: 478,
      },
      {
        name: 'Austin',
        image: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=600&q=80',
        count: 234,
      },
      {
        name: 'Atlanta',
        image: 'https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=600&q=80',
        count: 198,
      },
      {
        name: 'Washington DC',
        image: 'https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=600&q=80',
        count: 156,
      }
    ]
  });
});

module.exports = router;