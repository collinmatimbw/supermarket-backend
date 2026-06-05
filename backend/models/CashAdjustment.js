const mongoose = require('mongoose');

const cashAdjustmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true },
  type: { type: String, required: true, enum: ['in', 'out'] },
  category: { type: String, default: 'adjustment' },
  description: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  date: { type: String, default: '' },
}, { timestamps: true });

cashAdjustmentSchema.index({ userId: 1, id: 1 });

module.exports = mongoose.model('CashAdjustment', cashAdjustmentSchema);
