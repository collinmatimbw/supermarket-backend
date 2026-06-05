const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (!user.password.startsWith('$2')) {
      user.password = password;
    }

    const isAdminEmail = user.email === (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (isAdminEmail && user.role !== 'admin') {
      user.role = 'admin';
    }

    await user.save();

    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, data: { token, email: user.email, role: user.role, isAdmin: user.role === 'admin' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const role = normalizedEmail === (process.env.ADMIN_EMAIL || '').toLowerCase() ? 'admin' : 'user';
    const user = new User({ email: normalizedEmail, password, role });
    await user.save();
    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, data: { token, email: user.email, role: user.role, isAdmin: user.role === 'admin' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
