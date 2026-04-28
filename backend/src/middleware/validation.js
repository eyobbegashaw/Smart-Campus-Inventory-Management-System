const { validationResult } = require('express-validator');

/**
 * Check for validation errors from express-validator
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  let { page, limit } = req.query;
  
  page = parseInt(page);
  limit = parseInt(limit);
  
  if (isNaN(page) || page < 1) {
    req.query.page = 1;
  } else {
    req.query.page = page;
  }
  
  if (isNaN(limit) || limit < 1 || limit > 100) {
    req.query.limit = 10;
  } else {
    req.query.limit = limit;
  }
  
  next();
};

/**
 * Validate file upload
 */
const validateFileUpload = (req, res, next) => {
  if (!req.files && !req.file) {
    return next();
  }
  
  const files = req.files || [req.file];
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5242880; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  
  for (const file of (Array.isArray(files) ? files : [files])) {
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File ${file.originalname} is too large. Max size: ${maxSize / 1024 / 1024}MB`
      });
    }
    
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `File ${file.originalname} has invalid type. Allowed: ${allowedTypes.join(', ')}`
      });
    }
  }
  
  next();
};

/**
 * Sanitize HTML content (prevent XSS)
 */
const sanitizeHtml = (str) => {
  if (!str) return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Middleware to sanitize request body
 */
const sanitizeRequestBody = (req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key]);
      }
    }
  }
  next();
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Validate Ethiopian phone number
 */
const isValidEthiopianPhone = (phone) => {
  const phoneRegex = /^(09|07)[0-9]{8}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate asset tag format
 */
const isValidAssetTag = (tag) => {
  const tagRegex = /^[A-Z]{2,4}-\d{4,6}$/;
  return tagRegex.test(tag);
};

module.exports = {
  validateRequest,
  validatePagination,
  validateFileUpload,
  sanitizeRequestBody,
  isValidEmail,
  isValidEthiopianPhone,
  isValidAssetTag,
  sanitizeHtml
};
