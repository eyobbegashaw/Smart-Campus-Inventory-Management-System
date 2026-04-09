const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getLowStockItems,
  createRequisition,
  getRequisitions,
  updateRequisitionStatus,
  getInventoryStats
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const inventoryValidation = [
  body('name').notEmpty().withMessage('Item name is required').trim(),
  body('category').isIn(['Stationery', 'Cleaning', 'Lab Supplies', 'Cafe Supplies', 'Maintenance', 'IT Supplies', 'Other']),
  body('sku').optional().trim(),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('unit').notEmpty().withMessage('Unit is required'),
  body('minimumQuantity').isInt({ min: 0 }).withMessage('Minimum quantity must be positive'),
  body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be positive')
];

const requisitionValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.inventoryItemId').notEmpty().withMessage('Item ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('purpose').notEmpty().withMessage('Purpose is required').trim()
];

const requisitionStatusValidation = [
  body('status').isIn(['hod-approved', 'finance-approved', 'purchased', 'delivered', 'rejected']),
  body('comments').optional().trim()
];

// All routes require authentication
router.use(protect);

// Stats route
router.get('/stats', authorize('admin'), getInventoryStats);

// Low stock route
router.get('/low-stock', authorize('admin', 'hod'), getLowStockItems);

// Requisition routes
router.get('/requisitions', getRequisitions);
router.post('/requisitions', requisitionValidation, createRequisition);
router.put('/requisitions/:id/status', authorize('hod', 'admin'), requisitionStatusValidation, updateRequisitionStatus);

// Main CRUD routes
router.route('/')
  .get(getInventoryItems)
  .post(authorize('admin'), inventoryValidation, createInventoryItem);

router.route('/:id')
  .get(getInventoryItem)
  .put(authorize('admin'), inventoryValidation, updateInventoryItem)
  .delete(authorize('admin'), deleteInventoryItem);

module.exports = router;