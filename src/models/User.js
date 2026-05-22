'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const BCRYPT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => validator.isEmail(v),
        message: 'Please enter a valid email address',
      },
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      maxlength: [72, 'Password must be at most 72 characters'],
      select: false, // Never return password by default
    },

    phone: {
      type: String,
      default: null,
      validate: {
        validator: (v) => v === null || /^\+?[\d\s\-()+]{7,20}$/.test(v),
        message: 'Invalid phone number format',
      },
    },

    savedProperties: {
      type: [String],
      default: [],
    },

    // Password reset
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },

    // Refresh token store (array for multi-device support)
    refreshTokens: {
      type: [String],
      select: false,
      default: [],
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Note: email unique index is declared on the field itself (unique: true), no need to repeat here
userSchema.index({ passwordResetToken: 1 }, { sparse: true });

// ── Pre-save: hash password ───────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  next();
});

// ── Methods ───────────────────────────────────────────────────────────────────

/** Compare plain-text password against stored hash */
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

/** Return safe public representation (no password, no tokens) */
userSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    phone: this.phone,
    savedProperties: this.savedProperties,
    joinedAt: this.joinedAt,
  };
};

// ── Static helpers ────────────────────────────────────────────────────────────

/** Find by email, selecting password field explicitly */
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select(
    '+password +refreshTokens'
  );
};

const User = mongoose.model('User', userSchema);

module.exports = User;
