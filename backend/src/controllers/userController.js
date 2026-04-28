const User = require('../models/User');
const Department = require('../models/Department');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { sendWelcomeEmail } = require('../services/notificationService');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      department,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (role) query.role = role;
    if (department) query.department = department;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const users = await User.find(query)
      .populate('department', 'name nameAm code')
      .select('-password -refreshToken -resetPasswordToken -emailVerificationToken')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort(sortOptions);
    
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('department', 'name nameAm code building floor')
      .select('-password -refreshToken -resetPasswordToken -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      employeeId, 
      studentId, 
      department,
      phone,
      isActive
    } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ 
      $or: [{ email }, { employeeId }, { studentId }].filter(field => field)
    });
    
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email or ID already exists' 
      });
    }
    
    // Generate temporary password if not provided
    const tempPassword = password || Math.random().toString(36).slice(-8);
    
    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: tempPassword,
      role: role || 'student',
      employeeId,
      studentId,
      department,
      phone,
      isActive: isActive !== undefined ? isActive : true
    });
    
    // Send welcome email with temporary password
    try {
      await sendWelcomeEmail(user, tempPassword);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }
    
    const createdUser = await User.findById(user._id)
      .populate('department', 'name nameAm code')
      .select('-password -refreshToken');
    
    res.status(201).json({
      success: true,
      data: createdUser,
      temporaryPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Duplicate field value entered' 
      });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      role, 
      employeeId, 
      studentId, 
      department,
      phone,
      isActive,
      preferences
    } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check email uniqueness if changed
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already in use' 
        });
      }
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (employeeId) user.employeeId = employeeId;
    if (studentId) user.studentId = studentId;
    if (department) user.department = department;
    if (phone) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    
    await user.save();
    
    const updatedUser = await User.findById(user._id)
      .populate('department', 'name nameAm code')
      .select('-password -refreshToken');
    
    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete the last admin user' 
        });
      }
    }
    
    await user.deleteOne();
    
    res.status(200).json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user profile (self)
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar, preferences } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    
    await user.save();
    
    const updatedUser = await User.findById(user._id)
      .populate('department', 'name nameAm code')
      .select('-password -refreshToken');
    
    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    const departmentStats = await User.aggregate([
      { $match: { department: { $exists: true, $ne: null } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'departmentInfo'
      }},
      { $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true } },
      { $project: {
          departmentName: '$departmentInfo.name',
          count: 1
      }}
    ]);
    
    const monthlyStats = await User.aggregate([
      { $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
      }},
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    
    const recentUsers = await User.find()
      .populate('department', 'name')
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        byRole: roleStats,
        byDepartment: departmentStats,
        monthly: monthlyStats.map(m => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          count: m.count
        })),
        recentUsers
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Change user password (admin)
// @route   PUT /api/users/:id/password
// @access  Private/Admin
exports.changeUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Change user password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Toggle user status (activate/deactivate)
// @route   PUT /api/users/:id/toggle-status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Prevent deactivating the last admin
    if (user.role === 'admin' && user.isActive) {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot deactivate the last active admin user' 
        });
      }
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.status(200).json({ 
      success: true, 
      data: { isActive: user.isActive },
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Bulk import users
// @route   POST /api/users/bulk-import
// @access  Private/Admin
exports.bulkImportUsers = async (req, res) => {
  try {
    const { users } = req.body;
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide an array of users to import' 
      });
    }
    
    const results = {
      successful: [],
      failed: []
    };
    
    for (const userData of users) {
      try {
        const tempPassword = Math.random().toString(36).slice(-8);
        
        const user = await User.create({
          name: userData.name,
          email: userData.email.toLowerCase(),
          password: tempPassword,
          role: userData.role || 'student',
          employeeId: userData.employeeId,
          studentId: userData.studentId,
          department: userData.department,
          phone: userData.phone,
          isActive: true
        });
        
        // Send welcome email
        try {
          await sendWelcomeEmail(user, tempPassword);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
        }
        
        results.successful.push({
          id: user._id,
          email: user.email,
          name: user.name
        });
      } catch (error) {
        results.failed.push({
          email: userData.email,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: results,
      message: `Imported ${results.successful.length} users, ${results.failed.length} failed`
    });
  } catch (error) {
    console.error('Bulk import users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Export users to CSV
// @route   GET /api/users/export
// @access  Private/Admin
exports.exportUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('department', 'name')
      .select('name email role employeeId studentId department phone isActive createdAt');
    
    const csvHeaders = ['Name', 'Email', 'Role', 'Employee ID', 'Student ID', 'Department', 'Phone', 'Status', 'Created At'];
    const csvRows = [csvHeaders];
    
    for (const user of users) {
      csvRows.push([
        user.name,
        user.email,
        user.role,
        user.employeeId || '',
        user.studentId || '',
        user.department?.name || '',
        user.phone || '',
        user.isActive ? 'Active' : 'Inactive',
        user.createdAt.toISOString().split('T')[0]
      ]);
    }
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=users-export-${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
