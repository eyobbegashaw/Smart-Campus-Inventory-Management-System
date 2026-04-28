const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  text: { 
    type: String, 
    required: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  attachments: [{
    type: String,
    url: String,
    filename: String
  }],
  isInternal: { 
    type: Boolean, 
    default: false // Internal notes visible only to staff
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const serviceRequestSchema = new mongoose.Schema({
  requestNumber: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  requester: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department' 
  },
  location: { 
    type: String, 
    required: [true, 'Location is required'],
    trim: true
  },
  building: { 
    type: String,
    trim: true
  },
  room: { 
    type: String,
    trim: true
  },
  category: { 
    type: String, 
    enum: ['Maintenance', 'IT Support', 'Cleaning', 'Furniture', 'Electrical', 'Plumbing', 'HVAC', 'Security', 'Other'],
    required: [true, 'Category is required']
  },
  subCategory: { 
    type: String,
    trim: true
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['submitted', 'reviewing', 'approved', 'in-progress', 'completed', 'rejected', 'cancelled'],
    default: 'submitted'
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  assignedTeam: { 
    type: String,
    trim: true
  },
  photos: [{
    type: String,
    url: String,
    filename: String,
    uploadedAt: Date
  }],
  comments: [commentSchema],
  resolution: {
    type: String,
    maxlength: [1000, 'Resolution cannot exceed 1000 characters']
  },
  resolvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  completedAt: Date,
  estimatedCompletionDate: Date,
  timeSpent: { 
    type: Number, // in minutes
    default: 0
  },
  cost: { 
    type: Number,
    min: 0
  },
  attachments: [{
    type: String,
    url: String,
    filename: String
  }],
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

// Generate request number before saving
serviceRequestSchema.pre('save', async function(next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('ServiceRequest').countDocuments();
    this.requestNumber = `SR-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Update timestamps
serviceRequestSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Virtual for time to resolution
serviceRequestSchema.virtual('resolutionTime').get(function() {
  if (!this.completedAt) return null;
  const timeMs = this.completedAt - this.createdAt;
  const hours = Math.floor(timeMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  return { days, hours: hours % 24 };
});

// Virtual for is overdue
serviceRequestSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed' || this.status === 'rejected') return false;
  if (!this.estimatedCompletionDate) return false;
  return new Date() > this.estimatedCompletionDate;
});

// Virtual for status color
serviceRequestSchema.virtual('statusColor').get(function() {
  const colors = {
    submitted: 'yellow',
    reviewing: 'blue',
    approved: 'green',
    'in-progress': 'purple',
    completed: 'green',
    rejected: 'red',
    cancelled: 'gray'
  };
  return colors[this.status] || 'gray';
});

// Indexes
serviceRequestSchema.index({ requestNumber: 1 });
serviceRequestSchema.index({ requester: 1 });
serviceRequestSchema.index({ department: 1 });
serviceRequestSchema.index({ assignedTo: 1 });
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ priority: 1 });
serviceRequestSchema.index({ category: 1 });
serviceRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
