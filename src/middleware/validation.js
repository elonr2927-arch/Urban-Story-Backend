'use strict';

const validator = require('validator');

/**
 * Collection of reusable field validators.
 * Each returns { valid: boolean, message?: string }
 */
const validate = {
  required: (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
      return { valid: false, message: `${fieldName} is required` };
    }
    return { valid: true };
  },

  email: (value) => {
    if (!validator.isEmail(String(value || ''))) {
      return { valid: false, message: 'Please enter a valid email address' };
    }
    return { valid: true };
  },

  minLength: (value, min, fieldName) => {
    if (!value || String(value).length < min) {
      return { valid: false, message: `${fieldName} must be at least ${min} characters` };
    }
    return { valid: true };
  },

  maxLength: (value, max, fieldName) => {
    if (value && String(value).length > max) {
      return { valid: false, message: `${fieldName} must be at most ${max} characters` };
    }
    return { valid: true };
  },

  phone: (value) => {
    if (value === null || value === undefined || value === '') return { valid: true };
    if (!/^\+?[\d\s\-()+]{7,20}$/.test(String(value))) {
      return { valid: false, message: 'Invalid phone number format' };
    }
    return { valid: true };
  },

  date: (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return { valid: false, message: 'Date must be in YYYY-MM-DD format' };
    }
    return { valid: true };
  },
};

/**
 * Run multiple validators and collect field errors.
 * @param {Array<{ field, checks: Array<()=>{valid,message}> }>} schema
 * @returns {{ isValid: boolean, fields: Record<string,string> }}
 */
function runValidation(schema) {
  const fields = {};

  for (const { field, checks } of schema) {
    for (const check of checks) {
      const result = check();
      if (!result.valid) {
        fields[field] = result.message;
        break; // First error per field only
      }
    }
  }

  return {
    isValid: Object.keys(fields).length === 0,
    fields,
  };
}

module.exports = { validate, runValidation };
