const InventoryItem = require('../models/InventoryItem');
const Requisition = require('../models/Requisition');
const Department = require('../models/Department');
const User = require('../models/User');
const mongoose = require('mongoose');



// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
exports.getInventoryItems = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category,
      lowStock,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;
    
    const query = {};
    
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nameAm: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Low stock filter
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$minimumQuantity'] };
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const items = await InventoryItem.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort(sortOptions);
    
    const total = await InventoryItem.countDocuments(query);
    
    // Add low stock flag
    const itemsWithFlag = items.map(item => ({
      ...item.toObject(),
      isLowStock: item.quantity <= item.minimumQuantity
    }));
    
    res.status(200).json({
      success: true,
      data: itemsWithFlag,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private
exports.getInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    // Get requisition history
    const requisitionHistory = await Requisition.find({
      'items.inventoryItemId': item._id
    })
      .populate('requester', 'name email')
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.status(200).json({
      success: true,
      data: item,
      requisitionHistory
    });
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private/Admin
exports.createInventoryItem = async (req, res) => {
  try {
    const itemData = req.body;
    
    // Generate SKU if not provided
    if (!itemData.sku) {
      const categoryCode = itemData.category.substring(0, 3).toUpperCase();
      const count = await InventoryItem.countDocuments();
      itemData.sku = `${categoryCode}-${String(count + 1).padStart(5, '0')}`;
    }
    
    const item = await InventoryItem.create(itemData);
    
    // Check for low stock alert
    if (item.quantity <= item.minimumQuantity) {
      const io = req.app.get('io');
      io.emit('low-stock-alert', {
        itemId: item._id,
        name: item.name,
        quantity: item.quantity,
        minimumQuantity: item.minimumQuantity
      });
    }
    
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Create inventory error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'SKU already exists' 
      });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private/Admin
exports.updateInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    const oldQuantity = item.quantity;
    const newQuantity = req.body.quantity;
    
    const updatedItem = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    // Check for low stock after update
    if (updatedItem.quantity <= updatedItem.minimumQuantity) {
      const io = req.app.get('io');
      io.emit('low-stock-alert', {
        itemId: updatedItem._id,
        name: updatedItem.name,
        quantity: updatedItem.quantity,
        minimumQuantity: updatedItem.minimumQuantity
      });
    }
    
    // Record stock movement
    if (oldQuantity !== newQuantity) {
      const movement = {
        itemId: updatedItem._id,
        previousQuantity: oldQuantity,
        newQuantity: newQuantity,
        change: newQuantity - oldQuantity,
        reason: req.body.movementReason || 'Manual update',
        updatedBy: req.user.id,
        timestamp: new Date()
      };
      
      // Store movement in database (you might want to create a StockMovement model)
      // For now, we'll just log it
      console.log('Stock movement:', movement);
    }
    
    res.status(200).json({ success: true, data: updatedItem });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private/Admin
exports.deleteInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    // Check if item is used in any active requisitions
    const activeRequisitions = await Requisition.findOne({
      'items.inventoryItemId': item._id,
      status: { $in: ['submitted', 'hod-approved', 'finance-approved'] }
    });
    
    if (activeRequisitions) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete item with active requisitions' 
      });
    }
    
    await item.deleteOne();
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get low stock items
// @route   GET /api/inventory/low-stock
// @access  Private/Admin
exports.getLowStockItems = async (req, res) => {
  try {
    const items = await InventoryItem.find({
      $expr: { $lte: ['$quantity', '$minimumQuantity'] }
    }).sort({ quantity: 1 });
    
    const criticalItems = items.filter(item => item.quantity === 0);
    const lowStockItems = items.filter(item => item.quantity > 0);
    
    res.status(200).json({
      success: true,
      data: {
        critical: criticalItems,
        lowStock: lowStockItems,
        total: items.length
      }
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create requisition
// @route   POST /api/inventory/requisitions
// @access  Private
exports.createRequisition = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { items, purpose, department } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one item is required' 
      });
    }
    
    // Validate items
    for (const item of items) {
      const inventoryItem = await InventoryItem.findById(item.inventoryItemId).session(session);
      if (!inventoryItem) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: `Item ${item.name} not found` 
        });
      }
      
      // Check if requested quantity is available
      if (item.quantity > inventoryItem.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.quantity}` 
        });
      }
    }
    
    const requisitionData = {
      requester: req.user.id,
      department: department || req.user.department,
      items: items.map(item => ({
        ...item,
        estimatedPrice: item.estimatedPrice || 0
      })),
      purpose,
      status: 'submitted'
    };
    
    const requisition = await Requisition.create([requisitionData], { session });
    
    await session.commitTransaction();
    session.endSession();
    
    await requisition[0].populate([
      { path: 'requester', select: 'name email' },
      { path: 'department', select: 'name' },
      { path: 'items.inventoryItemId', select: 'name sku unit' }
    ]);
    
    // Notify HOD
    const hod = await User.findOne({ 
      department: requisition[0].department,
      role: 'hod'
    });
    
    if (hod) {
      const io = req.app.get('io');
      io.to(`user-${hod._id}`).emit('new-requisition', {
        requisitionId: requisition[0]._id,
        requisitionNumber: requisition[0].requisitionNumber,
        requester: req.user.name
      });
    }
    
    res.status(201).json({ success: true, data: requisition[0] });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Create requisition error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get requisitions
// @route   GET /api/inventory/requisitions
// @access  Private
exports.getRequisitions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      department
    } = req.query;
    
    const query = {};
    
    // Role-based filtering
    if (req.user.role === 'student') {
      query.requester = req.user.id;
    } else if (req.user.role === 'hod') {
      query.department = req.user.department;
    }
    
    if (status) query.status = status;
    if (department && req.user.role === 'admin') query.department = department;
    
    const requisitions = await Requisition.find(query)
      .populate('requester', 'name email')
      .populate('department', 'name')
      .populate('approvals.approverId', 'name')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Requisition.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: requisitions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get requisitions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update requisition status
// @route   PUT /api/inventory/requisitions/:id/status
// @access  Private
exports.updateRequisitionStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { status, comments } = req.body;
    const requisition = await Requisition.findById(req.params.id).session(session);
    
    if (!requisition) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Requisition not found' });
    }
    
    // Check authorization
    if (status === 'hod-approved' && req.user.role !== 'hod') {
      return res.status(403).json({ success: false, message: 'Only HOD can approve' });
    }
    
    if (status === 'finance-approved' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only finance can approve' });
    }
    
    requisition.status = status;
    requisition.approvals.push({
      approverId: req.user.id,
      role: req.user.role === 'hod' ? 'hod' : 'finance',
      status: status.includes('approved') ? 'approved' : 'rejected',
      comments,
      date: new Date()
    });
    
    // If approved by both HOD and Finance, update inventory
    if (status === 'finance-approved') {
      for (const item of requisition.items) {
        const inventoryItem = await InventoryItem.findById(item.inventoryItemId).session(session);
        if (inventoryItem) {
          inventoryItem.quantity -= item.quantity;
          inventoryItem.lastRestocked = new Date();
          await inventoryItem.save({ session });
        }
      }
    }
    
    await requisition.save({ session });
    await session.commitTransaction();
    session.endSession();
    
    // Notify requester
    const io = req.app.get('io');
    io.to(`user-${requisition.requester}`).emit('requisition-update', {
      requisitionId: requisition._id,
      status: requisition.status,
      comments
    });
    
    res.status(200).json({ success: true, data: requisition });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Update requisition error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats
// @access  Private/Admin
exports.getInventoryStats = async (req, res) => {
  try {
    const totalItems = await InventoryItem.countDocuments();
    const totalValue = await InventoryItem.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$unitPrice'] } } } }
    ]);
    
    const lowStockCount = await InventoryItem.countDocuments({
      $expr: { $lte: ['$quantity', '$minimumQuantity'] }
    });
    
    const categoryStats = await InventoryItem.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    const recentRequisitions = await Requisition.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('requester', 'name')
      .populate('department', 'name');
    
    res.status(200).json({
      success: true,
      data: {
        totalItems,
        totalValue: totalValue[0]?.total || 0,
        lowStockCount,
        categories: categoryStats,
        recentRequisitions
      }
    });
  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
