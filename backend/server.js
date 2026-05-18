require('./db'); // Connect to MongoDB

const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const productsRouter = require('./routes/products');
const salesRouter = require('./routes/sales');
const customersRouter = require('./routes/customers');
const suppliersRouter = require('./routes/suppliers');
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));