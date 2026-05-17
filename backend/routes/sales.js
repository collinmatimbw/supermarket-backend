const express = require('express');
const router = express.Router();
const { readSheet, appendRow, updateRow, deleteRow } = require('../helpers/googleSheets');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const sales = await readSheet(req.user.spreadsheetId, 'sales');
    res.json({ success: true, data: sales });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { productName, quantity, price, buyingPrice, category, customerName, customerId, supplier } = req.body;
    if (!productName || !quantity || !price) {
      return res.status(400).json({ success: false, message: 'Product name, quantity, and price are required' });
    }

    const qty = Number(quantity);
    const sellPrice = Number(price);
    const buyPrice = Number(buyingPrice) || 0;
    const total = sellPrice * qty;

    const products = await readSheet(req.user.spreadsheetId, 'products');
    const existingProduct = products.find(p => p.name.toLowerCase() === productName.toLowerCase());

    let productId;
    if (existingProduct) {
      productId = existingProduct.id;
      if (existingProduct.quantity < qty) {
        return res.status(400).json({ success: false, message: `Insufficient stock for "${productName}" (${existingProduct.quantity} available)` });
      }
      await updateRow(req.user.spreadsheetId, 'products', productId, { quantity: existingProduct.quantity - qty });
    } else {
      const newProduct = {
        id: 'P' + uuidv4().slice(0, 8).toUpperCase(),
        name: productName,
        category: category || 'General',
        buyingPrice: buyPrice,
        sellingPrice: sellPrice,
        quantity: 0,
        barcode: '',
        supplier: supplier || '',
        dateAdded: new Date().toISOString().split('T')[0],
      };
      await appendRow(req.user.spreadsheetId, 'products', newProduct);
      productId = newProduct.id;
    }

    const profit = (sellPrice - buyPrice) * qty;

    const newSale = {
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
    };

    await appendRow(req.user.spreadsheetId, 'sales', newSale);
    res.status(201).json({ success: true, data: newSale });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteRow(req.user.spreadsheetId, 'sales', req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.json({ success: true, message: 'Sale deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const { sales, products } = await require('../helpers/googleSheets').readMultipleSheets(
      req.user.spreadsheetId, ['sales', 'products']
    );
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
      const key = isLongRange
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : s.date;
      if (!grouped[key]) grouped[key] = { revenue: 0, profit: 0, transactions: 0 };
      grouped[key].revenue += Number(s.total) || 0;
      grouped[key].profit += Number(s.profit) || 0;
      grouped[key].transactions += 1;
    });

    const sortedKeys = Object.keys(grouped).sort();
    const dailyRevenue = sortedKeys.map(key => ({
      date: key,
      revenue: grouped[key].revenue,
      profit: grouped[key].profit,
      transactions: grouped[key].transactions,
    }));

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
    const topProducts = Object.entries(prodSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }));

    const totalRevenue = filtered.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const totalProfit = filtered.reduce((sum, s) => sum + (Number(s.profit) || 0), 0);

    res.json({
      success: true,
      data: {
        dailyRevenue,
        categoryRevenue: Object.entries(catRevenue).map(([cat, revenue]) => ({ category: cat, revenue })),
        topProducts,
        totalRevenue,
        totalProfit,
        totalSales: filtered.length,
        period,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
