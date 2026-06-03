const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  type: { type: String, default: 'info' },
  read: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
