const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  notes: { type: String, default: '' },
  stage: { type: String, default: 'new' },
  dateAdded: { type: String, default: '' },
}, { timestamps: true });

leadSchema.index({ userId: 1, id: 1 });

module.exports = mongoose.model('Lead', leadSchema);
