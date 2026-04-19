
const mongoose = require('mongoose');

const assetCategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  nameAm: { 
    type: String,
    trim: true
  },
  code: { 
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },
  parentCategory: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AssetCategory',
    default: null
  },
  description: { 
    type: String,
    trim: true
  },
  depreciationRate: { 
    type: Number,
    default: 0,
    min: [0, 'Depreciation rate cannot be negative'],
    max: [100, 'Depreciation rate cannot exceed 100%']
  },
  expectedLifespan: { 
    type: Number, // in years
    min: [0, 'Expected lifespan cannot be negative']
  },
  icon: { 
    type: String 
  },
  color: { 
    type: String,
    default: '#3b82f6'
  },
  isActive: { 
    type: Boolean, 
    default: true 
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
  timestamps: true
});

// Generate code before saving
assetCategorySchema.pre('save', async function(next) {
  if (!this.code && this.name) {
    this.code = this.name.substring(0, 3).toUpperCase();
    
    // Check if code exists and make unique
    let existing = await mongoose.model('AssetCategory').findOne({ code: this.code });
    let counter = 1;
    while (existing && existing._id.toString() !== this._id?.toString()) {
      this.code = `${this.name.substring(0, 3).toUpperCase()}${counter}`;
      existing = await mongoose.model('AssetCategory').findOne({ code: this.code });
      counter++;
    }
  }
  next();
});

// Virtual for full path
assetCategorySchema.virtual('fullPath').get(async function() {
  const path = [this.name];
  let current = this;
  while (current.parentCategory) {
    const parent = await mongoose.model('AssetCategory').findById(current.parentCategory);
    if (parent) {
      path.unshift(parent.name);
      current = parent;
    } else {
      break;
    }
  }
  return path.join(' > ');
});

// Indexes
assetCategorySchema.index({ name: 1 });
assetCategorySchema.index({ code: 1 });
assetCategorySchema.index({ parentCategory: 1 });

module.exports = mongoose.model('AssetCategory', assetCategorySchema);