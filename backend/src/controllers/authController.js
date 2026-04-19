
const User = require('../models/User');
const Department = require('../models/Department');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Generate refresh token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }
    
    const { 
      name, 
      email, 
      password, 
      role, 
      employeeId, 
      studentId, 
      phone,
      department
    } = req.body;
    
    console.log('Registration attempt for email:', email);
    
    // Check if user exists by email
    let userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    // Check studentId if provided
    if (studentId && studentId.trim()) {
      userExists = await User.findOne({ studentId: studentId.toUpperCase().trim() });
      if (userExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'Student ID already exists. Please check your ID or contact administrator.' 
        });
      }
    }
    
    // Check employeeId if provided
    if (employeeId && employeeId.trim()) {
      userExists = await User.findOne({ employeeId: employeeId.toUpperCase().trim() });
      if (userExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'Employee ID already exists. Please check your ID or contact administrator.' 
        });
      }
    }
    
    // Get department
    let departmentId = department;
    if (role === 'student' && !departmentId) {
      const defaultDept = await Department.findOne({ name: 'General Studies' });
      if (defaultDept) {
        departmentId = defaultDept._id;
      } else {
        const anyDept = await Department.findOne();
        if (anyDept) {
          departmentId = anyDept._id;
        }
      }
    }
    
    // Validate department if provided
    if (departmentId) {
      const departmentDoc = await Department.findById(departmentId);
      if (!departmentDoc) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid department selected' 
        });
      }
    } else if (role !== 'admin') {
      return res.status(400).json({ 
        success: false, 
        message: 'Department is required for non-admin users' 
      });
    }
    
    // Create user data object
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: role || 'student',
      department: departmentId,
      isActive: true
    };
    
    // Only add phone if provided and valid
    if (phone && phone.trim()) {
      userData.phone = phone.trim();
    }
    
    // Only add studentId if provided and role is student
    if (role === 'student' && studentId && studentId.trim()) {
      userData.studentId = studentId.trim();
    }
    
    // Only add employeeId if provided and role is staff or hod
    if ((role === 'staff' || role === 'hod') && employeeId && employeeId.trim()) {
      userData.employeeId = employeeId.trim();
    }
    
    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });
    
    // Create user
    const user = await User.create(userData);
    
    console.log('User created successfully:', user._id);
    
    // Send welcome email (optional, handle error gracefully)
    try {
      await sendWelcomeEmail(user);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }
    
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: departmentId,
        phone: user.phone,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Registration error details:', error);
    
    // Handle duplicate key error from MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let message = '';
      switch (field) {
        case 'email':
          message = 'Email address is already registered';
          break;
        case 'studentId':
          message = 'Student ID is already registered. Please contact administrator.';
          break;
        case 'employeeId':
          message = 'Employee ID is already registered. Please contact administrator.';
          break;
        default:
          message = `${field} already exists`;
      }
      return res.status(400).json({ 
        success: false, 
        message,
        field 
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages[0],
        errors: messages 
      });
    }
    
    // Log full error stack for debugging
    console.error('Full error stack:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error during registration. Please try again.' 
    });
  }
};



// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }
    
    // Check for user
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    }).select('+password').populate('department');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Update last login
    user.lastLogin = Date.now();
    user.lastLoginIP = req.ip;
    await user.save();
    
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // Set cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'strict'
    });
    
    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        avatar: user.avatar,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Refresh token required' 
      });
    }
    
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid refresh token' 
        });
      }
      
      const token = generateToken(user._id);
      const newRefreshToken = generateRefreshToken(user._id);
      
      user.refreshToken = newRefreshToken;
      await user.save();
      
      res.status(200).json({
        success: true,
        token,
        refreshToken: newRefreshToken
      });
    } catch (err) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired refresh token' 
      });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('department')
      .select('-password -refreshToken');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide current and new password' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters' 
      });
    }
    
    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    const token = generateToken(user._id);
    
    res.status(200).json({ 
      success: true, 
      token,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No user with that email' 
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();
    
    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <h1>Password Reset Request</h1>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetUrl}" target="_blank">Reset Password</a>
          <p>This link expires in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      });
      
      res.status(200).json({ 
        success: true, 
        message: 'Password reset email sent' 
      });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      return res.status(500).json({ 
        success: false, 
        message: 'Email could not be sent' 
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }
    
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    const token = generateToken(user._id);
    
    res.status(200).json({ 
      success: true, 
      token,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    res.cookie('refreshToken', 'none', {
      httpOnly: true,
      expires: new Date(Date.now() + 10 * 1000),
      secure: process.env.NODE_ENV === 'production'
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};
