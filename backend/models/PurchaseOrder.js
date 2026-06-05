const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
}, { _id: false });

const purchaseOrderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true },
  supplierId: { type: String, default: '' },
  supplierName: { type: String, default: '' },
  items: [poItemSchema],
  orderDate: { type: String, default: '' },
  expectedDate: { type: String, default: '' },
  receivedDate: { type: String, default: '' },
  status: { type: String, default: 'pending', enum: ['pending', 'partial', 'received', 'cancelled'] },
  totalAmount: { type: Number, default: 0 },
  notes: { type: String, default: '' },
}, { timestamps: true });

purchaseOrderSchema.index({ userId: 1, id: 1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
