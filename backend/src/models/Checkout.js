
const mongoose = require('mongoose');

const checkoutSchema = new mongoose.Schema({
  assetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Asset', 
    required: true 
  },
  checkedOutBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  checkedOutTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  expectedReturnDate: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(v) {
        return v > this.createdAt;
      },
      message: 'Expected return date must be after checkout date'
    }
  },
  actualReturnDate: Date,
  status: { 
    type: String, 
    enum: ['active', 'returned', 'overdue', 'extended'],
    default: 'active'
  },
  condition: { 
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  returnCondition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor']
  },
  purpose: String,
  notes: String,
  returnNotes: String,
  extendedCount: {
    type: Number,
    default: 0
  },
  extendedUntil: Date,
  fine: {
    type: Number,
    default: 0
  },
  finePaid: {
    type: Boolean,
    default: false
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

// Check for overdue
checkoutSchema.virtual('isOverdue').get(function() {
  if (this.status !== 'active') return false;
  return new Date() > this.expectedReturnDate;
});

// Calculate overdue days
checkoutSchema.virtual('overdueDays').get(function() {
  if (!this.isOverdue) return 0;
  const days = Math.ceil((new Date() - this.expectedReturnDate) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
});

// Calculate fine amount
checkoutSchema.virtual('fineAmount').get(function() {
  if (!this.isOverdue) return 0;
  const ratePerDay = 10; // 10 Birr per day
  return this.overdueDays * ratePerDay;
});

// Indexes
checkoutSchema.index({ assetId: 1, status: 1 });
checkoutSchema.index({ checkedOutBy: 1 });
checkoutSchema.index({ checkedOutTo: 1 });
checkoutSchema.index({ expectedReturnDate: 1 });
checkoutSchema.index({ status: 1 });

module.exports = mongoose.model('Checkout', checkoutSchema);