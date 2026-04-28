const Department = require('../models/Department');
const User = require('../models/User');
const Asset = require('../models/Asset');
const ServiceRequest = require('../models/ServiceRequest');
const InventoryItem = require('../models/InventoryItem');
const Requisition = require('../models/Requisition');
const mongoose = require('mongoose');

// ==================== PUBLIC CONTROLLERS (No auth required) ====================

// @desc    Get all departments (public - for registration)
// @route   GET /api/departments/public
// @access  Public
exports.getPublicDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .select('name nameAm code _id')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: departments,
      count: departments.length
    });
  } catch (error) {
    console.error('Get public departments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single department (public)
// @route   GET /api/departments/public/:id
// @access  Public
exports.getPublicDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .select('name nameAm code');
    
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    
    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Get public department error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== PROTECTED CONTROLLERS ====================

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getDepartments = async (req, res) => {
  try {
    const { search, isActive, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nameAm: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const departments = await Department.find(query)
      .populate('hod', 'name email phone')
      .sort(sortOptions);
    
    // Get statistics for each department
    const departmentsWithStats = await Promise.all(
      departments.map(async (dept) => {
        const assetCount = await Asset.countDocuments({ department: dept._id });
        const activeRequests = await ServiceRequest.countDocuments({ 
          department: dept._id,
          status: { $nin: ['completed', 'rejected', 'cancelled'] }
        });
        const staffCount = await User.countDocuments({ 
          department: dept._id,
          role: { $in: ['staff', 'hod'] }
        });
        const studentCount = await User.countDocuments({ 
          department: dept._id,
          role: 'student'
        });
        
        return {
          ...dept.toObject(),
          stats: {
            assets: assetCount,
            activeRequests,
            staff: staffCount,
            students: studentCount
          }
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: departmentsWithStats,
      count: departmentsWithStats.length
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('hod', 'name email phone avatar');
    
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    
    // Get detailed statistics
    const assetCount = await Asset.countDocuments({ department: department._id });
    const assetsByStatus = await Asset.aggregate([
      { $match: { department: department._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const requestStats = await ServiceRequest.aggregate([
      { $match: { department: department._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const staffMembers = await User.find({ 
      department: department._id,
      role: { $in: ['staff', 'hod'] }
    }).select('name email phone role');
    
    const recentRequests = await ServiceRequest.find({ department: department._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('requester', 'name')
      .select('requestNumber title status priority createdAt');
    
    const budgetUtilization = department.budget?.annual 
      ? ((department.budget.annual - (department.budget.remaining || 0)) / department.budget.annual * 100).toFixed(1)
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        ...department.toObject(),
        stats: {
          totalAssets: assetCount,
          assetsByStatus,
          requests: requestStats,
          staffCount: staffMembers.length,
          budgetUtilization: parseFloat(budgetUtilization)
        },
        staff: staffMembers,
        recentRequests
      }
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private/Admin
exports.createDepartment = async (req, res) => {
  try {
    const { 
      name, 
      nameAm, 
      code, 
      hod, 
      building, 
      floor, 
      room,
      email,
      phone,
      budget,
      description
    } = req.body;
    
    // Convert code to uppercase
    const upperCode = code.toUpperCase();
    
    // Check if department with same code exists
    const existingDept = await Department.findOne({ 
      $or: [{ code: upperCode }, { name }] 
    });
    
    if (existingDept) {
      return res.status(400).json({ 
        success: false, 
        message: 'Department with this name or code already exists' 
      });
    }
    
    // Validate HOD if provided
    if (hod) {
      const hodUser = await User.findById(hod);
      if (!hodUser) {
        return res.status(400).json({ success: false, message: 'Invalid HOD user ID' });
      }
      if (hodUser.role !== 'hod') {
        return res.status(400).json({ 
          success: false, 
          message: 'User must have HOD role to be assigned as department head' 
        });
      }
    }
    
    const department = await Department.create({
      name,
      nameAm,
      code: upperCode,
      hod,
      building,
      floor,
      room,
      email,
      phone,
      budget: budget || { annual: 0, remaining: 0 },
      description,
      isActive: true
    });
    
    // If HOD was assigned, update the user's department
    if (hod) {
      await User.findByIdAndUpdate(hod, { department: department._id });
    }
    
    const populatedDept = await Department.findById(department._id)
      .populate('hod', 'name email');
    
    res.status(201).json({
      success: true,
      data: populatedDept,
      message: 'Department created successfully'
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private/Admin
exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    
    const { 
      name, 
      nameAm, 
      code, 
      hod, 
      building, 
      floor, 
      room,
      email,
      phone,
      budget,
      description,
      isActive
    } = req.body;
    
    // Check code uniqueness if changed
    if (code && code !== department.code) {
      const upperCode = code.toUpperCase();
      const existingDept = await Department.findOne({ code: upperCode });
      if (existingDept && existingDept._id.toString() !== department._id.toString()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Department code already exists' 
        });
      }
      department.code = upperCode;
    }
    
    // Handle HOD change
    if (hod && hod !== department.hod?.toString()) {
      const newHod = await User.findById(hod);
      if (!newHod) {
        return res.status(400).json({ success: false, message: 'Invalid HOD user ID' });
      }
      if (newHod.role !== 'hod') {
        return res.status(400).json({ 
          success: false, 
          message: 'User must have HOD role to be assigned as department head' 
        });
      }
      
      // Remove department from old HOD if exists
      if (department.hod) {
        await User.findByIdAndUpdate(department.hod, { $unset: { department: "" } });
      }
      
      // Assign new HOD
      await User.findByIdAndUpdate(hod, { department: department._id });
      department.hod = hod;
    }
    
    // Update fields
    if (name) department.name = name;
    if (nameAm) department.nameAm = nameAm;
    if (building) department.building = building;
    if (floor) department.floor = floor;
    if (room) department.room = room;
    if (email) department.email = email;
    if (phone) department.phone = phone;
    if (budget) {
      department.budget = {
        annual: budget.annual || department.budget?.annual || 0,
        remaining: budget.remaining !== undefined ? budget.remaining : department.budget?.remaining || 0
      };
    }
    if (description) department.description = description;
    if (isActive !== undefined) department.isActive = isActive;
    
    await department.save();
    
    const updatedDept = await Department.findById(department._id)
      .populate('hod', 'name email phone');
    
    res.status(200).json({
      success: true,
      data: updatedDept,
      message: 'Department updated successfully'
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
exports.deleteDepartment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const department = await Department.findById(req.params.id).session(session);
    
    if (!department) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    
    // Check if department has associated data
    const assetCount = await Asset.countDocuments({ department: department._id }).session(session);
    const userCount = await User.countDocuments({ department: department._id }).session(session);
    const requestCount = await ServiceRequest.countDocuments({ department: department._id }).session(session);
    
    if (assetCount > 0 || userCount > 0 || requestCount > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete department with associated data. Remove ${assetCount} assets, ${userCount} users, and ${requestCount} requests first.` 
      });
    }
    
    // Remove department reference from HOD if exists
    if (department.hod) {
      await User.findByIdAndUpdate(department.hod, { $unset: { department: "" } }).session(session);
    }
    
    await department.deleteOne({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({ 
      success: true, 
      message: 'Department deleted successfully' 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Delete department error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get department statistics
// @route   GET /api/departments/stats
// @access  Private/Admin
exports.getDepartmentStats = async (req, res) => {
  try {
    const totalDepartments = await Department.countDocuments();
    const activeDepartments = await Department.countDocuments({ isActive: true });
    
    const departmentsWithHOD = await Department.countDocuments({ hod: { $ne: null } });
    
    const totalBudget = await Department.aggregate([
      { $group: { _id: null, total: { $sum: '$budget.annual' } } }
    ]);
    
    const remainingBudget = await Department.aggregate([
      { $group: { _id: null, total: { $sum: '$budget.remaining' } } }
    ]);
    
    const departmentStats = await Department.aggregate([
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'department',
          as: 'users'
      }},
      { $lookup: {
          from: 'assets',
          localField: '_id',
          foreignField: 'department',
          as: 'assets'
      }},
      { $project: {
          name: 1,
          code: 1,
          userCount: { $size: '$users' },
          assetCount: { $size: '$assets' },
          budget: 1
      }},
      { $sort: { assetCount: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        total: totalDepartments,
        active: activeDepartments,
        withHOD: departmentsWithHOD,
        withoutHOD: totalDepartments - departmentsWithHOD,
        totalBudget: totalBudget[0]?.total || 0,
        remainingBudget: remainingBudget[0]?.total || 0,
        budgetUtilization: totalBudget[0]?.total 
          ? ((totalBudget[0].total - (remainingBudget[0]?.total || 0)) / totalBudget[0].total * 100).toFixed(1)
          : 0,
        topDepartments: departmentStats.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Get department stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get department assets
// @route   GET /api/departments/:id/assets
// @access  Private/Admin/HOD
exports.getDepartmentAssets = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, category, page = 1, limit = 10 } = req.query;
    
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    
    // Check authorization (HOD can only access their own department)
    if (req.user.role === 'hod' && req.user.department?.toString() !== id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    const query = { department: id };
    if (status) query.status = status;
    if (category) query.category = category;
    
    const assets = await Asset.find(query)
      .populate('category', 'name nameAm')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Asset.countDocuments(query);
    
    // Get asset value summary
    const valueSummary = await Asset.aggregate([
      { $match: { department: new mongoose.Types.ObjectId(id) } },
      { $group: {
          _id: null,
          totalValue: { $sum: '$purchasePrice' },
          avgValue: { $avg: '$purchasePrice' },
          count: { $sum: 1 }
      }}
    ]);
    
    res.status(200).json({
      success: true,
      data: assets,
      summary: valueSummary[0] || { totalValue: 0, avgValue: 0, count: 0 },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get department assets error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get department requests
// @route   GET /api/departments/:id/requests
// @access  Private/Admin/HOD
exports.getDepartmentRequests = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, page = 1, limit = 10 } = req.query;
    
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    
    // Check authorization
    if (req.user.role === 'hod' && req.user.department?.toString() !== id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    const query = { department: id };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    const requests = await ServiceRequest.find(query)
      .populate('requester', 'name email')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await ServiceRequest.countDocuments(query);
    
    // Get request statistics
    const statusStats = await ServiceRequest.aggregate([
      { $match: { department: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const avgCompletionTime = await ServiceRequest.aggregate([
      { $match: { 
          department: new mongoose.Types.ObjectId(id),
          status: 'completed',
          completedAt: { $exists: true }
      }},
      { $group: {
          _id: null,
          avgTime: { $avg: { $subtract: ['$completedAt', '$createdAt'] } }
      }}
    ]);
    
    res.status(200).json({
      success: true,
      data: requests,
      stats: {
        byStatus: statusStats,
        averageCompletionDays: avgCompletionTime[0] 
          ? (avgCompletionTime[0].avgTime / (1000 * 60 * 60 * 24)).toFixed(1)
          : null
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get department requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update department budget
// @route   PUT /api/departments/:id/budget
// @access  Private/Admin
exports.updateDepartmentBudget = async (req, res) => {
  try {
    const { annualBudget, notes } = req.body;
    
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    
    const previousBudget = department.budget?.annual || 0;
    const previousRemaining = department.budget?.remaining || 0;
    
    if (annualBudget !== undefined) {
      // Calculate new remaining budget
      const spent = previousBudget - previousRemaining;
      const newRemaining = annualBudget - spent;
      
      department.budget = {
        annual: annualBudget,
        remaining: newRemaining > 0 ? newRemaining : 0
      };
    }
    
    await department.save();
    
    res.status(200).json({
      success: true,
      data: {
        annual: department.budget.annual,
        remaining: department.budget.remaining
      },
      message: 'Department budget updated successfully'
    });
  } catch (error) {
    console.error('Update department budget error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get my department (for HOD dashboard)
// @route   GET /api/departments/my-department
// @access  Private/HOD
exports.getMyDepartment = async (req, res) => {
  try {
    if (req.user.role !== 'hod') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only department heads can access this endpoint' 
      });
    }
    
    const department = await Department.findById(req.user.department)
      .populate('hod', 'name email phone avatar');
    
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    
    // Get quick stats for dashboard
    const totalAssets = await Asset.countDocuments({ department: department._id });
    const availableAssets = await Asset.countDocuments({ 
      department: department._id,
      status: 'available'
    });
    
    const pendingRequests = await ServiceRequest.countDocuments({
      department: department._id,
      status: { $in: ['submitted', 'reviewing'] }
    });
    
    const inProgressRequests = await ServiceRequest.countDocuments({
      department: department._id,
      status: 'in-progress'
    });
    
    const completedRequests = await ServiceRequest.countDocuments({
      department: department._id,
      status: 'completed'
    });
    
    const totalStaff = await User.countDocuments({ 
      department: department._id,
      role: { $in: ['staff', 'hod'] }
    });
    
    const totalStudents = await User.countDocuments({ 
      department: department._id,
      role: 'student'
    });
    
    res.status(200).json({
      success: true,
      data: {
        ...department.toObject(),
        stats: {
          assets: {
            total: totalAssets,
            available: availableAssets,
            utilization: totalAssets ? ((totalAssets - availableAssets) / totalAssets * 100).toFixed(1) : 0
          },
          requests: {
            pending: pendingRequests,
            inProgress: inProgressRequests,
            completed: completedRequests,
            total: pendingRequests + inProgressRequests + completedRequests
          },
          users: {
            staff: totalStaff,
            students: totalStudents,
            total: totalStaff + totalStudents
          }
        }
      }
    });
  } catch (error) {
    console.error('Get my department error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
