
const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  checkoutAsset,
  returnAsset,
  getAssetByQR,
  generateAssetQRCode,
  getAssetStats
} = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules body('assetTag').optional().trim().customSanitizer(value => value ? value.toUpperCase() : value),
const assetValidation = [
  body('assetTag').optional().trim(),
  body('name').notEmpty().withMessage('Asset name is required').trim(),
  body('category').notEmpty().withMessage('Category is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('status').optional().isIn(['available', 'checked-out', 'maintenance', 'retired']),
  body('purchasePrice').optional().isFloat({ min: 0 }).withMessage('Purchase price must be positive'),
  body('serialNumber').optional().trim()
];

const checkoutValidation = [
  body('expectedReturnDate').isISO8601().withMessage('Valid expected return date is required'),
  body('condition').optional().isIn(['Excellent', 'Good', 'Fair', 'Poor']),
  body('checkedOutTo').optional().isMongoId().withMessage('Invalid user ID')
];

const returnValidation = [
  body('returnCondition').optional().isIn(['Excellent', 'Good', 'Fair', 'Poor']),
  body('notes').optional().trim()
];

// All routes require authentication
router.use(protect);

// Stats route (must be before /:id routes)
router.get('/stats', authorize('admin', 'hod'), getAssetStats);

// QR code routes
router.get('/qr/:qrData', getAssetByQR);

// Main CRUD routes
router.route('/')
  .get(getAssets)
  .post(authorize('admin'), assetValidation, createAsset);

router.route('/:id')
  .get(getAsset)
  .put(authorize('admin'), assetValidation, updateAsset)
  .delete(authorize('admin'), deleteAsset);

// Checkout/Return routes
router.post('/:id/checkout', checkoutValidation, checkoutAsset);
router.post('/:id/return', returnValidation, returnAsset);

// QR code generation
router.get('/:id/qr', generateAssetQRCode);

module.exports = router;