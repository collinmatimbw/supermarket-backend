const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, minlength: 3 },
  password: { type: String, required: true, minlength: 4 },
  createdAt: { type: String, default: () => new Date().toISOString().split('T')[0] },
});

module.exports = mongoose.model('User', userSchema);