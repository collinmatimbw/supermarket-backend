const mongoose = require('mongoose');

const stockAdjustmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true },
  productId: { type: String, default: '' },
  productName: { type: String, default: '' },
  previousQuantity: { type: Number, default: 0 },
  newQuantity: { type: Number, default: 0 },
  change: { type: Number, default: 0 },
  reason: { type: String, default: 'other', enum: ['sale', 'purchase', 'return', 'damage', 'theft', 'count', 'expiry', 'other'] },
  notes: { type: String, default: '' },
  date: { type: String, default: '' },
}, { timestamps: true });

stockAdjustmentSchema.index({ userId: 1, id: 1 });

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
