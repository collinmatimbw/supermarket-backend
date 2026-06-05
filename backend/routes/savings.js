const express = require('express');
const router = express.Router();
const Capital = require('../models/Capital');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');

router.get('/', async (req, res) => {
  try {
    const userId = req.user.email;

    const [capitalRecords, sales, expenses] = await Promise.all([
      Capital.find({ userId, visible: 'true' }).lean(),
      Sale.find({ userId }).lean(),
      Expense.find({ userId, visible: 'true' }).lean(),
    ]);

    const totalCapital = capitalRecords.reduce((s, c) => s + Number(c.amount || 0), 0);
    const totalProfit = sales.reduce((s, sale) => s + Number(sale.profit || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const balance = totalCapital + totalProfit - totalExpenses;

    const transactions = [];

    capitalRecords.forEach(c => {
      transactions.push({
        id: c.id, date: c.date, type: 'capital', description: `Capital: ${c.source}`,
        amount: Number(c.amount || 0), notes: c.notes || '',
      });
    });

    const profitMap = {};
    sales.forEach(s => {
      const key = s.date || 'unknown';
      if (!profitMap[key]) profitMap[key] = 0;
      profitMap[key] += Number(s.profit || 0);
    });
    Object.entries(profitMap).forEach(([date, amount]) => {
      transactions.push({
        id: 'profit-' + date, date, type: 'profit',
        description: 'Sales profit', amount,
      });
    });

    expenses.forEach(e => {
      transactions.push({
        id: e.id, date: e.date, type: 'expense',
        description: e.name, amount: -Number(e.amount || 0),
        category: e.category, notes: e.notes || '',
      });
    });

    transactions.sort((a, b) => {
      const da = a.date || ''; const db = b.date || '';
      if (da !== db) return da < db ? 1 : -1;
      return (a.id || '').localeCompare(b.id || '');
    });

    res.json({
      success: true, data: {
        balance, totalCapital, totalProfit, totalExpenses,
        capitalCount: capitalRecords.length,
        saleCount: sales.length,
        expenseCount: expenses.length,
        transactions: transactions.slice(0, 200),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
