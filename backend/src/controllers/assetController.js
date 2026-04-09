const Asset = require('../models/Asset');
const AssetCategory = require('../models/AssetCategory');
const Checkout = require('../models/Checkout');
const Department = require('../models/Department');
const User = require('../models/User');
const { generateAssetQR } = require('../services/qrGenerator');
const mongoose = require('mongoose');


// @desc    Get all assets
// @route   GET /api/assets
// @access  Private
exports.getAssets = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category, 
      department,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    // Role-based filtering
    if (req.user.role === 'hod') {
      query.department = req.user.department;
    } else if (req.user.role === 'staff') {
      query.$or = [
        { department: req.user.department },
        { status: 'available' }
      ];
    }
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (department && req.user.role === 'admin') query.department = department;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetTag: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const assets = await Asset.find(query)
      .populate('category', 'name nameAm')
      .populate('department', 'name nameAm code')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort(sortOptions);
    
    const total = await Asset.countDocuments(query);
    
    // Get checkout counts for each asset
    const assetIds = assets.map(asset => asset._id);
    const checkoutCounts = await Checkout.aggregate([
      { $match: { assetId: { $in: assetIds } } },
      { $group: { _id: '$assetId', count: { $sum: 1 } } }
    ]);
    
    const assetsWithStats = assets.map(asset => {
      const checkoutStat = checkoutCounts.find(c => c._id.toString() === asset._id.toString());
      return {
        ...asset.toObject(),
        checkoutCount: checkoutStat?.count || 0
      };
    });
    
    res.status(200).json({
      success: true,
      data: assetsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single asset
// @route   GET /api/assets/:id
// @access  Private
exports.getAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('category', 'name nameAm depreciationRate')
      .populate('department', 'name nameAm code building floor');
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    // Check authorization
    if (req.user.role === 'hod' && asset.department._id.toString() !== req.user.department.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    // Get checkout history
    const checkoutHistory = await Checkout.find({ assetId: asset._id })
      .populate('checkedOutBy', 'name email role')
      .populate('checkedOutTo', 'name email role')
      .sort({ createdAt: -1 })
      .limit(20);
    
    // Calculate asset value depreciation
    if (asset.purchaseDate && asset.purchasePrice && asset.category?.depreciationRate) {
      const yearsOwned = (new Date() - new Date(asset.purchaseDate)) / (1000 * 60 * 60 * 24 * 365);
      const depreciation = asset.purchasePrice * (asset.category.depreciationRate / 100) * yearsOwned;
      asset.currentValue = Math.max(0, asset.purchasePrice - depreciation);
    }
    
    res.status(200).json({
      success: true,
      data: asset,
      checkoutHistory
    });
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create asset
// @route   POST /api/assets
// @access  Private/Admin
exports.createAsset = async (req, res) => {
  try {
    const assetData = req.body;
    
    // Validate category
    if (assetData.category) {
      const category = await AssetCategory.findById(assetData.category);
      if (!category) {
        return res.status(400).json({ success: false, message: 'Invalid category' });
      }
    }
    
    // Validate department
    if (assetData.department) {
      const department = await Department.findById(assetData.department);
      if (!department) {
        return res.status(400).json({ success: false, message: 'Invalid department' });
      }
    }
    
    // Generate unique asset tag if not provided
    if (!assetData.assetTag) {
      const year = new Date().getFullYear();
      const count = await Asset.countDocuments();
      assetData.assetTag = `AST-${year}-${String(count + 1).padStart(5, '0')}`;
    }
    
    // Generate QR code
    const qrResult = await generateAssetQR(assetData.assetTag, assetData.name);
    
    assetData.qrCode = qrResult.dataURL;
    assetData.qrCodeData = qrResult.value;
    
    const asset = await Asset.create(assetData);
    
    // Populate references
    await asset.populate(['category', 'department']);
    
    // Emit socket event
    const io = req.app.get('io');
    io.emit('asset-created', { assetId: asset._id, assetTag: asset.assetTag });
    
    res.status(201).json({
      success: true,
      data: asset,
      qrSVG: qrResult.svg
    });
  } catch (error) {
    console.error('Create asset error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Asset tag already exists' 
      });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update asset
// @route   PUT /api/assets/:id
// @access  Private/Admin
exports.updateAsset = async (req, res) => {
  try {
    let asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    // Update QR code if asset tag or name changed
    if (req.body.assetTag && req.body.assetTag !== asset.assetTag ||
        req.body.name && req.body.name !== asset.name) {
      const qrResult = await generateAssetQR(
        req.body.assetTag || asset.assetTag,
        req.body.name || asset.name
      );
      req.body.qrCode = qrResult.dataURL;
      req.body.qrCodeData = qrResult.value;
    }
    
    asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate(['category', 'department']);
    
    // Emit socket event
    const io = req.app.get('io');
    io.emit('asset-updated', { assetId: asset._id, assetTag: asset.assetTag });
    
    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete asset
// @route   DELETE /api/assets/:id
// @access  Private/Admin
exports.deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    // Check if asset has active checkouts
    const activeCheckout = await Checkout.findOne({
      assetId: asset._id,
      status: 'active'
    });
    
    if (activeCheckout) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete asset with active checkout' 
      });
    }
    
    await asset.deleteOne();
    
    // Emit socket event
    const io = req.app.get('io');
    io.emit('asset-deleted', { assetId: asset._id });
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Checkout asset
// @route   POST /api/assets/:id/checkout
// @access  Private
exports.checkoutAsset = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { checkedOutTo, expectedReturnDate, condition, purpose } = req.body;
    
    const asset = await Asset.findById(req.params.id).session(session);
    
    if (!asset) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    if (asset.status !== 'available') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: `Asset is not available for checkout (status: ${asset.status})` 
      });
    }
    
    // Validate user if checkedOutTo provided
    let userTo = null;
    if (checkedOutTo) {
      userTo = await User.findById(checkedOutTo).session(session);
      if (!userTo) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Invalid user' });
      }
    }
    
    const checkout = await Checkout.create([{
      assetId: asset._id,
      checkedOutBy: req.user.id,
      checkedOutTo: checkedOutTo || req.user.id,
      expectedReturnDate,
      condition: condition || 'Good',
      purpose,
      status: 'active'
    }], { session });
    
    asset.status = 'checked-out';
    await asset.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    await checkout[0].populate([
      { path: 'checkedOutBy', select: 'name email' },
      { path: 'checkedOutTo', select: 'name email' }
    ]);
    
    // Emit socket event
    const io = req.app.get('io');
    io.emit('asset-checked-out', { 
      assetId: asset._id, 
      checkoutId: checkout[0]._id,
      checkedOutBy: req.user.name
    });
    
    // Send notification to user
    const ioInstance = req.app.get('io');
    ioInstance.to(`user-${checkedOutTo || req.user.id}`).emit('asset-checkout-notification', {
      message: `You have checked out ${asset.name} (${asset.assetTag})`,
      expectedReturnDate
    });
    
    res.status(200).json({ success: true, data: checkout[0] });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Checkout asset error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Return asset
// @route   POST /api/assets/:id/return
// @access  Private
exports.returnAsset = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { returnCondition, notes } = req.body;
    
    const asset = await Asset.findById(req.params.id).session(session);
    
    if (!asset) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    const activeCheckout = await Checkout.findOne({
      assetId: asset._id,
      status: 'active'
    }).session(session);
    
    if (!activeCheckout) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: 'No active checkout found for this asset' 
      });
    }
    
    activeCheckout.actualReturnDate = new Date();
    activeCheckout.returnCondition = returnCondition || 'Good';
    activeCheckout.returnNotes = notes;
    activeCheckout.status = 'returned';
    await activeCheckout.save({ session });
    
    asset.status = 'available';
    await asset.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    await activeCheckout.populate([
      { path: 'checkedOutBy', select: 'name email' },
      { path: 'checkedOutTo', select: 'name email' }
    ]);
    
    // Check if overdue
    const isOverdue = new Date() > new Date(activeCheckout.expectedReturnDate);
    
    // Emit socket event
    const io = req.app.get('io');
    io.emit('asset-returned', { 
      assetId: asset._id, 
      checkoutId: activeCheckout._id,
      isOverdue
    });
    
    res.status(200).json({ 
      success: true, 
      data: activeCheckout,
      isOverdue
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Return asset error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get asset by QR code scan
// @route   GET /api/assets/qr/:qrData
// @access  Private
exports.getAssetByQR = async (req, res) => {
  try {
    const { qrData } = req.params;
    let parsedData;
    
    try {
      parsedData = JSON.parse(decodeURIComponent(qrData));
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid QR code format' });
    }
    
    const asset = await Asset.findOne({ assetTag: parsedData.tag })
      .populate('category', 'name nameAm')
      .populate('department', 'name nameAm code');
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    console.error('Get asset by QR error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Generate QR code for asset
// @route   GET /api/assets/:id/qr
// @access  Private
exports.generateAssetQRCode = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    const qrResult = await generateAssetQR(asset.assetTag, asset.name);
    
    res.status(200).json({
      success: true,
      qrCode: qrResult.dataURL,
      qrSVG: qrResult.svg,
      qrData: qrResult.value
    });
  } catch (error) {
    console.error('Generate QR error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get asset statistics
// @route   GET /api/assets/stats
// @access  Private/Admin/HOD
exports.getAssetStats = async (req, res) => {
  try {
    const query = {};
    
    if (req.user.role === 'hod') {
      query.department = req.user.department;
    }
    
    const stats = await Asset.aggregate([
      { $match: query },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);
    
    const categoryStats = await Asset.aggregate([
      { $match: query },
      { $lookup: {
        from: 'assetcategories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryInfo'
      }},
      { $unwind: '$categoryInfo' },
      { $group: {
        _id: '$categoryInfo.name',
        count: { $sum: 1 }
      }}
    ]);
    
    const departmentStats = await Asset.aggregate([
      { $match: query },
      { $lookup: {
        from: 'departments',
        localField: 'department',
        foreignField: '_id',
        as: 'deptInfo'
      }},
      { $unwind: '$deptInfo' },
      { $group: {
        _id: '$deptInfo.name',
        count: { $sum: 1 }
      }}
    ]);
    
    const totalValue = await Asset.aggregate([
      { $match: query },
      { $group: {
        _id: null,
        total: { $sum: '$purchasePrice' }
      }}
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        status: stats,
        categories: categoryStats,
        departments: departmentStats,
        totalValue: totalValue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get asset stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
