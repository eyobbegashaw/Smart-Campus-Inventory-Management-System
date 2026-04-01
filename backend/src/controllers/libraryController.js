const Book = require('../models/Book');
const BookCheckout = require('../models/BookCheckout');
const User = require('../models/User');
const Department = require('../models/Department');
const mongoose = require('mongoose');



// @desc    Get all books
// @route   GET /api/library/books
// @access  Private
exports.getBooks = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category,
      department,
      search,
      availableOnly,
      sortBy = 'title',
      sortOrder = 'asc'
    } = req.query;
    
    const query = {};
    
    if (category) query.category = category;
    if (department) query.department = department;
    if (availableOnly === 'true') query.availableCopies = { $gt: 0 };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { titleAm: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const books = await Book.find(query)
      .populate('department', 'name nameAm')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort(sortOptions);
    
    const total = await Book.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: books,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single book
// @route   GET /api/library/books/:id
// @access  Private
exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('department', 'name nameAm code');
    
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    // Get checkout history
    const checkoutHistory = await BookCheckout.find({ bookId: book._id })
      .populate('userId', 'name email studentId')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.status(200).json({
      success: true,
      data: book,
      checkoutHistory
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create book
// @route   POST /api/library/books
// @access  Private/Admin
exports.createBook = async (req, res) => {
  try {
    const bookData = req.body;
    
    // Set available copies equal to total copies
    bookData.availableCopies = bookData.totalCopies;
    
    const book = await Book.create(bookData);
    
    res.status(201).json({ success: true, data: book });
  } catch (error) {
    console.error('Create book error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Book with this ISBN already exists' 
      });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update book
// @route   PUT /api/library/books/:id
// @access  Private/Admin
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({ success: true, data: updatedBook });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete book
// @route   DELETE /api/library/books/:id
// @access  Private/Admin
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    // Check if book has active checkouts
    const activeCheckouts = await BookCheckout.findOne({
      bookId: book._id,
      status: 'checked-out'
    });
    
    if (activeCheckouts) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete book with active checkouts' 
      });
    }
    
    await book.deleteOne();
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Checkout book
// @route   POST /api/library/checkout
// @access  Private
exports.checkoutBook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { bookId, dueDate } = req.body;
    
    const book = await Book.findById(bookId).session(session);
    
    if (!book) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    
    if (book.availableCopies <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'No copies available' });
    }
    
    // Check if user already has this book checked out
    const existingCheckout = await BookCheckout.findOne({
      bookId,
      userId: req.user.id,
      status: 'checked-out'
    }).session(session);
    
    if (existingCheckout) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: 'You already have this book checked out' 
      });
    }
    
    const checkout = await BookCheckout.create([{
      bookId,
      userId: req.user.id,
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
      status: 'checked-out'
    }], { session });
    
    book.availableCopies -= 1;
    await book.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    await checkout[0].populate([
      { path: 'bookId', select: 'title author isbn' },
      { path: 'userId', select: 'name email studentId' }
    ]);
    
    res.status(200).json({ success: true, data: checkout[0] });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Checkout book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Return book
// @route   POST /api/library/return/:checkoutId
// @access  Private
exports.returnBook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const checkout = await BookCheckout.findById(req.params.checkoutId).session(session);
    
    if (!checkout) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Checkout record not found' });
    }
    
    if (checkout.status === 'returned') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Book already returned' });
    }
    
    const book = await Book.findById(checkout.bookId).session(session);
    
    checkout.returnDate = new Date();
    checkout.status = 'returned';
    
    // Calculate fine if overdue
    if (new Date() > new Date(checkout.dueDate)) {
      const daysOverdue = Math.ceil((new Date() - new Date(checkout.dueDate)) / (1000 * 60 * 60 * 24));
      checkout.fine = daysOverdue * 5; // 5 Birr per day
    }
    
    await checkout.save({ session });
    
    book.availableCopies += 1;
    await book.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({ 
      success: true, 
      data: checkout,
      fine: checkout.fine || 0
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Return book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user's checked out books
// @route   GET /api/library/my-books
// @access  Private
exports.getMyBooks = async (req, res) => {
  try {
    const checkouts = await BookCheckout.find({
      userId: req.user.id,
      status: 'checked-out'
    })
      .populate('bookId', 'title titleAm author isbn')
      .sort({ dueDate: 1 });
    
    // Calculate overdue status
    const booksWithStatus = checkouts.map(checkout => ({
      ...checkout.toObject(),
      isOverdue: new Date() > new Date(checkout.dueDate),
      daysRemaining: Math.ceil((new Date(checkout.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
    }));
    
    res.status(200).json({ success: true, data: booksWithStatus });
  } catch (error) {
    console.error('Get my books error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all checkouts (admin)
// @route   GET /api/library/checkouts
// @access  Private/Admin
exports.getAllCheckouts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    const checkouts = await BookCheckout.find(query)
      .populate('bookId', 'title author isbn')
      .populate('userId', 'name email studentId')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await BookCheckout.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: checkouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all checkouts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get library statistics
// @route   GET /api/library/stats
// @access  Private/Admin
exports.getLibraryStats = async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const availableBooks = await Book.aggregate([
      { $group: { _id: null, total: { $sum: '$availableCopies' } } }
    ]);
    
    const activeCheckouts = await BookCheckout.countDocuments({ status: 'checked-out' });
    const overdueCheckouts = await BookCheckout.countDocuments({
      status: 'checked-out',
      dueDate: { $lt: new Date() }
    });
    
    const categoryStats = await Book.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    const recentCheckouts = await BookCheckout.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('bookId', 'title')
      .populate('userId', 'name');
    
    res.status(200).json({
      success: true,
      data: {
        totalBooks,
        availableBooks: availableBooks[0]?.total || 0,
        activeCheckouts,
        overdueCheckouts,
        categories: categoryStats,
        recentCheckouts
      }
    });
  } catch (error) {
    console.error('Get library stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
