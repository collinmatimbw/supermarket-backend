const User = require('../models/User');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');

    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    req.user = { username };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid authentication' });
  }
}

module.exports = { authMiddleware };