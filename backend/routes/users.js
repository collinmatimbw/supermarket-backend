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
    const existing = await User.findOne({ email: 'admin@skyc.com' });
    if (existing) {
      return res.json({ success: true, message: 'Admin already exists' });
    }
    
    const admin = new User({ email: 'admin@skyc.com', password: 'admin123' });
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
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    
    if (!email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email' });
    }
    
    if (password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    
    const newUser = new User({ email, password });
    await newUser.save();
    
    console.log(`✅ New user signed up: ${email}`);
    res.status(201).json({ success: true, message: 'Account created successfully! Please log in.' });
  } catch (err) {
    console.error('❌ Signup error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});
  } catch (err) {
    console.error('❌ Signup error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Middleware to check if admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.email !== 'admin@skyc.com') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// Get all users with their data counts (admin only)
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    const usersWithCounts = await Promise.all(users.map(async (user) => {
      const productCount = await Product.countDocuments({ userId: user.email });
      const saleCount = await Sale.countDocuments({ userId: user.email });
      const customerCount = await Customer.countDocuments({ userId: user.email });
      const supplierCount = await Supplier.countDocuments({ userId: user.email });
      
      return {
        email: user.email,
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
router.delete('/:email', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    
    // Don't allow deleting yourself
    if (email === req.user.email) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    
    // Delete all user data
    await Product.deleteMany({ userId: email });
    await Sale.deleteMany({ userId: email });
    await Customer.deleteMany({ userId: email });
    await Supplier.deleteMany({ userId: email });
    
    // Delete user account
    const deletedUser = await User.findOneAndDelete({ email });
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log(`✅ Deleted user "${email}" and all their data`);
    res.json({ success: true, message: 'User and all data deleted' });
  } catch (err) {
    console.error('❌ Delete user error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;