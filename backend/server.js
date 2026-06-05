require('dotenv').config();
require('./db');

const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const productsRouter = require('./routes/products');
const salesRouter = require('./routes/sales');
const customersRouter = require('./routes/customers');
const suppliersRouter = require('./routes/suppliers');
const predictionsRouter = require('./routes/predictions');
const settingsRouter = require('./routes/settings');
const leadsRouter = require('./routes/leads');
const tasksRouter = require('./routes/tasks');
const expensesRouter = require('./routes/expenses');
const employeesRouter = require('./routes/employees');
const capitalRouter = require('./routes/capital');
const notificationRouter = require('./routes/notifications');
const chatRouter = require('./routes/chat');
const analysisRouter = require('./routes/analysis');
const savingsRouter = require('./routes/savings');
const purchaseOrdersRouter = require('./routes/purchaseOrders');
const cashFlowRouter = require('./routes/cashFlow');
const stockAdjustmentsRouter = require('./routes/stockAdjustments');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'https://supermarket-backend-g0t0.onrender.com', 'https://skyccrm.vercel.app'],
  credentials: true,
}));
app.use(express.json());
app.use(require('express-fileupload')());

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/products', authMiddleware, productsRouter);
app.use('/api/sales', authMiddleware, salesRouter);
app.use('/api/customers', authMiddleware, customersRouter);
app.use('/api/suppliers', authMiddleware, suppliersRouter);
app.use('/api/predictions', authMiddleware, predictionsRouter);
app.use('/api/settings', authMiddleware, settingsRouter);
app.use('/api/leads', authMiddleware, leadsRouter);
app.use('/api/tasks', authMiddleware, tasksRouter);
app.use('/api/expenses', authMiddleware, expensesRouter);
app.use('/api/employees', authMiddleware, employeesRouter);
app.use('/api/capital', authMiddleware, capitalRouter);
app.use('/api/notifications', authMiddleware, notificationRouter);
app.use('/api/chat', authMiddleware, chatRouter);
app.use('/api/analysis', authMiddleware, analysisRouter);
app.use('/api/savings', authMiddleware, savingsRouter);
app.use('/api/purchase-orders', authMiddleware, purchaseOrdersRouter);
app.use('/api/cash-flow', authMiddleware, cashFlowRouter);
app.use('/api/stock-adjustments', authMiddleware, stockAdjustmentsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
