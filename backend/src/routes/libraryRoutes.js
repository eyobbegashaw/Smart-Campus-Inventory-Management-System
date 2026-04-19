
const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  checkoutBook,
  returnBook,
  getMyBooks,
  getAllCheckouts,
  getLibraryStats
} = require('../controllers/libraryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const bookValidation = [
  body('title').notEmpty().withMessage('Title is required').trim(),
  body('author').notEmpty().withMessage('Author is required').trim(),
  body('isbn').optional().trim(),
  body('category').isIn(['Textbook', 'Reference', 'Fiction', 'Non-Fiction', 'Journal', 'Magazine', 'Other']),
  body('totalCopies').isInt({ min: 1 }).withMessage('Total copies must be at least 1'),
  body('publishYear').optional().isInt({ min: 1000, max: new Date().getFullYear() }),
  body('location').optional().trim()
];

const checkoutValidation = [
  body('bookId').isMongoId().withMessage('Invalid book ID'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date required')
];

const returnValidation = [
  body('condition').optional().isIn(['Excellent', 'Good', 'Fair', 'Poor']),
  body('notes').optional().trim()
];

// All routes require authentication
router.use(protect);

// Stats route (admin only)
router.get('/stats', authorize('admin'), getLibraryStats);

// My books route (must be before /books routes)
router.get('/my-books', getMyBooks);

// Checkouts (admin only)
router.get('/checkouts', authorize('admin'), getAllCheckouts);

// Book checkout/return
router.post('/checkout', checkoutValidation, checkoutBook);
router.post('/return/:checkoutId', returnValidation, returnBook);

// Book CRUD routes
router.route('/books')
  .get(getBooks)
  .post(authorize('admin'), bookValidation, createBook);

router.route('/books/:id')
  .get(getBook)
  .put(authorize('admin'), bookValidation, updateBook)
  .delete(authorize('admin'), deleteBook);

module.exports = router;