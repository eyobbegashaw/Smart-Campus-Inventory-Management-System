const express = require('express');
const { body, param } = require('express-validator');
const {
  getRequests,
  getRequest,
  createRequest,
  updateRequestStatus,
  addComment,
  getRequestStats,
  assignRequest,
  uploadPhotos
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const requestValidation = [
  body('title').notEmpty().withMessage('Title is required').trim().isLength({ min: 5, max: 200 }),
  body('description').notEmpty().withMessage('Description is required').trim(),
  body('category').isIn(['Maintenance', 'IT Support', 'Cleaning', 'Furniture', 'Electrical', 'Plumbing', 'HVAC', 'Security', 'Other']),
  body('location').notEmpty().withMessage('Location is required').trim(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('building').optional().trim(),
  body('room').optional().trim()
];

const statusValidation = [
  body('status').isIn(['reviewing', 'approved', 'in-progress', 'completed', 'rejected', 'cancelled']),
  body('assignedTo').optional().isMongoId().withMessage('Invalid staff ID'),
  body('notes').optional().trim()
];

const commentValidation = [
  body('text').notEmpty().withMessage('Comment text is required').trim().isLength({ max: 1000 })
];

const assignValidation = [
  body('staffId').isMongoId().withMessage('Invalid staff ID')
];

// All routes require authentication
router.use(protect);

// Stats route (must be before /:id routes)
router.get('/stats', authorize('admin', 'hod'), getRequestStats);

// Main CRUD routes
router.route('/')
  .get(getRequests)
  .post(uploadPhotos, requestValidation, createRequest);

router.route('/:id')
  .get(getRequest);

// Status update
router.put('/:id/status', authorize('admin', 'staff'), statusValidation, updateRequestStatus);

// Comments
router.post('/:id/comments', commentValidation, addComment);

// Assignment (HOD or Admin only)
router.put('/:id/assign', authorize('admin', 'hod'), assignValidation, assignRequest);

module.exports = router;
