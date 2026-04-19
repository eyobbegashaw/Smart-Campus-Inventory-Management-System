
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const Department = require('../models/Department');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/requests';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `request-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed (jpeg, jpg, png, gif)'));
  }
};

const upload = multer({ 
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter
});

exports.uploadPhotos = upload.array('photos', 5);

// @desc    Get all requests
// @route   GET /api/requests
// @access  Private
exports.getRequests = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category, 
      priority,
      department,
      search
    } = req.query;
    
    const query = {};
    
    // Filter by role
    if (req.user.role === 'student') {
      query.requester = req.user.id;
    } else if (req.user.role === 'hod') {
      query.department = req.user.department;
    } else if (req.user.role === 'staff') {
      query.assignedTo = req.user.id;
    }
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (department && req.user.role === 'admin') query.department = department;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { requestNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const requests = await ServiceRequest.find(query)
      .populate('requester', 'name email studentId employeeId avatar')
      .populate('department', 'name nameAm')
      .populate('assignedTo', 'name email')
      .populate('comments.userId', 'name role avatar')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await ServiceRequest.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single request
// @route   GET /api/requests/:id
// @access  Private
exports.getRequest = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('requester', 'name email studentId employeeId phone avatar')
      .populate('department', 'name nameAm building floor')
      .populate('assignedTo', 'name email phone avatar')
      .populate('comments.userId', 'name role avatar');
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    // Check authorization
    if (req.user.role === 'student' && request.requester._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    if (req.user.role === 'hod' && request.department._id.toString() !== req.user.department.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create request
// @route   POST /api/requests
// @access  Private
exports.createRequest = async (req, res) => {
  try {
    const requestData = req.body;
    requestData.requester = req.user.id;
    
    // Set department from user if not provided
    if (!requestData.department && req.user.department) {
      requestData.department = req.user.department;
    }
    
    // Generate request number
    const year = new Date().getFullYear();
    const count = await ServiceRequest.countDocuments();
    requestData.requestNumber = `SR-${year}-${String(count + 1).padStart(5, '0')}`;
    
    // Handle photo uploads
    if (req.files && req.files.length > 0) {
      requestData.photos = req.files.map(file => `/uploads/requests/${file.filename}`);
    }
    
    const request = await ServiceRequest.create(requestData);
    
    await request.populate([
      { path: 'requester', select: 'name email' },
      { path: 'department', select: 'name' }
    ]);
    
    // Emit socket event for real-time notification
    const io = req.app.get('io');
    io.emit('new-request', { 
      requestId: request._id, 
      requestNumber: request.requestNumber,
      department: request.department,
      title: request.title
    });
    
    // Notify department staff
    const staff = await User.find({ 
      department: request.department,
      role: 'staff',
      isActive: true
    });
    
    staff.forEach(staffMember => {
      io.to(`user-${staffMember._id}`).emit('new-request-notification', {
        requestId: request._id,
        requestNumber: request.requestNumber,
        title: request.title,
        requester: request.requester.name
      });
    });
    
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update request status
// @route   PUT /api/requests/:id/status
// @access  Private/Staff/Admin
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status, assignedTo, notes } = req.body;
    
    const request = await ServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    const oldStatus = request.status;
    request.status = status;
    
    if (assignedTo) {
      request.assignedTo = assignedTo;
    }
    
    if (notes) {
      request.comments.push({
        userId: req.user.id,
        text: `Status updated: ${oldStatus} → ${status}. Note: ${notes}`,
        createdAt: new Date()
      });
    }
    
    await request.save();
    
    await request.populate([
      { path: 'requester', select: 'name email' },
      { path: 'assignedTo', select: 'name email' }
    ]);
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`request-${request._id}`).emit('status-update', { 
      requestId: request._id, 
      status: request.status,
      oldStatus,
      updatedBy: req.user.name
    });
    
    // Notify requester
    io.to(`user-${request.requester._id}`).emit('request-status-change', {
      requestId: request._id,
      requestNumber: request.requestNumber,
      status: request.status,
      message: `Your request "${request.title}" has been ${status}`
    });
    
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add comment to request
// @route   POST /api/requests/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }
    
    const request = await ServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    request.comments.push({
      userId: req.user.id,
      text: text.trim(),
      createdAt: new Date()
    });
    
    await request.save();
    
    const updatedRequest = await ServiceRequest.findById(req.params.id)
      .populate('comments.userId', 'name role avatar');
    
    const newComment = updatedRequest.comments[updatedRequest.comments.length - 1];
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`request-${request._id}`).emit('new-comment', { 
      requestId: request._id, 
      comment: newComment
    });
    
    // Notify requester and assigned staff
    const recipients = [request.requester];
    if (request.assignedTo) recipients.push(request.assignedTo);
    
    recipients.forEach(recipientId => {
      if (recipientId.toString() !== req.user.id) {
        io.to(`user-${recipientId}`).emit('comment-notification', {
          requestId: request._id,
          requestNumber: request.requestNumber,
          comment: newComment,
          commentedBy: req.user.name
        });
      }
    });
    
    res.status(200).json({ success: true, data: newComment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get request statistics
// @route   GET /api/requests/stats
// @access  Private/Admin/HOD
exports.getRequestStats = async (req, res) => {
  try {
    const query = {};
    
    if (req.user.role === 'hod') {
      query.department = req.user.department;
    }
    
    const stats = await ServiceRequest.aggregate([
      { $match: query },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);
    
    const priorityStats = await ServiceRequest.aggregate([
      { $match: query },
      { $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }}
    ]);
    
    const categoryStats = await ServiceRequest.aggregate([
      { $match: query },
      { $group: {
        _id: '$category',
        count: { $sum: 1 }
      }}
    ]);
    
    const monthlyStats = await ServiceRequest.aggregate([
      { $match: query },
      { $group: {
        _id: { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 },
        avgCompletionTime: { $avg: { 
          $subtract: ['$completedAt', '$createdAt'] 
        }}
      }},
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    
    // Calculate average completion time for completed requests
    const avgCompletion = await ServiceRequest.aggregate([
      { $match: { ...query, status: 'completed', completedAt: { $exists: true } } },
      { $group: {
        _id: null,
        avgTime: { $avg: { $subtract: ['$completedAt', '$createdAt'] } }
      }}
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        status: stats,
        priority: priorityStats,
        categories: categoryStats,
        monthly: monthlyStats.map(m => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          count: m.count,
          avgCompletionDays: m.avgCompletionTime ? (m.avgCompletionTime / (1000 * 60 * 60 * 24)).toFixed(1) : null
        })),
        averageCompletionTime: avgCompletion[0] ? 
          (avgCompletion[0].avgTime / (1000 * 60 * 60 * 24)).toFixed(1) + ' days' : 
          'N/A'
      }
    });
  } catch (error) {
    console.error('Get request stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Assign request to staff
// @route   PUT /api/requests/:id/assign
// @access  Private/Admin/HOD
exports.assignRequest = async (req, res) => {
  try {
    const { staffId } = req.body;
    
    const request = await ServiceRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    const staff = await User.findById(staffId);
    if (!staff || staff.role !== 'staff') {
      return res.status(400).json({ success: false, message: 'Invalid staff member' });
    }
    
    request.assignedTo = staffId;
    request.status = 'reviewing';
    await request.save();
    
    await request.populate('assignedTo', 'name email');
    
    // Notify assigned staff
    const io = req.app.get('io');
    io.to(`user-${staffId}`).emit('request-assigned', {
      requestId: request._id,
      requestNumber: request.requestNumber,
      title: request.title,
      assignedBy: req.user.name
    });
    
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error('Assign request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
