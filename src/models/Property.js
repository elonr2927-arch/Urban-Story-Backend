'use strict';

const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    avatar: { type: String, default: null },
  },
  { _id: false }
);

const propertySchema = new mongoose.Schema(
  {
    // Slug-style string ID (e.g. "prop-001") — separate from Mongo _id
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: ['Apartment', 'House', 'Studio', 'Condo'],
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    zip: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    beds: {
      type: Number,
      required: true,
      min: 0,
    },

    baths: {
      type: Number,
      required: true,
      min: 0,
    },

    area: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      required: true,
    },

    images: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 1,
        message: 'At least one image is required',
      },
    },

    videoUrl: {
      type: String,
      default: null,
    },

    amenities: {
      type: [String],
      default: [],
    },

    available: {
      type: Boolean,
      default: true,
    },

    availableFrom: {
      type: String, // Stored as YYYY-MM-DD
      required: true,
    },

    rating: {
      type: Number,
      default: null,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    isNewListing: {
      type: Boolean,
      default: false,
    },

    agent: {
      type: agentSchema,
      required: true,
    },

    lat: {
      type: Number,
      required: true,
    },

    lng: {
      type: Number,
      required: true,
    },

    neighbourhood: {
      type: String,
      default: null,
    },

    // Internal
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
propertySchema.index({ city: 'text', address: 'text', title: 'text' });
propertySchema.index({ city: 1 });
propertySchema.index({ type: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ featured: 1 });
propertySchema.index({ isNewListing: -1, createdAt: -1 });
propertySchema.index({ reviewCount: -1 });
propertySchema.index({ zip: 1 });
propertySchema.index({ availableFrom: 1 });
propertySchema.index({ amenities: 1 });
// Note: slug unique index is declared on the field itself (sparse: true, unique: true)

// ── Virtual: expose _id as `id` (string) ─────────────────────────────────────
propertySchema.virtual('id').get(function () {
  // Return slug if set, otherwise Mongo _id string
  return this.slug || this._id.toString();
});

/**
 * Build the public property response object.
 * Ensures `id` comes from the slug when present.
 */
propertySchema.methods.toPublic = function () {
  const obj = this.toObject({ virtuals: true });
  // Ensure arrays are never null
  obj.images = obj.images || [];
  obj.amenities = obj.amenities || [];
  return obj;
};

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
