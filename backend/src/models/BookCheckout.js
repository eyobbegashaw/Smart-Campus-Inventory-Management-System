
const mongoose = require('mongoose');

const bookCheckoutSchema = new mongoose.Schema({
  bookId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Book', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  checkoutDate: { 
    type: Date, 
    default: Date.now 
  },
  dueDate: { 
    type: Date, 
    required: true 
  },
  returnDate: Date,
  status: { 
    type: String, 
    enum: ['checked-out', 'returned', 'overdue', 'lost'],
    default: 'checked-out' 
  },
  fine: { 
    type: Number, 
    default: 0 
  },
  finePaid: {
    type: Boolean,
    default: false
  },
  renewed: {
    type: Boolean,
    default: false
  },
  renewedCount: {
    type: Number,
    default: 0
  },
  notes: String,
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
bookCheckoutSchema.virtual('isOverdue').get(function() {
  if (this.status !== 'checked-out') return false;
  return new Date() > this.dueDate;
});

// Calculate overdue days
bookCheckoutSchema.virtual('overdueDays').get(function() {
  if (!this.isOverdue) return 0;
  const days = Math.ceil((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
});

// Indexes
bookCheckoutSchema.index({ bookId: 1, userId: 1 });
bookCheckoutSchema.index({ userId: 1 });
bookCheckoutSchema.index({ dueDate: 1 });
bookCheckoutSchema.index({ status: 1 });

module.exports = mongoose.model('BookCheckout', bookCheckoutSchema);