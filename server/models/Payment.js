// backend/models/Payment.js - PAYMENT MODEL

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  currency: {
    type: String,
    default: 'MWK',
    enum: ['MWK', 'USD']
  },
  method: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['cash', 'mobile-money', 'bank-transfer', 'card', 'other'],
    default: 'cash'
  },
  reference: {
    type: String,
    trim: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'refunded'],
    default: 'pending'
  },
  paidAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Middleware to set paidAt when status changes to confirmed
paymentSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'confirmed' && !this.paidAt) {
    this.paidAt = Date.now();
  }
  next();
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toLocaleString()}`;
});

// Ensure virtuals are included in JSON
paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Payment', paymentSchema);