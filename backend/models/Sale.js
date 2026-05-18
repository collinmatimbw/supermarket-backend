const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true },
  productId: { type: String, default: '' },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  buyingPrice: { type: Number, default: 0 },
  total: { type: Number, required: true },
  profit: { type: Number, default: 0 },
  date: { type: String, default: '' },
  customerId: { type: String, default: '' },
  customerName: { type: String, default: 'Walk-in Customer' },
}, { timestamps: true });

saleSchema.index({ userId: 1, id: 1 });

module.exports = mongoose.model('Sale', saleSchema);