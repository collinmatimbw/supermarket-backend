const express = require('express');
const router = express.Router();
const { readExcel, appendRow, updateRow, deleteRow, findProductByName, findOrCreateProduct } = require('../helpers/excel');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  try {
    const sales = readExcel('sales');
    res.json({ success: true, data: sales });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { productName, quantity, price, buyingPrice, category, customerName, customerId, supplier } = req.body;
    if (!productName || !quantity || !price) {
      return res.status(400).json({ success: false, message: 'Product name, quantity, and price are required' });
    }

    const qty = Number(quantity);
    const sellPrice = Number(price);
    const buyPrice = Number(buyingPrice) || 0;
    const total = sellPrice * qty;

    const existingProduct = findProductByName(productName);

    let productId;
    if (existingProduct) {
      productId = existingProduct.id;
      if (existingProduct.quantity < qty) {
        return res.status(400).json({ success: false, message: `Insufficient stock for "${productName}" (${existingProduct.quantity} available)` });
      }
      updateRow('products', productId, { quantity: existingProduct.quantity - qty });
    } else {
      const newProduct = findOrCreateProduct(productName, category || 'General', sellPrice, buyPrice, supplier || '');
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

    appendRow('sales', newSale);
    res.status(201).json({ success: true, data: newSale });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteRow('sales', req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.json({ success: true, message: 'Sale deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/analytics', (req, res) => {
  try {
    const sales = readExcel('sales');
    const products = readExcel('products');

    const last7 = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      last7[key] = { revenue: 0, profit: 0 };
    }
    sales.forEach(s => {
      if (last7.hasOwnProperty(s.date)) {
        last7[s.date].revenue += Number(s.total) || 0;
        last7[s.date].profit += Number(s.profit) || 0;
      }
    });

    const catRevenue = {};
    sales.forEach(s => {
      const prod = products.find(p => p.id === s.productId);
      const cat = prod ? prod.category : 'General';
      catRevenue[cat] = (catRevenue[cat] || 0) + Number(s.total);
    });

    const prodSales = {};
    sales.forEach(s => {
      prodSales[s.productName] = (prodSales[s.productName] || 0) + Number(s.total);
    });
    const topProducts = Object.entries(prodSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }));

    const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const totalProfit = sales.reduce((sum, s) => sum + (Number(s.profit) || 0), 0);

    res.json({
      success: true,
      data: {
        dailyRevenue: Object.entries(last7).map(([date, d]) => ({ date, revenue: d.revenue, profit: d.profit })),
        categoryRevenue: Object.entries(catRevenue).map(([cat, revenue]) => ({ category: cat, revenue })),
        topProducts,
        totalRevenue,
        totalProfit,
        totalSales: sales.length,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
