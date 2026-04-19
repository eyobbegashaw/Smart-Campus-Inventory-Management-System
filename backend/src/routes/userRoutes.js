
const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateProfile,
  getUserStats
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const userValidation = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'hod', 'staff', 'student']).withMessage('Invalid role'),
  body('department').optional().isMongoId().withMessage('Invalid department ID'),
  body('phone').optional().matches(/^[0-9]{9,10}$/).withMessage('Invalid phone number'),
  body('employeeId').optional().trim(),
  body('studentId').optional().trim()
];

const updateProfileValidation = [
  body('name').optional().trim(),
  body('phone').optional().matches(/^[0-9]{9,10}$/).withMessage('Invalid phone number'),
  body('avatar').optional().isURL().withMessage('Invalid avatar URL'),
  body('preferences').optional().isObject()
];

// All routes require authentication
router.use(protect);

// Stats route (admin only)
router.get('/stats', authorize('admin'), getUserStats);

// Profile routes
router.get('/profile', (req, res) => {
  res.redirect('/api/auth/me');
});
router.put('/profile', updateProfileValidation, updateProfile);

// Main CRUD routes (admin only)
router.route('/')
  .get(authorize('admin'), getUsers)
  .post(authorize('admin'), userValidation, createUser);

router.route('/:id')
  .get(authorize('admin'), getUser)
  .put(authorize('admin'), userValidation, updateUser)
  .delete(authorize('admin'), deleteUser);

module.exports = router;