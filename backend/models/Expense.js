const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, default: 'other' },
  amount: { type: Number, default: 0 },
  date: { type: String, default: '' },
  paymentMethod: { type: String, default: 'cash' },
  notes: { type: String, default: '' },
  visible: { type: String, default: 'true' },
}, { timestamps: true });

expenseSchema.index({ userId: 1, id: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
