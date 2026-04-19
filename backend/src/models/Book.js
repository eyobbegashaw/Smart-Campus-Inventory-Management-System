
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  isbn: { 
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true,
    index: true
  },
  titleAm: { 
    type: String,
    trim: true
  },
  subtitle: String,
  author: { 
    type: String, 
    required: [true, 'Author is required'],
    trim: true
  },
  publisher: String,
  publishYear: {
    type: Number,
    min: [1000, 'Invalid year'],
    max: [new Date().getFullYear(), 'Year cannot be in the future']
  },
  edition: String,
  category: { 
    type: String,
    required: true,
    enum: ['Textbook', 'Reference', 'Fiction', 'Non-Fiction', 'Journal', 'Magazine', 'Other']
  },
  subCategory: String,
  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department',
    required: function() {
      return this.category === 'Textbook';
    }
  },
  location: { 
    type: String,
    trim: true
  },
  shelf: String,
  rack: String,
  totalCopies: { 
    type: Number, 
    required: true,
    default: 1,
    min: [0, 'Total copies cannot be negative']
  },
  availableCopies: { 
    type: Number,
    default: 0,
    min: 0
  },
  borrowedCopies: {
    type: Number,
    default: 0
  },
  reservedCopies: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    enum: ['en', 'am', 'other'],
    default: 'en'
  },
  pages: Number,
  description: String,
  coverImage: String,
  tags: [String],
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

// Update available copies before save
bookSchema.pre('save', function(next) {
  this.availableCopies = this.totalCopies - this.borrowedCopies - this.reservedCopies;
  if (this.availableCopies < 0) this.availableCopies = 0;
  next();
});

// Virtual for availability status
bookSchema.virtual('availabilityStatus').get(function() {
  if (this.availableCopies === 0) return 'Unavailable';
  if (this.availableCopies <= this.totalCopies * 0.2) return 'Low Stock';
  return 'Available';
});

// Virtual for availability color
bookSchema.virtual('availabilityColor').get(function() {
  const colors = {
    'Available': 'green',
    'Low Stock': 'orange',
    'Unavailable': 'red'
  };
  return colors[this.availabilityStatus] || 'gray';
});

// Indexes
bookSchema.index({ title: 'text', author: 'text', isbn: 1 });
bookSchema.index({ category: 1 });
bookSchema.index({ department: 1 });
bookSchema.index({ availableCopies: 1 });

module.exports = mongoose.model('Book', bookSchema);