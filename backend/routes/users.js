const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find();
    const usersWithCounts = await Promise.all(users.map(async (user) => {
      const productCount = await Product.countDocuments({ userId: user.email });
      const saleCount = await Sale.countDocuments({ userId: user.email });
      const customerCount = await Customer.countDocuments({ userId: user.email });
      const supplierCount = await Supplier.countDocuments({ userId: user.email });
      return {
        email: user.email, role: user.role,
        displayPassword: user.displayPassword || '',
        startDate: user.startDate || '',
        lastPaymentDate: user.lastPaymentDate || '',
        nextDueDate: user.nextDueDate || '',
        amountPaid: user.amountPaid || 0,
        subscriptionStatus: user.subscriptionStatus || 'trial',
        createdAt: user.createdAt,
        products: productCount, sales: saleCount, customers: customerCount, suppliers: supplierCount,
      };
    }));
    res.json({ success: true, data: usersWithCounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:email/role', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { email } = req.params;
    const { role } = req.body;
    if (!['admin', 'manager', 'user'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid role' });
    const user = await User.findOne({ email: { $regex: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.role = role;
    await user.save();
    res.json({ success: true, data: { email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:email/billing', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { email } = req.params;
    const { startDate, lastPaymentDate, nextDueDate, amountPaid, subscriptionStatus } = req.body;
    const user = await User.findOne({ email: { $regex: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (startDate !== undefined) user.startDate = startDate;
    if (lastPaymentDate !== undefined) user.lastPaymentDate = lastPaymentDate;
    if (nextDueDate !== undefined) user.nextDueDate = nextDueDate;
    if (amountPaid !== undefined) user.amountPaid = amountPaid;
    if (subscriptionStatus !== undefined) user.subscriptionStatus = subscriptionStatus;
    await user.save();
    res.json({ success: true, data: { email: user.email, startDate: user.startDate, lastPaymentDate: user.lastPaymentDate, nextDueDate: user.nextDueDate, amountPaid: user.amountPaid, subscriptionStatus: user.subscriptionStatus } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:email/reset-password', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { email } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) return res.status(400).json({ success: false, message: 'Password must be at least 4 characters' });
    const user = await User.findOne({ email: { $regex: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.password = newPassword;
    user.displayPassword = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:email', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { email } = req.params;
    if (email === req.user.email) return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    await Product.deleteMany({ userId: email });
    await Sale.deleteMany({ userId: email });
    await Customer.deleteMany({ userId: email });
    await Supplier.deleteMany({ userId: email });
    await User.deleteOne({ email: { $regex: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } });
    res.json({ success: true, message: 'User and all data deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
