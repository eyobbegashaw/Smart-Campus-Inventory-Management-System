const crypto = require('crypto');
const moment = require('moment');

/**
 * Generate random token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate random OTP
 */
const generateOTP = (length = 6) => {
  return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
};

/**
 * Format currency
 */
const formatCurrency = (amount, currency = 'ETB') => {
  return `${currency} ${amount.toLocaleString()}`;
};

/**
 * Format date
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
  return moment(date).format(format);
};

/**
 * Calculate days between two dates
 */
const daysBetween = (date1, date2) => {
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calculate asset depreciation (straight line method)
 */
const calculateDepreciation = (purchasePrice, purchaseDate, usefulLifeYears = 5) => {
  const yearsOwned = daysBetween(purchaseDate, new Date()) / 365;
  const annualDepreciation = purchasePrice / usefulLifeYears;
  const totalDepreciation = annualDepreciation * yearsOwned;
  return Math.max(0, purchasePrice - totalDepreciation);
};

/**
 * Generate unique ID
 */
const generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`.toUpperCase();
};

/**
 * Slugify string
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

/**
 * Truncate text
 */
const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Parse boolean from string
 */
const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }
  return Boolean(value);
};

/**
 * Group array by key
 */
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

/**
 * Calculate percentage
 */
const calculatePercentage = (part, total) => {
  if (total === 0) return 0;
  return (part / total) * 100;
};

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Remove null/undefined values from object
 */
const cleanObject = (obj) => {
  const newObj = {};
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
      newObj[key] = obj[key];
    }
  }
  return newObj;
};

/**
 * Get file extension
 */
const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Validate Ethiopian phone number
 */
const isValidEthiopianPhone = (phone) => {
  const phoneRegex = /^(09|07)[0-9]{8}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate email
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Format bytes to human readable
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Sleep/delay function
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry async function
 */
const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

module.exports = {
  generateToken,
  generateOTP,
  formatCurrency,
  formatDate,
  daysBetween,
  calculateDepreciation,
  generateUniqueId,
  slugify,
  truncateText,
  parseBoolean,
  groupBy,
  calculatePercentage,
  deepClone,
  isEmpty,
  cleanObject,
  getFileExtension,
  isValidEthiopianPhone,
  isValidEmail,
  formatBytes,
  sleep,
  retry
};
