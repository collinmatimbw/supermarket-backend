const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
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

module.exports = mongoose.model('Product', productSchema);