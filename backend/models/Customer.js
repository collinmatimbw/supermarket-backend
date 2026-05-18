const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  dateAdded: { type: String, default: '' },
}, { timestamps: true });

customerSchema.index({ userId: 1, id: 1 });

module.exports = mongoose.model('Customer', customerSchema);