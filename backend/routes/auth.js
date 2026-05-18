const express = require('express');
const router = express.Router();
const { USERS } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`🔐 Login attempt: ${username}`);

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  const user = USERS[username];
  if (!user) {
    console.log(`❌ User not found: ${username}`);
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  if (user.password !== password) {
    console.log(`❌ Wrong password for: ${username}`);
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  console.log(`✅ Login success: ${username}, spreadsheetId: ${user.spreadsheetId}`);
  const token = Buffer.from(`${username}:${password}`).toString('base64');
  res.json({
    success: true,
    data: {
      token,
      username,
      spreadsheetId: user.spreadsheetId,
    }
  });
});

module.exports = router;
