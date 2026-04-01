/**
 * Role-based access control middleware
 */

// Role hierarchy levels
const roleLevels = {
  student: 1,
  staff: 2,
  hod: 3,
  admin: 4
};



/**
 * Check if user has required role level
 */
const hasRoleLevel = (requiredLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }
    
    const userLevel = roleLevels[req.user.role];
    const minLevel = roleLevels[requiredLevel];
    
    if (userLevel >= minLevel) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: 'Insufficient permissions' 
    });
  };
};

/**
 * Check if user is department head of the department
 */
const isDepartmentHead = async (req, res, next) => {
  try {
    if (req.user.role !== 'hod') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only department heads can access this resource' 
      });
    }
    
    // Check if the requested department matches user's department
    const requestedDept = req.params.departmentId || req.body.department;
    
    if (requestedDept && requestedDept !== req.user.department.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only access your own department' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Department head check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

/**
 * Check if user is staff or higher
 */
const isStaffOrHigher = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authenticated' 
    });
  }
  
  const staffRoles = ['staff', 'hod', 'admin'];
  
  if (staffRoles.includes(req.user.role)) {
    return next();
  }
  
  return res.status(403).json({ 
    success: false, 
    message: 'Staff privileges required' 
  });
};

/**
 * Check if user can approve requisitions
 */
const canApproveRequisition = (approvalType) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }
    
    if (approvalType === 'hod' && req.user.role === 'hod') {
      return next();
    }
    
    if (approvalType === 'finance' && (req.user.role === 'admin' || req.user.role === 'finance')) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: `You don't have permission to approve ${approvalType} requisitions` 
    });
  };
};

/**
 * Check if user can view reports
 */
const canViewReports = (reportType) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }
    
    // Admin can view all reports
    if (req.user.role === 'admin') {
      return next();
    }
    
    // HOD can view department reports
    if (req.user.role === 'hod' && 
        (reportType === 'department' || reportType === 'assets' || reportType === 'requests')) {
      return next();
    }
    
    // Staff can view assigned reports
    if (req.user.role === 'staff' && reportType === 'assigned') {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: `You don't have permission to view ${reportType} reports` 
    });
  };
};

/**
 * Validate resource access based on user role and resource
 */
const validateResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Admin has full access
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Different validation based on resource type
      switch (resourceType) {
        case 'asset':
          const Asset = require('../models/Asset');
          const asset = await Asset.findById(id);
          if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
          }
          
          if (req.user.role === 'hod' && 
              asset.department.toString() !== req.user.department.toString()) {
            return res.status(403).json({ 
              success: false, 
              message: 'You can only access assets in your department' 
            });
          }
          break;
          
        case 'request':
          const ServiceRequest = require('../models/ServiceRequest');
          const request = await ServiceRequest.findById(id);
          if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
          }
          
          // Student can only access their own requests
          if (req.user.role === 'student' && 
              request.requester.toString() !== req.user.id) {
            return res.status(403).json({ 
              success: false, 
              message: 'You can only access your own requests' 
            });
          }
          
          // HOD can access department requests
          if (req.user.role === 'hod' && 
              request.department.toString() !== req.user.department.toString()) {
            return res.status(403).json({ 
              success: false, 
              message: 'You can only access requests in your department' 
            });
          }
          
          // Staff can access assigned requests
          if (req.user.role === 'staff' && 
              request.assignedTo && 
              request.assignedTo.toString() !== req.user.id) {
            return res.status(403).json({ 
              success: false, 
              message: 'You can only access requests assigned to you' 
            });
          }
          break;
          
        case 'user':
          // Users can only access their own profile
          if (req.user.role !== 'admin' && id !== req.user.id) {
            return res.status(403).json({ 
              success: false, 
              message: 'You can only access your own profile' 
            });
          }
          break;
          
        default:
          break;
      }
      
      next();
    } catch (error) {
      console.error('Resource access validation error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
};

module.exports = {
  hasRoleLevel,
  isDepartmentHead,
  isStaffOrHigher,
  canApproveRequisition,
  canViewReports,
  validateResourceAccess,
  roleLevels
};
