const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  employeeId: { 
    type: String, 
    unique: true, 
    sparse: true,
    uppercase: true,
    trim: true,
    default: undefined,
    set: (v) => (v === '' || v === null ? undefined : v)
  },
  studentId: { 
    type: String, 
    unique: true, 
    sparse: true,
    uppercase: true,
    trim: true,
    default: undefined,
    set: (v) => (v === '' || v === null ? undefined : v)
  },
  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department',
    required: function() {
      return this.role !== 'admin';
    }
  },
  role: { 
    type: String, 
    enum: ['admin', 'hod', 'staff', 'student'], 
    required: true,
    default: 'student'
  },
  phone: { 
    type: String,
    match: [/^[0-9]{9,10}$/, 'Please enter a valid phone number'],
    default: undefined,
    set: (v) => (v === '' || v === null ? undefined : v)
  },
  avatar: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  lastLoginIP: { type: String },
  refreshToken: { type: String, select: false },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    language: { type: String, enum: ['en', 'am'], default: 'en' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- MIDDLEWARE ---

// Hash password before saving
userSchema.pre('save', async function(next) { // <--- እቺ 'next' እዚህ መኖሯን አረጋግጥ
  if (!this.isModified('password')) {
    return next(); // <--- እዚህ ጋር next() መጥራት አለበት
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next(); // <--- ስራው ሲያልቅ next() መጥራት አለበት
  } catch (error) {
    next(error); // <--- ስህተት ካለ ለሚቀጥለው ፋንክሽን አስተላልፈው
  }
});
// Update timestamps on update operations
userSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// --- METHODS ---

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.getEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  return verificationToken;
};

// --- VIRTUALS ---

userSchema.virtual('fullName').get(function() { return this.name; });

userSchema.virtual('roleDisplay').get(function() {
  const roleNames = { admin: 'Administrator', hod: 'Department Head', staff: 'Staff Member', student: 'Student' };
  return roleNames[this.role] || this.role;
});

userSchema.virtual('displayId').get(function() {
  if (this.role === 'student') return this.studentId;
  if (this.role === 'staff' || this.role === 'hod') return this.employeeId;
  return null;
});

// --- INDEXES ---
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 }, { sparse: true });
userSchema.index({ studentId: 1 }, { sparse: true });
userSchema.index({ department: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
