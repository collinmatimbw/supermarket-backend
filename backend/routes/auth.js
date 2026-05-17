const express = require('express');
const router = express.Router();
const { USERS } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  const user = USERS[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

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
