const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, default: 'general' },
  dueDate: { type: String, default: '' },
  priority: { type: String, default: 'medium' },
  done: { type: String, default: 'false' },
  dateAdded: { type: String, default: '' },
}, { timestamps: true });

taskSchema.index({ userId: 1, id: 1 });

module.exports = mongoose.model('Task', taskSchema);
