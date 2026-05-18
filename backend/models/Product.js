const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  buyingPrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  barcode: { type: String, default: '' },
  supplier: { type: String, default: '' },
  dateAdded: { type: String, default: '' },
  visible: { type: String, default: 'true' },
}, { timestamps: true });

productSchema.index({ userId: 1, id: 1 });

module.exports = mongoose.model('Product', productSchema);