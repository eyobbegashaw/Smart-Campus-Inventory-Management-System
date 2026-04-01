const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Asset = require('../models/Asset');
const ServiceRequest = require('../models/ServiceRequest');
const InventoryItem = require('../models/InventoryItem');
const Book = require('../models/Book');
const User = require('../models/User');
const Checkout = require('../models/Checkout');
const moment = require('moment');



// @desc    Generate asset report
// @route   GET /api/reports/assets
// @access  Private/Admin
exports.generateAssetReport = async (req, res) => {
  try {
    const { format = 'pdf', startDate, endDate, department } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (department) query.department = department;
    
    const assets = await Asset.find(query)
      .populate('category', 'name')
      .populate('department', 'name')
      .sort({ createdAt: -1 });
    
    const stats = {
      total: assets.length,
      available: assets.filter(a => a.status === 'available').length,
      checkedOut: assets.filter(a => a.status === 'checked-out').length,
      maintenance: assets.filter(a => a.status === 'maintenance').length,
      totalValue: assets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0)
    };
    
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Assets Report');
      
      // Add summary section
      worksheet.addRow(['ASSET REPORT SUMMARY']);
      worksheet.addRow(['Generated:', new Date().toLocaleString()]);
      worksheet.addRow(['Total Assets:', stats.total]);
      worksheet.addRow(['Available:', stats.available]);
      worksheet.addRow(['Checked Out:', stats.checkedOut]);
      worksheet.addRow(['Maintenance:', stats.maintenance]);
      worksheet.addRow(['Total Value:', `ETB ${stats.totalValue.toLocaleString()}`]);
      worksheet.addRow([]);
      
      // Add headers
      worksheet.addRow(['Asset Tag', 'Name', 'Category', 'Department', 'Location', 'Status', 'Purchase Date', 'Purchase Price']);
      
      // Add data
      assets.forEach(asset => {
        worksheet.addRow([
          asset.assetTag,
          asset.name,
          asset.category?.name || 'N/A',
          asset.department?.name || 'N/A',
          asset.location || 'N/A',
          asset.status,
          asset.purchaseDate ? moment(asset.purchaseDate).format('YYYY-MM-DD') : 'N/A',
          asset.purchasePrice ? `ETB ${asset.purchasePrice.toLocaleString()}` : 'N/A'
        ]);
      });
      
      // Style the worksheet
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(8).font = { bold: true };
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=asset-report-${Date.now()}.xlsx`);
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // Generate PDF
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=asset-report-${Date.now()}.pdf`);
      
      doc.pipe(res);
      
      // Header
      doc.fontSize(20).text('Asset Report', { align: 'center' });
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      
      // Summary
      doc.fontSize(14).text('Summary', { underline: true });
      doc.fontSize(10);
      doc.text(`Total Assets: ${stats.total}`);
      doc.text(`Available: ${stats.available}`);
      doc.text(`Checked Out: ${stats.checkedOut}`);
      doc.text(`Maintenance: ${stats.maintenance}`);
      doc.text(`Total Value: ETB ${stats.totalValue.toLocaleString()}`);
      doc.moveDown();
      
      // Asset List
      doc.fontSize(14).text('Asset List', { underline: true });
      doc.fontSize(8);
      
      const tableTop = doc.y;
      let y = tableTop;
      
      // Table headers
      doc.text('Asset Tag', 50, y);
      doc.text('Name', 150, y);
      doc.text('Status', 300, y);
      doc.text('Location', 400, y);
      y += 20;
      
      // Table rows
      assets.forEach(asset => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        doc.text(asset.assetTag, 50, y);
        doc.text(asset.name.substring(0, 30), 150, y);
        doc.text(asset.status, 300, y);
        doc.text(asset.location || 'N/A', 400, y);
        y += 20;
      });
      
      doc.end();
    }
  } catch (error) {
    console.error('Generate asset report error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Generate request report
// @route   GET /api/reports/requests
// @access  Private/Admin/HOD
exports.generateRequestReport = async (req, res) => {
  try {
    const { format = 'pdf', startDate, endDate, department, status } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (department) query.department = department;
    if (status) query.status = status;
    
    const requests = await ServiceRequest.find(query)
      .populate('requester', 'name email')
      .populate('department', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });
    
    const stats = {
      total: requests.length,
      byStatus: {},
      avgCompletionTime: null
    };
    
    requests.forEach(req => {
      stats.byStatus[req.status] = (stats.byStatus[req.status] || 0) + 1;
    });
    
    const completedRequests = requests.filter(r => r.status === 'completed' && r.completedAt);
    if (completedRequests.length > 0) {
      const totalTime = completedRequests.reduce((sum, r) => 
        sum + (new Date(r.completedAt) - new Date(r.createdAt)), 0);
      stats.avgCompletionTime = totalTime / completedRequests.length / (1000 * 60 * 60 * 24);
    }
    
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Requests Report');
      
      worksheet.addRow(['SERVICE REQUEST REPORT']);
      worksheet.addRow(['Generated:', new Date().toLocaleString()]);
      worksheet.addRow(['Total Requests:', stats.total]);
      worksheet.addRow(['Average Completion Time:', stats.avgCompletionTime ? `${stats.avgCompletionTime.toFixed(1)} days` : 'N/A']);
      worksheet.addRow([]);
      
      worksheet.addRow(['Status', 'Count']);
      Object.entries(stats.byStatus).forEach(([status, count]) => {
        worksheet.addRow([status, count]);
      });
      worksheet.addRow([]);
      
      worksheet.addRow(['Request #', 'Title', 'Requester', 'Department', 'Status', 'Priority', 'Created', 'Completed']);
      
      requests.forEach(req => {
        worksheet.addRow([
          req.requestNumber,
          req.title,
          req.requester?.name || 'N/A',
          req.department?.name || 'N/A',
          req.status,
          req.priority,
          moment(req.createdAt).format('YYYY-MM-DD'),
          req.completedAt ? moment(req.completedAt).format('YYYY-MM-DD') : 'Pending'
        ]);
      });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=request-report-${Date.now()}.xlsx`);
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=request-report-${Date.now()}.pdf`);
      
      doc.pipe(res);
      
      doc.fontSize(20).text('Service Request Report', { align: 'center' });
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(14).text('Summary', { underline: true });
      doc.fontSize(10);
      doc.text(`Total Requests: ${stats.total}`);
      doc.text(`Average Completion Time: ${stats.avgCompletionTime ? `${stats.avgCompletionTime.toFixed(1)} days` : 'N/A'}`);
      doc.moveDown();
      
      doc.fontSize(12).text('Requests by Status:');
      Object.entries(stats.byStatus).forEach(([status, count]) => {
        doc.text(`  ${status}: ${count}`);
      });
      doc.moveDown();
      
      doc.fontSize(14).text('Recent Requests', { underline: true });
      doc.fontSize(8);
      
      let y = doc.y;
      doc.text('Request #', 50, y);
      doc.text('Title', 150, y);
      doc.text('Status', 300, y);
      doc.text('Priority', 400, y);
      y += 20;
      
      requests.slice(0, 30).forEach(req => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        doc.text(req.requestNumber, 50, y);
        doc.text(req.title.substring(0, 40), 150, y);
        doc.text(req.status, 300, y);
        doc.text(req.priority, 400, y);
        y += 20;
      });
      
      doc.end();
    }
  } catch (error) {
    console.error('Generate request report error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Generate inventory report
// @route   GET /api/reports/inventory
// @access  Private/Admin
exports.generateInventoryReport = async (req, res) => {
  try {
    const { format = 'pdf', category } = req.query;
    
    const query = {};
    if (category) query.category = category;
    
    const items = await InventoryItem.find(query).sort({ name: 1 });
    
    const stats = {
      totalItems: items.length,
      totalValue: items.reduce((sum, i) => sum + (i.quantity * (i.unitPrice || 0)), 0),
      lowStockItems: items.filter(i => i.quantity <= i.minimumQuantity).length
    };
    
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Inventory Report');
      
      worksheet.addRow(['INVENTORY REPORT']);
      worksheet.addRow(['Generated:', new Date().toLocaleString()]);
      worksheet.addRow(['Total Items:', stats.totalItems]);
      worksheet.addRow(['Total Value:', `ETB ${stats.totalValue.toLocaleString()}`]);
      worksheet.addRow(['Low Stock Items:', stats.lowStockItems]);
      worksheet.addRow([]);
      
      worksheet.addRow(['Name', 'SKU', 'Category', 'Quantity', 'Unit', 'Min Qty', 'Location', 'Unit Price', 'Total Value']);
      
      items.forEach(item => {
        worksheet.addRow([
          item.name,
          item.sku,
          item.category,
          item.quantity,
          item.unit,
          item.minimumQuantity,
          item.location || 'N/A',
          item.unitPrice ? `ETB ${item.unitPrice}` : 'N/A',
          item.unitPrice ? `ETB ${(item.quantity * item.unitPrice).toLocaleString()}` : 'N/A'
        ]);
      });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=inventory-report-${Date.now()}.xlsx`);
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=inventory-report-${Date.now()}.pdf`);
      
      doc.pipe(res);
      
      doc.fontSize(20).text('Inventory Report', { align: 'center' });
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(14).text('Summary', { underline: true });
      doc.fontSize(10);
      doc.text(`Total Items: ${stats.totalItems}`);
      doc.text(`Total Value: ETB ${stats.totalValue.toLocaleString()}`);
      doc.text(`Low Stock Items: ${stats.lowStockItems}`);
      doc.moveDown();
      
      doc.fontSize(14).text('Low Stock Items', { underline: true });
      doc.fontSize(10);
      
      const lowStockItems = items.filter(i => i.quantity <= i.minimumQuantity);
      if (lowStockItems.length > 0) {
        lowStockItems.forEach(item => {
          doc.text(`${item.name}: ${item.quantity} ${item.unit} (Min: ${item.minimumQuantity})`);
        });
      } else {
        doc.text('No low stock items');
      }
      doc.moveDown();
      
      doc.fontSize(14).text('Inventory List', { underline: true });
      doc.fontSize(8);
      
      let y = doc.y;
      doc.text('Name', 50, y);
      doc.text('SKU', 200, y);
      doc.text('Qty', 300, y);
      doc.text('Unit', 350, y);
      y += 20;
      
      items.slice(0, 50).forEach(item => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        doc.text(item.name.substring(0, 30), 50, y);
        doc.text(item.sku, 200, y);
        doc.text(item.quantity.toString(), 300, y);
        doc.text(item.unit, 350, y);
        y += 20;
      });
      
      doc.end();
    }
  } catch (error) {
    console.error('Generate inventory report error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard-stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    let stats = {};
    
    // Asset stats
    const assetQuery = {};
    if (req.user.role === 'hod') {
      assetQuery.department = req.user.department;
    }
    
    const assets = await Asset.find(assetQuery);
    stats.assets = {
      total: assets.length,
      available: assets.filter(a => a.status === 'available').length,
      checkedOut: assets.filter(a => a.status === 'checked-out').length,
      maintenance: assets.filter(a => a.status === 'maintenance').length
    };
    
    // Request stats
    const requestQuery = {};
    if (req.user.role === 'hod') {
      requestQuery.department = req.user.department;
    } else if (req.user.role === 'student') {
      requestQuery.requester = req.user.id;
    } else if (req.user.role === 'staff') {
      requestQuery.assignedTo = req.user.id;
    }
    
    const requests = await ServiceRequest.find(requestQuery);
    stats.requests = {
      total: requests.length,
      submitted: requests.filter(r => r.status === 'submitted').length,
      inProgress: requests.filter(r => ['reviewing', 'approved', 'in-progress'].includes(r.status)).length,
      completed: requests.filter(r => r.status === 'completed').length,
      active: requests.filter(r => !['completed', 'rejected'].includes(r.status)).length
    };
    
    // Inventory stats (admin only)
    if (req.user.role === 'admin') {
      const inventory = await InventoryItem.find();
      stats.inventory = {
        totalItems: inventory.length,
        lowStockCount: inventory.filter(i => i.quantity <= i.minimumQuantity).length,
        totalValue: inventory.reduce((sum, i) => sum + (i.quantity * (i.unitPrice || 0)), 0)
      };
      
      // User stats
      const users = await User.find();
      stats.users = {
        total: users.length,
        students: users.filter(u => u.role === 'student').length,
        staff: users.filter(u => u.role === 'staff').length,
        hod: users.filter(u => u.role === 'hod').length,
        admin: users.filter(u => u.role === 'admin').length
      };
      
      // Library stats
      const books = await Book.find();
      stats.library = {
        totalBooks: books.length,
        totalCopies: books.reduce((sum, b) => sum + b.totalCopies, 0),
        availableCopies: books.reduce((sum, b) => sum + b.availableCopies, 0)
      };
    }
    
    // Recent activity
    const recentCheckouts = await Checkout.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('assetId', 'name assetTag')
      .populate('checkedOutBy', 'name');
    
    const recentRequests = await ServiceRequest.find(requestQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('requester', 'name');
    
    stats.recentActivities = [
      ...recentCheckouts.map(c => ({
        type: 'checkout',
        description: `${c.checkedOutBy?.name} checked out ${c.assetId?.name}`,
        timestamp: c.createdAt
      })),
      ...recentRequests.map(r => ({
        type: 'request',
        description: `${r.requester?.name} submitted request: ${r.title}`,
        timestamp: r.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    
    // Monthly request trends
    const monthlyRequests = await ServiceRequest.aggregate([
      { $match: requestQuery },
      { $group: {
        _id: { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);
    
    stats.monthlyRequests = monthlyRequests.map(m => ({
      month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
      count: m.count
    })).reverse();
    
    // Low stock items (admin only)
    if (req.user.role === 'admin') {
      stats.lowStockItems = await InventoryItem.find({
        $expr: { $lte: ['$quantity', '$minimumQuantity'] }
      }).limit(5);
    }
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Export data to CSV
// @route   GET /api/reports/export/:type
// @access  Private/Admin
exports.exportToCSV = async (req, res) => {
  try {
    const { type } = req.params;
    let data = [];
    let filename = '';
    let headers = [];
    
    switch (type) {
      case 'assets':
        data = await Asset.find().populate('category', 'name').populate('department', 'name');
        filename = 'assets-export.csv';
        headers = ['Asset Tag', 'Name', 'Category', 'Department', 'Location', 'Status', 'Purchase Date', 'Purchase Price'];
        break;
      case 'requests':
        data = await ServiceRequest.find().populate('requester', 'name').populate('department', 'name');
        filename = 'requests-export.csv';
        headers = ['Request #', 'Title', 'Requester', 'Department', 'Status', 'Priority', 'Created Date'];
        break;
      case 'users':
        data = await User.find().populate('department', 'name');
        filename = 'users-export.csv';
        headers = ['Name', 'Email', 'Role', 'Department', 'Phone', 'Status'];
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid export type' });
    }
    
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(item => {
      const row = [];
      if (type === 'assets') {
        row.push(`"${item.assetTag}"`);
        row.push(`"${item.name}"`);
        row.push(`"${item.category?.name || ''}"`);
        row.push(`"${item.department?.name || ''}"`);
        row.push(`"${item.location || ''}"`);
        row.push(`"${item.status}"`);
        row.push(`"${item.purchaseDate ? moment(item.purchaseDate).format('YYYY-MM-DD') : ''}"`);
        row.push(`"${item.purchasePrice || ''}"`);
      } else if (type === 'requests') {
        row.push(`"${item.requestNumber}"`);
        row.push(`"${item.title}"`);
        row.push(`"${item.requester?.name || ''}"`);
        row.push(`"${item.department?.name || ''}"`);
        row.push(`"${item.status}"`);
        row.push(`"${item.priority}"`);
        row.push(`"${moment(item.createdAt).format('YYYY-MM-DD')}"`);
      } else if (type === 'users') {
        row.push(`"${item.name}"`);
        row.push(`"${item.email}"`);
        row.push(`"${item.role}"`);
        row.push(`"${item.department?.name || ''}"`);
        row.push(`"${item.phone || ''}"`);
        row.push(`"${item.isActive ? 'Active' : 'Inactive'}"`);
      }
      csvContent += row.join(',') + '\n';
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export to CSV error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
