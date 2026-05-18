const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  productsSupplied: { type: String, default: '' },
  dateAdded: { type: String, default: '' },
}, { timestamps: true });

supplierSchema.index({ userId: 1, id: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);