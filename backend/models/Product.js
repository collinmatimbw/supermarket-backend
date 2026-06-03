const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, default: '' },
  quantity: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  costPrice: { type: Number, default: 0 },
  unit: { type: String, default: '' },
  expiryDate: { type: String, default: '' },
  batch: { type: String, default: '' },
  warehouse: { type: String, default: '' },
  visible: { type: String, default: 'true' },
  dateAdded: { type: String, default: '' },
}, { timestamps: true });

productSchema.index({ userId: 1, id: 1 });

module.exports = mongoose.model('Product', productSchema);
