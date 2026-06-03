const mongoose = require('mongoose');

const capitalSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true },
  amount: { type: Number, default: 0 },
  source: { type: String, default: 'personal' },
  date: { type: String, default: '' },
  notes: { type: String, default: '' },
  visible: { type: String, default: 'true' },
}, { timestamps: true });

capitalSchema.index({ userId: 1, id: 1 });

module.exports = mongoose.model('Capital', capitalSchema);
