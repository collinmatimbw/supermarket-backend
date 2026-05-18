const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`🔐 Login attempt: ${email}`);

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  try {
    const user = await User.findOne({ email, password });
    if (!user) {
      console.log(`❌ Login failed for: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    console.log(`✅ Login success: ${email}`);
    const token = Buffer.from(`${email}:${password}`).toString('base64');
    res.json({
      success: true,
      data: {
        token,
        email,
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;