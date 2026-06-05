const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user.email }).sort({ createdAt: -1 });
    res.json({ success: true, data: sales });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { items, customerName, customerId, customerPhone, date, paymentMethod, paidAmount, soldBy, notes } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'At least one product is required' });

    // Validate stock for every item
    for (const item of items) {
      const product = await Product.findOne({ userId: req.user.email, id: item.productId });
      if (!product) return res.status(400).json({ success: false, message: `Product not found: ${item.productName}` });
      if ((product.quantity || 0) < (item.quantity || 0)) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}. Available: ${product.quantity}, requested: ${item.quantity}`
        });
      }
    }

    const total = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
    const profit = items.reduce((sum, it) => sum + (Number(it.profit) || 0), 0);
    const qty = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    const first = items[0];
    const paid = Number(paidAmount) || (paymentMethod === 'credit' ? 0 : total);
    const balance = Math.max(0, total - paid);
    const paymentStatus = total <= 0 ? 'paid' : balance >= total ? 'credit' : balance > 0 ? 'partial' : 'paid';

    const sale = new Sale({
      userId: req.user.email, id: 'S' + uuidv4().slice(0, 8).toUpperCase(),
      items,
      productId: first.productId || '', productName: first.productName || '', category: first.category || '',
      quantity: qty, price: first.price || 0, total, profit,
      customerName: customerName || 'Walk-in', customerId: customerId || '', customerPhone: customerPhone || '',
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'cash', paymentStatus, paidAmount: paid, balance, soldBy: soldBy || '', notes: notes || '',
    });
    await sale.save();

    for (const item of items) {
      await Product.findOneAndUpdate(
        { userId: req.user.email, id: item.productId },
        { $inc: { quantity: -(Number(item.quantity) || 0) } }
      );
    }

    res.status(201).json({ success: true, data: sale });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Sale.findOneAndUpdate({ userId: req.user.email, id: req.params.id }, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/payment', async (req, res) => {
  try {
    const { paidAmount } = req.body;
    const sale = await Sale.findOne({ userId: req.user.email, id: req.params.id });
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    const newPaid = (sale.paidAmount || 0) + (Number(paidAmount) || 0);
    const balance = Math.max(0, (sale.total || 0) - newPaid);
    const paymentStatus = (sale.total || 0) <= 0 ? 'paid' : balance >= (sale.total || 0) ? 'credit' : balance > 0 ? 'partial' : 'paid';
    const updated = await Sale.findOneAndUpdate({ userId: req.user.email, id: req.params.id },
      { paidAmount: newPaid, balance, paymentStatus }, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Sale.findOneAndDelete({ userId: req.user.email, id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.json({ success: true, message: 'Sale deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/analytics', async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user.email });
    const products = await Product.find({ userId: req.user.email });
    const period = req.query.period || '7d';
    const today = new Date();
    let startDate;
    switch (period) {
      case '30d': startDate = new Date(today); startDate.setDate(startDate.getDate() - 30); break;
      case '90d': startDate = new Date(today); startDate.setDate(startDate.getDate() - 90); break;
      case '1y': startDate = new Date(today); startDate.setFullYear(startDate.getFullYear() - 1); break;
      case 'all': startDate = new Date(0); break;
      default: startDate = new Date(today); startDate.setDate(startDate.getDate() - 7); break;
    }
    const filtered = sales.filter(s => new Date(s.date) >= startDate);
    const grouped = {};
    const isLongRange = period === '1y' || period === 'all';
    filtered.forEach(s => {
      const d = new Date(s.date);
      const key = isLongRange ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : s.date;
      if (!grouped[key]) grouped[key] = { revenue: 0, profit: 0, transactions: 0 };
      grouped[key].revenue += Number(s.total) || 0;
      grouped[key].profit += Number(s.profit) || 0;
      grouped[key].transactions += 1;
    });
    const sortedKeys = Object.keys(grouped).sort();
    const dailyRevenue = sortedKeys.map(key => ({ date: key, ...grouped[key] }));
    const catRevenue = {};
    filtered.forEach(s => {
      const prod = products.find(p => p.id === s.productId);
      const cat = prod ? prod.category : 'General';
      catRevenue[cat] = (catRevenue[cat] || 0) + Number(s.total);
    });
    const prodSales = {};
    filtered.forEach(s => { prodSales[s.productName] = (prodSales[s.productName] || 0) + Number(s.total); });
    const topProducts = Object.entries(prodSales).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, revenue]) => ({ name, revenue }));
    res.json({ success: true, data: { dailyRevenue, categoryRevenue: Object.entries(catRevenue).map(([category, revenue]) => ({ category, revenue })), topProducts, totalRevenue: filtered.reduce((sum, s) => sum + (Number(s.total) || 0), 0), totalProfit: filtered.reduce((sum, s) => sum + (Number(s.profit) || 0), 0), totalSales: filtered.length, period } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
