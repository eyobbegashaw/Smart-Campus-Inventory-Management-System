
const express = require('express');
const { query } = require('express-validator');
const {
  generateAssetReport,
  generateRequestReport,
  generateInventoryReport,
  getDashboardStats,
  exportToCSV
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const dateRangeValidation = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('department').optional().isMongoId().withMessage('Invalid department ID'),
  query('format').optional().isIn(['pdf', 'excel']).withMessage('Format must be pdf or excel')
];

// All routes require authentication
router.use(protect);

// Dashboard stats (all authenticated users)
router.get('/dashboard-stats', getDashboardStats);

// Asset report
router.get('/assets', authorize('admin', 'hod'), dateRangeValidation, generateAssetReport);

// Request report
router.get('/requests', authorize('admin', 'hod'), dateRangeValidation, generateRequestReport);

// Inventory report (admin only)
router.get('/inventory', authorize('admin'), dateRangeValidation, generateInventoryReport);

// Export to CSV
router.get('/export/:type', authorize('admin'), exportToCSV);

module.exports = router;