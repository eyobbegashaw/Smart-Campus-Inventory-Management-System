const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  nameAm: { 
    type: String,
    trim: true
  },
  category: { 
    type: String, 
    enum: ['Stationery', 'Cleaning', 'Lab Supplies', 'Cafe Supplies', 'Maintenance', 'IT Supplies', 'Other'],
    required: [true, 'Category is required']
  },
  sku: { 
    type: String, 
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  barcode: { 
    type: String,
    sparse: true
  },
  quantity: { 
    type: Number, 
    required: true, 
    default: 0,
    min: [0, 'Quantity cannot be negative']
  },
  unit: { 
    type: String, 
    required: [true, 'Unit of measurement is required'],
    enum: ['pieces', 'liters', 'kg', 'boxes', 'packs', 'rolls', 'bottles', 'sheets']
  },
  minimumQuantity: { 
    type: Number, 
    required: true, 
    default: 10,
    min: [0, 'Minimum quantity cannot be negative']
  },
  maximumQuantity: { 
    type: Number,
    min: [0, 'Maximum quantity cannot be negative']
  },
  reorderQuantity: { 
    type: Number,
    min: [0, 'Reorder quantity cannot be negative']
  },
  location: { 
    type: String,
    trim: true
  },
  shelf: { 
    type: String,
    trim: true
  },
  supplier: { 
    type: String,
    trim: true
  },
  supplierContact: { 
    type: String,
    trim: true
  },
  unitPrice: { 
    type: Number,
    min: [0, 'Unit price cannot be negative']
  },
  lastRestocked: { 
    type: Date 
  },
  lastRestockedQuantity: { 
    type: Number 
  },
  notes: { 
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isActive: { 
    type: Boolean, 
    default: true 
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

// Check for low stock
inventoryItemSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.minimumQuantity;
});

// Check for critical stock (0)
inventoryItemSchema.virtual('isCriticalStock').get(function() {
  return this.quantity === 0;
});

// Calculate total value
inventoryItemSchema.virtual('totalValue').get(function() {
  return this.quantity * (this.unitPrice || 0);
});

// Calculate days until restock needed (based on average daily usage - would need historical data)
inventoryItemSchema.virtual('daysUntilRestock').get(function() {
  if (!this.reorderQuantity) return null;
  const remaining = this.quantity - this.minimumQuantity;
  return remaining > 0 ? Math.floor(remaining / (this.averageDailyUsage || 1)) : 0;
});

// Indexes
inventoryItemSchema.index({ name: 'text' });
inventoryItemSchema.index({ sku: 1 });
inventoryItemSchema.index({ category: 1 });
inventoryItemSchema.index({ quantity: 1 });
inventoryItemSchema.index({ minimumQuantity: 1 });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
