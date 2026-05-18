const SHEET_ID_SKY = process.env.GOOGLE_SHEET_ID_SKY;
const SHEET_ID_LUKELO = process.env.GOOGLE_SHEET_ID_LUKELO;

console.log(`🔐 Auth init: SHEET_ID_SKY = ${SHEET_ID_SKY ? 'set' : 'MISSING'}, SHEET_ID_LUKELO = ${SHEET_ID_LUKELO ? 'set' : 'MISSING'}`);

const USERS = {
  sky: { password: 'qwert', spreadsheetId: SHEET_ID_SKY },
  lukelo: { password: 'collin9619', spreadsheetId: SHEET_ID_LUKELO },
};

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');

    const user = USERS[username];
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    req.user = { username, spreadsheetId: user.spreadsheetId };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid authentication' });
  }
}

module.exports = { authMiddleware, USERS };
