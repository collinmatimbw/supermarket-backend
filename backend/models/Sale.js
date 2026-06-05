const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  productId: { type: String, default: '' },
  productName: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
}, { _id: false });

const saleSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true },
  items: { type: [itemSchema], default: [] },
  productId: { type: String, default: '' },
  productName: { type: String, default: '' },
  category: { type: String, default: '' },
  quantity: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  customerName: { type: String, default: 'Walk-in' },
  customerId: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  date: { type: String, default: '' },
  paymentMethod: { type: String, default: 'cash' },
  paymentStatus: { type: String, default: 'paid' },
  paidAmount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  soldBy: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { timestamps: true });

saleSchema.index({ userId: 1, id: 1 });

module.exports = mongoose.model('Sale', saleSchema);
