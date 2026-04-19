
const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  assetTag: { 
    type: String, 
    required: [true, 'Asset tag is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: { 
    type: String, 
    required: [true, 'Asset name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  description: { 
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AssetCategory',
    required: [true, 'Category is required']
  },
  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department',
    required: [true, 'Department is required']
  },
  location: { 
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  status: { 
    type: String, 
    enum: ['available', 'checked-out', 'maintenance', 'retired'],
    default: 'available',
    required: true
  },
  purchaseDate: { 
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v <= new Date();
      },
      message: 'Purchase date cannot be in the future'
    }
  },
  purchasePrice: { 
    type: Number,
    min: [0, 'Purchase price cannot be negative']
  },
  currentValue: { 
    type: Number,
    min: [0, 'Current value cannot be negative']
  },
  serialNumber: { 
    type: String,
    uppercase: true,
    trim: true,
    sparse: true
  },
  manufacturer: { 
    type: String,
    trim: true
  },
  model: { 
    type: String,
    trim: true
  },
  warrantyExpiry: { 
    type: Date
  },
  qrCode: { 
    type: String // URL to QR code image
  },
  qrCodeData: { 
    type: String // The data encoded in QR
  },
  images: [{
    type: String,
    url: String,
    caption: String
  }],
  notes: { 
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate current value based on depreciation
assetSchema.pre('save', function(next) {
  if (this.isModified('purchasePrice') || this.isModified('purchaseDate')) {
    if (this.purchasePrice && this.purchaseDate) {
      const yearsOld = (new Date() - this.purchaseDate) / (1000 * 60 * 60 * 24 * 365);
      const depreciationRate = 0.15; // 15% annual depreciation
      this.currentValue = this.purchasePrice * Math.pow(1 - depreciationRate, yearsOld);
      this.currentValue = Math.max(0, this.currentValue);
    }
  }
  next();
});

// Update timestamps
assetSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Virtual for age in years
assetSchema.virtual('ageYears').get(function() {
  if (!this.purchaseDate) return null;
  const age = (new Date() - this.purchaseDate) / (1000 * 60 * 60 * 24 * 365);
  return Math.round(age * 10) / 10;
});

// Virtual for warranty status
assetSchema.virtual('warrantyStatus').get(function() {
  if (!this.warrantyExpiry) return 'No warranty';
  return this.warrantyExpiry > new Date() ? 'Active' : 'Expired';
});

// Virtual for depreciation percentage
assetSchema.virtual('depreciationPercentage').get(function() {
  if (!this.purchasePrice || !this.currentValue) return null;
  return ((this.purchasePrice - this.currentValue) / this.purchasePrice * 100).toFixed(1);
});

// Indexes
assetSchema.index({ assetTag: 1 });
assetSchema.index({ name: 'text' });
assetSchema.index({ category: 1 });
assetSchema.index({ department: 1 });
assetSchema.index({ status: 1 });
assetSchema.index({ location: 1 });

module.exports = mongoose.model('Asset', assetSchema);