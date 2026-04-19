
const mongoose = require('mongoose');

const requisitionItemSchema = new mongoose.Schema({
  inventoryItemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'InventoryItem' 
  },
  name: { 
    type: String, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: [1, 'Quantity must be at least 1']
  },
  unit: String,
  unitPrice: Number,
  estimatedPrice: { 
    type: Number,
    default: 0,
    min: 0
  },
  actualPrice: Number,
  notes: String
});

const approvalSchema = new mongoose.Schema({
  approverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  role: { 
    type: String, 
    enum: ['hod', 'finance', 'admin'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['approved', 'rejected', 'pending'],
    default: 'pending'
  },
  comments: String,
  date: { 
    type: Date, 
    default: Date.now 
  }
});

const requisitionSchema = new mongoose.Schema({
  requisitionNumber: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  requester: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department',
    required: true
  },
  items: [requisitionItemSchema],
  totalEstimatedPrice: { 
    type: Number, 
    default: 0,
    min: 0
  },
  totalActualPrice: { 
    type: Number,
    default: 0
  },
  purpose: { 
    type: String, 
    required: true,
    maxlength: [500, 'Purpose cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'hod-approved', 'finance-approved', 'purchased', 'delivered', 'rejected', 'cancelled'],
    default: 'draft'
  },
  approvals: [approvalSchema],
  purchaseOrderNumber: String,
  supplier: String,
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  receivedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  notes: String,
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

// Calculate total price before saving
requisitionSchema.pre('save', function(next) {
  this.totalEstimatedPrice = this.items.reduce((sum, item) => 
    sum + (item.estimatedPrice || 0) * item.quantity, 0
  );
  this.totalActualPrice = this.items.reduce((sum, item) => 
    sum + (item.actualPrice || 0) * item.quantity, 0
  );
  next();
});

// Generate requisition number
requisitionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Requisition').countDocuments();
    this.requisitionNumber = `REQ-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Check if all required approvals are done
requisitionSchema.virtual('isFullyApproved').get(function() {
  const requiredApprovals = ['hod', 'finance'];
  const approvals = this.approvals.filter(a => a.status === 'approved');
  return requiredApprovals.every(role => 
    approvals.some(a => a.role === role)
  );
});

// Virtual for pending approvals
requisitionSchema.virtual('pendingApprovals').get(function() {
  const requiredApprovals = ['hod', 'finance'];
  const approvals = this.approvals.filter(a => a.status === 'approved');
  return requiredApprovals.filter(role => 
    !approvals.some(a => a.role === role)
  );
});

// Virtual for status display
requisitionSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    draft: 'Draft',
    submitted: 'Submitted for Approval',
    'hod-approved': 'HOD Approved',
    'finance-approved': 'Finance Approved',
    purchased: 'Purchased',
    delivered: 'Delivered',
    rejected: 'Rejected',
    cancelled: 'Cancelled'
  };
  return statusMap[this.status] || this.status;
});

// Indexes
requisitionSchema.index({ requisitionNumber: 1 });
requisitionSchema.index({ requester: 1 });
requisitionSchema.index({ department: 1 });
requisitionSchema.index({ status: 1 });
requisitionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Requisition', requisitionSchema);