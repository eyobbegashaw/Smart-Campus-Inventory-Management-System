const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const moment = require('moment');

/**
 * Generate asset report in PDF format
 * @param {Array} assets - Array of assets
 * @param {Object} options - Report options
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateAssetPDFReport(assets, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      
      // Header
      doc.fontSize(20).text('Asset Inventory Report', { align: 'center' });
      doc.fontSize(10).text(`Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, { align: 'center' });
      doc.moveDown();
      
      // Summary
      doc.fontSize(14).text('Summary', { underline: true });
      doc.fontSize(10);
      
      const stats = {
        total: assets.length,
        available: assets.filter(a => a.status === 'available').length,
        checkedOut: assets.filter(a => a.status === 'checked-out').length,
        maintenance: assets.filter(a => a.status === 'maintenance').length,
        totalValue: assets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0)
      };
      
      doc.text(`Total Assets: ${stats.total}`);
      doc.text(`Available: ${stats.available}`);
      doc.text(`Checked Out: ${stats.checkedOut}`);
      doc.text(`Under Maintenance: ${stats.maintenance}`);
      doc.text(`Total Value: ETB ${stats.totalValue.toLocaleString()}`);
      doc.moveDown();
      
      // Asset List
      doc.fontSize(12).text('Asset List', { underline: true });
      doc.fontSize(8);
      
      // Table headers
      let y = doc.y;
      doc.text('Asset Tag', 50, y);
      doc.text('Name', 150, y);
      doc.text('Category', 250, y);
      doc.text('Status', 350, y);
      doc.text('Location', 450, y);
      y += 20;
      
      // Table rows
      for (const asset of assets) {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        
        doc.text(asset.assetTag, 50, y);
        doc.text(asset.name.substring(0, 30), 150, y);
        doc.text(asset.category?.name || 'N/A', 250, y);
        doc.text(asset.status, 350, y);
        doc.text(asset.location || 'N/A', 450, y);
        y += 20;
      }
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate asset report in Excel format
 * @param {Array} assets - Array of assets
 * @param {Object} options - Report options
 * @returns {Promise<Buffer>} Excel buffer
 */
async function generateAssetExcelReport(assets, options = {}) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Assets Report');
  
  // Add title
  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = 'Asset Inventory Report';
  worksheet.getCell('A1').font = { bold: true, size: 16 };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  
  // Add generation date
  worksheet.mergeCells('A2:H2');
  worksheet.getCell('A2').value = `Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}`;
  worksheet.getCell('A2').alignment = { horizontal: 'center' };
  
  // Summary section
  worksheet.addRow([]);
  worksheet.addRow(['Summary']);
  worksheet.getCell('A4').font = { bold: true };
  
  const stats = {
    total: assets.length,
    available: assets.filter(a => a.status === 'available').length,
    checkedOut: assets.filter(a => a.status === 'checked-out').length,
    maintenance: assets.filter(a => a.status === 'maintenance').length,
    totalValue: assets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0)
  };
  
  worksheet.addRow(['Total Assets', stats.total]);
  worksheet.addRow(['Available', stats.available]);
  worksheet.addRow(['Checked Out', stats.checkedOut]);
  worksheet.addRow(['Under Maintenance', stats.maintenance]);
  worksheet.addRow(['Total Value', `ETB ${stats.totalValue.toLocaleString()}`]);
  worksheet.addRow([]);
  
  // Headers
  const headers = ['Asset Tag', 'Name', 'Category', 'Department', 'Location', 'Status', 'Purchase Date', 'Purchase Price'];
  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell(cell => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  });
  
  // Data rows
  for (const asset of assets) {
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
  }
  
  // Auto-fit columns
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) maxLength = columnLength;
    });
    column.width = Math.min(maxLength + 2, 50);
  });
  
  return await workbook.xlsx.writeBuffer();
}

/**
 * Generate service request report in PDF format
 * @param {Array} requests - Array of requests
 * @param {Object} options - Report options
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateRequestPDFReport(requests, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      
      // Header
      doc.fontSize(20).text('Service Request Report', { align: 'center' });
      doc.fontSize(10).text(`Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, { align: 'center' });
      doc.moveDown();
      
      // Summary
      doc.fontSize(14).text('Summary', { underline: true });
      doc.fontSize(10);
      
      const stats = {
        total: requests.length,
        completed: requests.filter(r => r.status === 'completed').length,
        inProgress: requests.filter(r => ['reviewing', 'approved', 'in-progress'].includes(r.status)).length,
        pending: requests.filter(r => r.status === 'submitted').length,
        avgCompletionTime: null
      };
      
      const completedRequests = requests.filter(r => r.status === 'completed' && r.completedAt);
      if (completedRequests.length > 0) {
        const totalTime = completedRequests.reduce((sum, r) => 
          sum + (new Date(r.completedAt) - new Date(r.createdAt)), 0);
        stats.avgCompletionTime = totalTime / completedRequests.length / (1000 * 60 * 60 * 24);
      }
      
      doc.text(`Total Requests: ${stats.total}`);
      doc.text(`Completed: ${stats.completed}`);
      doc.text(`In Progress: ${stats.inProgress}`);
      doc.text(`Pending: ${stats.pending}`);
      doc.text(`Average Completion Time: ${stats.avgCompletionTime ? `${stats.avgCompletionTime.toFixed(1)} days` : 'N/A'}`);
      doc.moveDown();
      
      // Request List
      doc.fontSize(12).text('Request List', { underline: true });
      doc.fontSize(8);
      
      // Table headers
      let y = doc.y;
      doc.text('Request #', 50, y);
      doc.text('Title', 150, y);
      doc.text('Status', 300, y);
      doc.text('Priority', 380, y);
      doc.text('Created', 450, y);
      y += 20;
      
      // Table rows
      for (const request of requests) {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        
        doc.text(request.requestNumber, 50, y);
        doc.text(request.title.substring(0, 40), 150, y);
        doc.text(request.status, 300, y);
        doc.text(request.priority, 380, y);
        doc.text(moment(request.createdAt).format('YYYY-MM-DD'), 450, y);
        y += 20;
      }
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate inventory report in Excel format
 * @param {Array} items - Array of inventory items
 * @param {Object} options - Report options
 * @returns {Promise<Buffer>} Excel buffer
 */
async function generateInventoryExcelReport(items, options = {}) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Inventory Report');
  
  // Add title
  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = 'Inventory Report';
  worksheet.getCell('A1').font = { bold: true, size: 16 };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  
  // Add generation date
  worksheet.mergeCells('A2:H2');
  worksheet.getCell('A2').value = `Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}`;
  worksheet.getCell('A2').alignment = { horizontal: 'center' };
  
  // Summary section
  worksheet.addRow([]);
  worksheet.addRow(['Summary']);
  worksheet.getCell('A4').font = { bold: true };
  
  const stats = {
    total: items.length,
    totalValue: items.reduce((sum, i) => sum + (i.quantity * (i.unitPrice || 0)), 0),
    lowStock: items.filter(i => i.quantity <= i.minimumQuantity).length
  };
  
  worksheet.addRow(['Total Items', stats.total]);
  worksheet.addRow(['Total Value', `ETB ${stats.totalValue.toLocaleString()}`]);
  worksheet.addRow(['Low Stock Items', stats.lowStock]);
  worksheet.addRow([]);
  
  // Headers
  const headers = ['Name', 'SKU', 'Category', 'Quantity', 'Unit', 'Min Qty', 'Location', 'Unit Price', 'Total Value'];
  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell(cell => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  });
  
  // Data rows
  for (const item of items) {
    const isLowStock = item.quantity <= item.minimumQuantity;
    const row = worksheet.addRow([
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
    
    if (isLowStock) {
      row.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCC' }
        };
      });
    }
  }
  
  // Auto-fit columns
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) maxLength = columnLength;
    });
    column.width = Math.min(maxLength + 2, 50);
  });
  
  return await workbook.xlsx.writeBuffer();
}

/**
 * Generate dashboard statistics report
 * @param {Object} stats - Dashboard statistics
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateDashboardReport(stats) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      
      // Header
      doc.fontSize(20).text('Campus Inventory Dashboard Report', { align: 'center' });
      doc.fontSize(10).text(`Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, { align: 'center' });
      doc.moveDown();
      
      // Assets Section
      doc.fontSize(14).text('Asset Statistics', { underline: true });
      doc.fontSize(10);
      doc.text(`Total Assets: ${stats.assets?.total || 0}`);
      doc.text(`Available: ${stats.assets?.available || 0}`);
      doc.text(`Checked Out: ${stats.assets?.checkedOut || 0}`);
      doc.text(`Under Maintenance: ${stats.assets?.maintenance || 0}`);
      doc.moveDown();
      
      // Requests Section
      doc.fontSize(14).text('Service Request Statistics', { underline: true });
      doc.fontSize(10);
      doc.text(`Total Requests: ${stats.requests?.total || 0}`);
      doc.text(`Completed: ${stats.requests?.completed || 0}`);
      doc.text(`In Progress: ${stats.requests?.inProgress || 0}`);
      doc.text(`Pending: ${stats.requests?.submitted || 0}`);
      doc.moveDown();
      
      // Inventory Section
      if (stats.inventory) {
        doc.fontSize(14).text('Inventory Statistics', { underline: true });
        doc.fontSize(10);
        doc.text(`Total Items: ${stats.inventory.totalItems || 0}`);
        doc.text(`Total Value: ETB ${(stats.inventory.totalValue || 0).toLocaleString()}`);
        doc.text(`Low Stock Items: ${stats.inventory.lowStockCount || 0}`);
        doc.moveDown();
      }
      
      // User Section
      if (stats.users) {
        doc.fontSize(14).text('User Statistics', { underline: true });
        doc.fontSize(10);
        doc.text(`Total Users: ${stats.users.total || 0}`);
        doc.text(`Students: ${stats.users.students || 0}`);
        doc.text(`Staff: ${stats.users.staff || 0}`);
        doc.text(`Department Heads: ${stats.users.hod || 0}`);
        doc.text(`Administrators: ${stats.users.admin || 0}`);
      }
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate monthly report with charts (simplified version)
 * @param {Object} data - Monthly data
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateMonthlyReport(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      
      // Header
      doc.fontSize(20).text(`Monthly Report - ${data.month} ${data.year}`, { align: 'center' });
      doc.fontSize(10).text(`Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, { align: 'center' });
      doc.moveDown();
      
      // Key Metrics
      doc.fontSize(14).text('Key Metrics', { underline: true });
      doc.fontSize(10);
      doc.text(`New Assets Added: ${data.newAssets || 0}`);
      doc.text(`Service Requests Completed: ${data.completedRequests || 0}`);
      doc.text(`Inventory Items Used: ${data.itemsUsed || 0}`);
      doc.text(`New Users Registered: ${data.newUsers || 0}`);
      doc.moveDown();
      
      // Top Categories
      if (data.topCategories && data.topCategories.length > 0) {
        doc.fontSize(14).text('Top Asset Categories', { underline: true });
        doc.fontSize(10);
        data.topCategories.forEach(cat => {
          doc.text(`${cat.name}: ${cat.count} assets`);
        });
        doc.moveDown();
      }
      
      // Popular Books
      if (data.popularBooks && data.popularBooks.length > 0) {
        doc.fontSize(14).text('Most Borrowed Books', { underline: true });
        doc.fontSize(10);
        data.popularBooks.forEach(book => {
          doc.text(`${book.title}: ${book.borrowCount} borrows`);
        });
      }
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateAssetPDFReport,
  generateAssetExcelReport,
  generateRequestPDFReport,
  generateInventoryExcelReport,
  generateDashboardReport,
  generateMonthlyReport
};
