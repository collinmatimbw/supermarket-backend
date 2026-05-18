const express = require('express');
const router = express.Router();
const User = require('../models/User');

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

module.exports = router;