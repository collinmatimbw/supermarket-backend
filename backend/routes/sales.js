const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    console.log('🔍 GET /sales for user:', req.user.email);
    const sales = await Sale.find({ userId: req.user.email }).sort({ createdAt: -1 });
    console.log(`📦 Returning ${sales.length} sales`);
    res.json({ success: true, data: sales });
  } catch (err) {
    console.error('❌ GET /sales error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /sales for user:', req.user.email);
    const { productName, quantity, price, buyingPrice, category, customerName, customerId, supplier } = req.body;
    if (!productName || !quantity || !price) {
      return res.status(400).json({ success: false, message: 'Product name, quantity, and price are required' });
    }

    const qty = Number(quantity);
    const sellPrice = Number(price);
    const buyPrice = Number(buyingPrice) || 0;
    const total = sellPrice * qty;

    const existingProduct = await Product.findOne({ userId: req.user.email, name: { $regex: new RegExp('^' + productName + '$', 'i') } });
    let productId;

    if (existingProduct) {
      productId = existingProduct.id;
      if (existingProduct.quantity < qty) {
        return res.status(400).json({ success: false, message: `Insufficient stock (${existingProduct.quantity} available)` });
      }
      await Product.findOneAndUpdate({ userId: req.user.email, id: productId }, { quantity: existingProduct.quantity - qty });
    } else {
      const newProduct = new Product({
        userId: req.user.email,
        id: 'P' + uuidv4().slice(0, 8).toUpperCase(),
        name: productName,
        category: category || 'General',
        buyingPrice: buyPrice,
        sellingPrice: sellPrice,
        quantity: 0,
        barcode: '',
        supplier: supplier || '',
        dateAdded: new Date().toISOString().split('T')[0],
        visible: 'true',
      });
      await newProduct.save();
      productId = newProduct.id;
    }

    const profit = (sellPrice - buyPrice) * qty;
    const newSale = new Sale({
      userId: req.user.email,
      id: 'S' + uuidv4().slice(0, 8).toUpperCase(),
      productId,
      productName,
      quantity: qty,
      price: sellPrice,
      buyingPrice: buyPrice,
      total,
      profit,
      date: new Date().toISOString().split('T')[0],
      customerId: customerId || '',
      customerName: customerName || 'Walk-in Customer',
    });

    await newSale.save();
    console.log(`✅ Sale added: ${productName} (${qty} x ${sellPrice})`);
    res.status(201).json({ success: true, data: newSale });
  } catch (err) {
    console.error('❌ POST /sales error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Sale.findOneAndDelete({ userId: req.user.email, id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.json({ success: true, message: 'Sale deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
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
    filtered.forEach(s => {
      prodSales[s.productName] = (prodSales[s.productName] || 0) + Number(s.total);
    });
    const topProducts = Object.entries(prodSales).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, revenue]) => ({ name, revenue }));

    res.json({
      success: true,
      data: {
        dailyRevenue,
        categoryRevenue: Object.entries(catRevenue).map(([category, revenue]) => ({ category, revenue })),
        topProducts,
        totalRevenue: filtered.reduce((sum, s) => sum + (Number(s.total) || 0), 0),
        totalProfit: filtered.reduce((sum, s) => sum + (Number(s.profit) || 0), 0),
        totalSales: filtered.length,
        period,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;