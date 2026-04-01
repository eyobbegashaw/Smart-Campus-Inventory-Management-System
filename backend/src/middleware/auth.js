const jwt = require('jsonwebtoken');
const User = require('../models/User');



/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  let token;
  
  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Check for token in cookies
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route' 
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is disabled. Please contact administrator' 
      });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized' 
    });
  }
};

/**
 * Check if user has one of the specified roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

/**
 * Check if user owns the resource or is admin/HOD
 */
const checkOwnership = (resourceModel, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      const resource = await resourceModel.findById(req.params[resourceIdField]);
      
      if (!resource) {
        return res.status(404).json({ 
          success: false, 
          message: 'Resource not found' 
        });
      }
      
      // Admin can access everything
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }
      
      // Check if user owns the resource
      if (resource.userId && resource.userId.toString() === req.user.id) {
        req.resource = resource;
        return next();
      }
      
      if (resource.requester && resource.requester.toString() === req.user.id) {
        req.resource = resource;
        return next();
      }
      
      // HOD can access department resources
      if (req.user.role === 'hod' && resource.department) {
        if (resource.department.toString() === req.user.department.toString()) {
          req.resource = resource;
          return next();
        }
      }
      
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this resource' 
      });
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  };
};

/**
 * Rate limiting by user role
 */
const roleRateLimit = {
  admin: 200,
  hod: 100,
  staff: 100,
  student: 50
};

const rateLimitByRole = (req, res, next) => {
  // This would be implemented with a Redis store in production
  // For now, just pass through
  next();
};

/**
 * Log user activity
 */
const logActivity = (action) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Store original end function
    const originalEnd = res.end;
    
    // Override end function to log after response
    res.end = function(...args) {
      const responseTime = Date.now() - startTime;
      
      // Log activity (would be saved to database in production)
      console.log({
        user: req.user?.id,
        action,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      });
      
      // Call original end
      originalEnd.apply(res, args);
    };
    
    next();
  };
};

module.exports = { 
  protect, 
  authorize, 
  checkOwnership,
  rateLimitByRole,
  logActivity
};
