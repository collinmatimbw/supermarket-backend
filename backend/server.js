const express = require('express');
const cors = require('cors');
const path = require('path');

const productsRouter = require('./routes/products');
const salesRouter = require('./routes/sales');
const customersRouter = require('./routes/customers');
const suppliersRouter = require('./routes/suppliers');
const settingsRouter = require('./routes/settings');
const predictionsRouter = require('./routes/predictions');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'https://supermarket-backend-g0t0.onrender.com', 'https://skyccrm.vercel.app'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/predictions', predictionsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🛒 Supermarket CRM Backend running on http://localhost:${PORT}`);
  console.log(`📊 Excel files stored in: ./excel/\n`);
});
