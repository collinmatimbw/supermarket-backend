const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const productsRouter = require('./routes/products');
const salesRouter = require('./routes/sales');
const customersRouter = require('./routes/customers');
const suppliersRouter = require('./routes/suppliers');
const settingsRouter = require('./routes/settings');
const predictionsRouter = require('./routes/predictions');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'https://supermarket-backend-g0t0.onrender.com', 'https://skyccrm.vercel.app'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter);
app.use('/api/products', authMiddleware, productsRouter);
app.use('/api/sales', authMiddleware, salesRouter);
app.use('/api/customers', authMiddleware, customersRouter);
app.use('/api/suppliers', authMiddleware, suppliersRouter);
app.use('/api/settings', authMiddleware, settingsRouter);
app.use('/api/predictions', authMiddleware, predictionsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/test-sheets', async (req, res) => {
  try {
    const { testConnection, SHEETS } = require('./helpers/googleSheets');
    const results = {};
    
    for (const [user, sheetId] of Object.entries(SHEETS)) {
      if (sheetId) {
        results[user] = await testConnection(sheetId);
      } else {
        results[user] = { success: false, message: 'No sheet ID configured' };
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Google Sheets connection test',
      results,
      env: {
        hasSkySheet: !!process.env.GOOGLE_SHEET_ID_SKY,
        hasLukeloSheet: !!process.env.GOOGLE_SHEET_ID_LUKELO,
        hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

let attempts = 10;

function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`🛒 SKYC CRM Backend running on http://localhost:${PORT}`);
    console.log(`📊 Data stored in Google Sheets`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempts > 0) {
      console.log(`⏳ Port ${PORT} busy, retrying in 2s... (${attempts} left)`);
      attempts--;
      server.close();
      setTimeout(startServer, 2000);
    } else if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} still in use after retries`);
      process.exit(1);
    }
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down...');
    server.close(() => process.exit(0));
  });
}

setTimeout(startServer, 3000);
