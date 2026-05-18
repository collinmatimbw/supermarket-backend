const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const { authMiddleware } = require('../middleware/auth');

// Public: Seed admin user (run once)
router.post('/seed-admin', async (req, res) => {
  try {
    const existing = await User.findOne({ username: 'sky' });
    if (existing) {
      return res.json({ success: true, message: 'Admin already exists' });
    }
    
    const admin = new User({ username: 'sky', password: 'qwert' });
    await admin.save();
    
    console.log('✅ Admin user created');
    res.json({ success: true, message: 'Admin user created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Public: Sign up new user
router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
    }
    
    if (password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters' });
    }
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }
    
    const newUser = new User({ username, password });
    await newUser.save();
    
    console.log(`✅ New user signed up: ${username}`);
    res.status(201).json({ success: true, message: 'Account created successfully! Please log in.' });
  } catch (err) {
    console.error('❌ Signup error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Middleware to check if admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.username !== 'sky') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// Get all users with their data counts (admin only)
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    const usersWithCounts = await Promise.all(users.map(async (user) => {
      const productCount = await Product.countDocuments({ userId: user.username });
      const saleCount = await Sale.countDocuments({ userId: user.username });
      const customerCount = await Customer.countDocuments({ userId: user.username });
      const supplierCount = await Supplier.countDocuments({ userId: user.username });
      
      return {
        username: user.username,
        createdAt: user.createdAt,
        products: productCount,
        sales: saleCount,
        customers: customerCount,
        suppliers: supplierCount,
      };
    }));
    
    res.json({ success: true, data: usersWithCounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete user and all their data (admin only)
router.delete('/:username', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Don't allow deleting yourself
    if (username === req.user.username) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    
    // Delete all user data
    await Product.deleteMany({ userId: username });
    await Sale.deleteMany({ userId: username });
    await Customer.deleteMany({ userId: username });
    await Supplier.deleteMany({ userId: username });
    
    // Delete user account
    const deletedUser = await User.findOneAndDelete({ username });
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log(`✅ Deleted user "${username}" and all their data`);
    res.json({ success: true, message: 'User and all data deleted' });
  } catch (err) {
    console.error('❌ Delete user error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;