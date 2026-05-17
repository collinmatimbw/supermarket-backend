const express = require('express');
const router = express.Router();
const { clearSheet, readSheet } = require('../helpers/googleSheets');
const XLSX = require('xlsx');

router.get('/export', async (req, res) => {
  try {
    const sheetId = req.user.spreadsheetId;
    const sheets = require('../helpers/googleSheets');
    const data = await sheets.readMultipleSheets(sheetId, ['products', 'sales', 'customers', 'suppliers']);

    const wb = XLSX.utils.book_new();
    for (const [type, rows] of Object.entries(data)) {
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, type.charAt(0).toUpperCase() + type.slice(1));
    }

    const { sales, products, customers } = data;
    const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const totalProfit = sales.reduce((sum, s) => sum + (Number(s.profit) || 0), 0);
    const margin = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0;

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
      .slice(0, 10)
      .map(([name, revenue], i) => ({ rank: i + 1, product: name, revenue }));

    const today = new Date();
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const daySales = sales.filter(s => s.date === key);
      last7.push({
        date: key,
        revenue: daySales.reduce((sum, s) => sum + (Number(s.total) || 0), 0),
        profit: daySales.reduce((sum, s) => sum + (Number(s.profit) || 0), 0),
        transactions: daySales.length,
      });
    }

    const rows = [];
    let r = 0;
    rows[r] = ['SKYC CRM Dashboard', '', '', '', '', ''];
    r++;

    rows[r] = ['Total Products', 'Total Sales', 'Total Customers', 'Total Revenue', 'Total Profit', 'Margin'];
    r++;

    rows[r] = [products.length, sales.length, customers.length, totalRevenue, totalProfit, `${margin.toFixed(1)}%`];
    r++; r++;

    rows[r] = ['Daily Revenue (Last 7 Days)', '', '', '', '', ''];
    r++;

    rows[r] = ['Date', 'Revenue', 'Profit', 'Transactions', '', ''];
    r++;

    last7.forEach(d => {
      rows[r] = [d.date, d.revenue, d.profit, d.transactions, '', ''];
      r++;
    });

    rows[r] = ['TOTAL', '', '', '', '', ''];
    r++; r++;

    rows[r] = ['Revenue by Category', '', '', '', '', ''];
    r++;

    rows[r] = ['Category', 'Revenue', '', '', '', ''];
    r++;

    Object.entries(catRevenue).forEach(([cat, rev]) => {
      rows[r] = [cat, rev, '', '', '', ''];
      r++;
    });

    rows[r] = ['TOTAL', '', '', '', '', ''];
    r++; r++;

    rows[r] = ['Top 10 Products by Revenue', '', '', '', '', ''];
    r++;

    rows[r] = ['Rank', 'Product', 'Revenue', '', '', ''];
    r++;

    topProducts.forEach(p => {
      rows[r] = [p.rank, p.product, p.revenue, '', '', ''];
      r++;
    });

    const wsSummary = XLSX.utils.aoa_to_sheet(rows);
    wsSummary['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
    wsSummary['!cols'] = [{ wch: 22 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Dashboard');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=supermarket-backup.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/sales', async (req, res) => {
  try {
    await clearSheet(req.user.spreadsheetId, 'sales');
    res.json({ success: true, message: 'Sales history cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/info', async (req, res) => {
  try {
    const sheets = require('../helpers/googleSheets');
    const data = await sheets.readMultipleSheets(req.user.spreadsheetId, ['products', 'sales', 'customers']);
    const { products, sales, customers } = data;
    res.json({
      success: true,
      data: {
        version: '2.0.0',
        totalProducts: products.length,
        totalSales: sales.length,
        totalCustomers: customers.length,
        storageType: 'Google Sheets',
        nodeVersion: process.version,
        uptime: Math.floor(process.uptime()),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
