const mongoose = require('mongoose');

const interestRateSchema = new mongoose.Schema({
  minAmount: { type: Number, required: true, min: 0 },
  maxAmount: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true, min: 0 },
  timeFrame: { type: Number, required: true, min: 1 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.models.InterestRate || mongoose.model('InterestRate', interestRateSchema);