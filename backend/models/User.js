const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayPassword: { type: String, default: '' },
  role: { type: String, default: 'user', enum: ['admin', 'manager', 'user'] },
  startDate: { type: String, default: '' },
  lastPaymentDate: { type: String, default: '' },
  nextDueDate: { type: String, default: '' },
  amountPaid: { type: Number, default: 0 },
  subscriptionStatus: { type: String, default: 'trial', enum: ['active', 'expired', 'trial'] },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (this.password.startsWith('$2')) {
    return bcrypt.compare(candidatePassword, this.password);
  }
  return candidatePassword === this.password;
};

module.exports = mongoose.model('User', userSchema);
