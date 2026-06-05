const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Capital = require('../models/Capital');
const PurchaseOrder = require('../models/PurchaseOrder');
const CashAdjustment = require('../models/CashAdjustment');
const { v4: uuidv4 } = require('uuid');

router.get('/summary', async (req, res) => {
  try {
    const { period } = req.query;
    const email = req.user.email;
    let dateFilter = {};
    if (period === 'today') {
      const today = new Date().toISOString().split('T')[0];
      dateFilter = { date: today };
    } else if (period === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      dateFilter = { date: { $gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      dateFilter = { date: { $gte: monthAgo } };
    }

    const salesFilter = { userId: email, ...dateFilter };
    const expenseFilter = { userId: email, visible: 'true', ...dateFilter };
    const capitalFilter = { userId: email, visible: 'true', ...dateFilter };

    const [sales, expenses, capitals, purchaseOrders, adjustments] = await Promise.all([
      Sale.find(salesFilter),
      Expense.find(expenseFilter),
      Capital.find(capitalFilter),
      PurchaseOrder.find({ userId: email }),
      CashAdjustment.find({ userId: email }),
    ]);

    const totalSales = sales.reduce((s, sale) => s + Number(sale.total || 0), 0);
    const totalCapital = capitals.reduce((s, c) => s + Number(c.amount || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalPurchaseOrders = purchaseOrders
      .filter(po => po.status === 'received' || po.status === 'partial')
      .reduce((s, po) => s + Number(po.totalAmount || 0), 0);
    const totalAdjustmentsIn = adjustments.filter(a => a.type === 'in').reduce((s, a) => s + Number(a.amount || 0), 0);
    const totalAdjustmentsOut = adjustments.filter(a => a.type === 'out').reduce((s, a) => s + Number(a.amount || 0), 0);

    const cashIn = totalSales + totalCapital + totalAdjustmentsIn;
    const cashOut = totalExpenses + totalPurchaseOrders + totalAdjustmentsOut;
    const netCashFlow = cashIn - cashOut;

    res.json({
      success: true, data: {
        cashIn, cashOut, netCashFlow,
        breakdown: {
          sales: { label: 'Sales Revenue', amount: totalSales },
          capital: { label: 'Capital Injected', amount: totalCapital },
          expenses: { label: 'Expenses', amount: totalExpenses },
          purchaseOrders: { label: 'Stock Purchases', amount: totalPurchaseOrders },
          adjustmentsIn: { label: 'Other Cash In', amount: totalAdjustmentsIn },
          adjustmentsOut: { label: 'Other Cash Out', amount: totalAdjustmentsOut },
        },
        period: period || 'all',
        salesCount: sales.length,
        expenseCount: expenses.length,
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/transactions', async (req, res) => {
  try {
    const email = req.user.email;
    const adjustments = await CashAdjustment.find({ userId: email }).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: adjustments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/adjust', async (req, res) => {
  try {
    const { type, category, description, amount, date } = req.body;
    if (!type || !amount) return res.status(400).json({ success: false, message: 'Type and amount required' });
    const adj = new CashAdjustment({
      userId: req.user.email, id: 'CA' + uuidv4().slice(0, 8).toUpperCase(),
      type, category: category || 'adjustment', description: description || '',
      amount: Number(amount), date: date || new Date().toISOString().split('T')[0],
    });
    await adj.save();
    res.status(201).json({ success: true, data: adj });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/adjust/:id', async (req, res) => {
  try {
    const deleted = await CashAdjustment.findOneAndDelete({ userId: req.user.email, id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Adjustment not found' });
    res.json({ success: true, message: 'Adjustment deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
