const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
  try {
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const token = Buffer.from(`${email}:${password}`).toString('base64');
    res.json({ success: true, data: { token, email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = new User({ email, password });
    await user.save();
    const token = Buffer.from(`${email}:${password}`).toString('base64');
    res.status(201).json({ success: true, data: { token, email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
