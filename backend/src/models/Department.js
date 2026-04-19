
const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Department name is required'],
    unique: true,
    trim: true
  },
  nameAm: { 
    type: String,
    trim: true
  },
  code: { 
    type: String, 
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  hod: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  building: { 
    type: String,
    trim: true
  },
  floor: { 
    type: String,
    trim: true
  },
  room: String,
  email: String,
  phone: String,
  budget: {
    annual: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 }
  },
  description: String,
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name with code
departmentSchema.virtual('fullName').get(function() {
  return `${this.name} (${this.code})`;
});

// Virtual for Amharic display
departmentSchema.virtual('displayName').get(function() {
  return this.nameAm || this.name;
});

// Indexes
departmentSchema.index({ name: 1 });
departmentSchema.index({ code: 1 });
departmentSchema.index({ hod: 1 });

module.exports = mongoose.model('Department', departmentSchema);