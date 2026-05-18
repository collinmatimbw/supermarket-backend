const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  displayName: { type: String, default: '' },
  password: { type: String, required: true, minlength: 4 },
  createdAt: { type: String, default: () => new Date().toISOString().split('T')[0] },
});

module.exports = mongoose.model('User', userSchema);