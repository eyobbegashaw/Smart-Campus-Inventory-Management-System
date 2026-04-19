
const express = require('express');
const { body } = require('express-validator');
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats,
  getDepartmentAssets,
  getDepartmentRequests,
  updateDepartmentBudget,
  getMyDepartment,
  getPublicDepartments,
  getPublicDepartment
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const departmentValidation = [
  body('name').notEmpty().withMessage('Department name is required').trim(),
  body('code').notEmpty().withMessage('Department code is required').trim(),
  body('hod').optional().isMongoId().withMessage('Invalid HOD ID'),
  body('building').optional().trim(),
  body('floor').optional().trim(),
  body('room').optional().trim(),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('phone').optional().matches(/^[0-9]{9,10}$/).withMessage('Invalid phone number'),
  body('budget.annual').optional().isFloat({ min: 0 }).withMessage('Budget must be positive'),
  body('budget.remaining').optional().isFloat({ min: 0 }).withMessage('Remaining budget must be positive'),
  body('description').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
];

const budgetValidation = [
  body('annualBudget').optional().isFloat({ min: 0 }).withMessage('Annual budget must be positive'),
  body('notes').optional().trim()
];

// ==================== PUBLIC ROUTES (No authentication required) ====================
// IMPORTANT: These must come BEFORE any routes with :id parameter to avoid conflicts
router.get('/public', getPublicDepartments);
router.get('/public/:id', getPublicDepartment);

// ==================== PROTECTED ROUTES (Authentication required) ====================
// Apply authentication middleware for all routes below
router.use(protect);

// Department head specific route
router.get('/my-department', authorize('hod'), getMyDepartment);

// Statistics route (admin only)
router.get('/stats', authorize('admin'), getDepartmentStats);

// Nested resource routes - these have specific paths before generic :id
router.get('/:id/assets', authorize('admin', 'hod'), getDepartmentAssets);
router.get('/:id/requests', authorize('admin', 'hod'), getDepartmentRequests);

// Main CRUD routes - generic :id route should come LAST
router.get('/', getDepartments);
router.get('/:id', getDepartment);
router.post('/', authorize('admin'), departmentValidation, createDepartment);
router.put('/:id', authorize('admin'), departmentValidation, updateDepartment);
router.delete('/:id', authorize('admin'), deleteDepartment);

// Budget update (admin only)
router.put('/:id/budget', authorize('admin'), budgetValidation, updateDepartmentBudget);

module.exports = router;