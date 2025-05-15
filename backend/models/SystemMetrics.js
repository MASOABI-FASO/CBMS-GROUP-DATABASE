const mongoose = require('mongoose');

const systemMetricsSchema = new mongoose.Schema({
  systemProfits: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SystemMetrics', systemMetricsSchema);