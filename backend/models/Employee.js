const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  role: { type: String, default: 'Cashier' },
  baseSalary: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 0 },
  targetSales: { type: Number, default: 0 },
  dateHired: { type: String, default: '' },
  status: { type: String, default: 'active' },
  notes: { type: String, default: '' },
  visible: { type: String, default: 'true' },
}, { timestamps: true });

employeeSchema.index({ userId: 1, id: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
