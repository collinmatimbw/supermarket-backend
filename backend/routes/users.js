const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const { authMiddleware } = require('../middleware/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.email !== ADMIN_EMAIL) return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
};

router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const usersWithCounts = await Promise.all(users.map(async (user) => {
      const productCount = await Product.countDocuments({ userId: user.email });
      const saleCount = await Sale.countDocuments({ userId: user.email });
      const customerCount = await Customer.countDocuments({ userId: user.email });
      const supplierCount = await Supplier.countDocuments({ userId: user.email });
      return { email: user.email, createdAt: user.createdAt, products: productCount, sales: saleCount, customers: customerCount, suppliers: supplierCount };
    }));
    res.json({ success: true, data: usersWithCounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:email', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    if (email === req.user.email) return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    await Product.deleteMany({ userId: email });
    await Sale.deleteMany({ userId: email });
    await Customer.deleteMany({ userId: email });
    await Supplier.deleteMany({ userId: email });
    await User.deleteOne({ email });
    res.json({ success: true, message: 'User and all data deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
