const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  role: {
    type: String,
    enum: ['admin', 'lender', 'customer'],
    default: 'customer',
  },
  userType: {
    type: String,
    enum: ['individual', 'company'],
    default: 'individual',
  },
  netWorth: {
    type: Number,
    default: 0,
  },
  idNumber: {
    type: String,
    trim: true,
    default: '', // Allow empty strings
  },
  licenseNumber: {
    type: String,
    trim: true,
    default: '', // Allow empty strings
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Log validation errors
userSchema.post('save', function (error, doc, next) {
  if (error.name === 'ValidationError') {
    console.error('User validation error:', error.errors);
  }
  next(error);
});

module.exports = mongoose.model('User', userSchema);