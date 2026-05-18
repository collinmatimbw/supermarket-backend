const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

// Get all users with their data counts
router.get('/', async (req, res) => {
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

// Delete user and all their data
router.delete('/:username', async (req, res) => {
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