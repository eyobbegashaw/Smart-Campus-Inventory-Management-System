const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Generate QR code for asset
 * @param {string} assetTag - Unique asset tag
 * @param {string} assetName - Name of the asset
 * @param {Object} options - QR code options
 * @returns {Promise<Object>} QR code data URL and SVG
 */
async function generateAssetQR(assetTag, assetName, options = {}) {
  // Data to encode in QR
  const qrData = JSON.stringify({
    type: 'asset',
    tag: assetTag,
    name: assetName,
    timestamp: Date.now(),
    version: '1.0'
  });
  
  const qrOptions = {
    errorCorrectionLevel: options.errorCorrectionLevel || 'H',
    margin: options.margin || 2,
    width: options.width || 300,
    color: {
      dark: options.darkColor || '#000000',
      light: options.lightColor || '#FFFFFF'
    }
  };
  
  // Generate QR code as data URL (PNG)
  const qrCodeDataURL = await QRCode.toDataURL(qrData, qrOptions);
  
  // Generate QR code as SVG for printing
  const qrCodeSVG = await QRCode.toString(qrData, { 
    type: 'svg',
    ...qrOptions
  });
  
  // Generate QR code as terminal string for debugging
  const qrCodeTerminal = await QRCode.toString(qrData, { type: 'terminal' });
  
  // Generate QR code as buffer for file storage
  const qrCodeBuffer = await QRCode.toBuffer(qrData, qrOptions);
  
  return {
    dataURL: qrCodeDataURL,
    svg: qrCodeSVG,
    terminal: qrCodeTerminal,
    buffer: qrCodeBuffer,
    value: qrData
  };
}

/**
 * Generate QR code with logo (for branded QR codes)
 * @param {string} assetTag - Unique asset tag
 * @param {string} assetName - Name of the asset
 * @param {string} logoPath - Path to logo image
 * @returns {Promise<string>} QR code data URL with logo
 */
async function generateAssetQRWithLogo(assetTag, assetName, logoPath) {
  try {
    // Generate QR code first
    const qrResult = await generateAssetQR(assetTag, assetName, { width: 400 });
    
    // Create buffer from data URL
    const base64Data = qrResult.dataURL.replace(/^data:image\/png;base64,/, '');
    const qrBuffer = Buffer.from(base64Data, 'base64');
    
    // Resize logo
    const logoBuffer = await sharp(logoPath)
      .resize(80, 80)
      .toBuffer();
    
    // Composite QR code with logo
    const compositeBuffer = await sharp(qrBuffer)
      .composite([{
        input: logoBuffer,
        gravity: 'center'
      }])
      .toBuffer();
    
    // Convert to base64
    const compositeBase64 = compositeBuffer.toString('base64');
    return `data:image/png;base64,${compositeBase64}`;
  } catch (error) {
    console.error('Error generating QR with logo:', error);
    throw error;
  }
}

/**
 * Generate bulk QR codes for multiple assets
 * @param {Array} assets - Array of assets with tag and name
 * @returns {Promise<Array>} Array of QR code results
 */
async function generateBulkAssetQR(assets) {
  const results = [];
  
  for (const asset of assets) {
    try {
      const qrResult = await generateAssetQR(asset.assetTag, asset.name);
      results.push({
        assetTag: asset.assetTag,
        assetName: asset.name,
        ...qrResult
      });
    } catch (error) {
      console.error(`Error generating QR for ${asset.assetTag}:`, error);
      results.push({
        assetTag: asset.assetTag,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Save QR code to file
 * @param {string} assetTag - Asset tag
 * @param {Buffer} qrBuffer - QR code buffer
 * @returns {Promise<string>} File path
 */
async function saveQRCodeToFile(assetTag, qrBuffer) {
  const dir = './uploads/qrcodes';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const filename = `qr-${assetTag}-${Date.now()}.png`;
  const filepath = path.join(dir, filename);
  
  await fs.promises.writeFile(filepath, qrBuffer);
  
  return `/uploads/qrcodes/${filename}`;
}

/**
 * Validate QR code data
 * @param {string} qrData - QR code data string
 * @returns {Object} Parsed and validated data
 */
function validateQRData(qrData) {
  try {
    let parsed;
    
    // Try to parse as JSON
    try {
      parsed = JSON.parse(qrData);
    } catch (e) {
      // If not JSON, treat as plain asset tag
      return {
        type: 'asset',
        tag: qrData,
        name: null,
        isValid: true
      };
    }
    
    if (parsed.type !== 'asset') {
      throw new Error('Invalid QR code type');
    }
    
    if (!parsed.tag) {
      throw new Error('Invalid asset tag');
    }
    
    return {
      type: parsed.type,
      tag: parsed.tag,
      name: parsed.name,
      timestamp: parsed.timestamp,
      isValid: true
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
}

/**
 * Generate printable QR code sheet for multiple assets
 * @param {Array} assets - Array of assets
 * @returns {Promise<Buffer>} PDF buffer with QR codes
 */
async function generateQRCodeSheet(assets) {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ margin: 30 });
  
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  
  let x = 30;
  let y = 30;
  let col = 0;
  const pageWidth = 595.28; // A4 width in points
  const qrSize = 150;
  const spacing = 20;
  const colsPerRow = Math.floor((pageWidth - 60) / (qrSize + spacing));
  
  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    
    // Generate QR code
    const qrResult = await generateAssetQR(asset.assetTag, asset.name, { width: qrSize });
    
    // Add QR code to PDF
    doc.image(qrResult.buffer, x, y, { width: qrSize });
    
    // Add asset label
    doc.fontSize(8);
    doc.text(asset.assetTag, x, y + qrSize + 5, { width: qrSize, align: 'center' });
    doc.text(asset.name.substring(0, 20), x, y + qrSize + 20, { width: qrSize, align: 'center' });
    
    // Update position
    col++;
    x += qrSize + spacing;
    
    // New row or new page
    if (col >= colsPerRow) {
      x = 30;
      y += qrSize + 50;
      col = 0;
      
      // New page if needed
      if (y > 700) {
        doc.addPage();
        y = 30;
        x = 30;
        col = 0;
      }
    }
  }
  
  doc.end();
  
  return Buffer.concat(buffers);
}

module.exports = {
  generateAssetQR,
  generateAssetQRWithLogo,
  generateBulkAssetQR,
  saveQRCodeToFile,
  validateQRData,
  generateQRCodeSheet
};
