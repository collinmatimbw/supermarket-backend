const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`🔐 Login attempt: ${username}`);

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  try {
    const user = await User.findOne({ username, password });
    if (!user) {
      console.log(`❌ Login failed for: ${username}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log(`✅ Login success: ${username}`);
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    res.json({
      success: true,
      data: {
        token,
        username,
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;