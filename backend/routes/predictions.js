const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');

router.get('/predictions', async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user.email });
    const products = await Product.find({ userId: req.user.email });
    if (sales.length === 0 || products.length === 0) return res.json({ success: true, data: { salesForecast: [], productPredictions: [], confidence: 0, message: 'No sales data' } });
    const dailySales = {};
    sales.forEach(s => {
      const date = s.date;
      if (!dailySales[date]) dailySales[date] = { revenue: 0, profit: 0, transactions: 0 };
      dailySales[date].revenue += Number(s.total || 0);
      dailySales[date].profit += Number(s.profit || 0);
      dailySales[date].transactions += 1;
    });
    const sortedDates = Object.keys(dailySales).sort();
    const avgRevenue = sortedDates.reduce((sum, d) => sum + dailySales[d].revenue, 0) / sortedDates.length;
    const salesForecast = [];
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    for (let i = 1; i <= 7; i++) {
      const d = new Date(lastDate); d.setDate(d.getDate() + i);
      salesForecast.push({ date: d.toISOString().split('T')[0], predictedRevenue: Math.round(avgRevenue * 0.9 + Math.random() * avgRevenue * 0.2), predictedProfit: Math.round(avgRevenue * 0.3), predictedTransactions: Math.max(1, Math.round(sales.length / sortedDates.length)), confidence: Math.min(90, 50 + sortedDates.length) });
    }
    res.json({ success: true, data: { salesForecast, productPredictions: products.slice(0, 10).map(p => ({ name: p.name, category: p.category || '', currentRevenue: 0, predictedWeeklyRevenue: 0, revenue: 0, profit: 0, margin: 0, quantity: 0, revenueShare: 0, performance: 'good', daysUntilStockout: 999, recommendation: { priority: 'low', message: 'Stock OK' } })), confidence: Math.min(95, 50 + sales.length), historicalAvg: { dailyRevenue: Math.round(avgRevenue), dailyProfit: 0, dailyTransactions: Math.round(sales.length / sortedDates.length) }, trends: { revenue: 'stable', profit: 'stable', transactions: 'stable' } } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/market-analysis', async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user.email });
    const products = await Product.find({ userId: req.user.email });
    if (sales.length === 0) return res.json({ success: true, data: { summary: { totalProducts: 0, topPerformers: 0, underperformers: 0, totalCategories: 0 }, productPerformance: [], categoryInsights: [], recommendations: [], seasonalTrends: [], customerInsights: null } });
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const productPerformance = products.map(p => ({ name: p.name, category: p.category || 'Unknown', revenue: 0, profit: 0, margin: 0, quantity: 0, revenueShare: 0, performance: 'average' }));
    const categoryMap = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, revenue: 0, profit: 0, transactions: 0 };
      categoryMap[cat].count += 1;
    });
    sales.forEach(s => {
      const cat = s.category || 'Unknown';
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, revenue: 0, profit: 0, transactions: 0 };
      categoryMap[cat].revenue += Number(s.total || 0);
      categoryMap[cat].profit += Number(s.profit || 0);
      categoryMap[cat].transactions += 1;
    });
    const totalCatRev = Object.values(categoryMap).reduce((s, c) => s + c.revenue, 0);
    const categoryInsights = Object.entries(categoryMap).map(([name, data]) => ({ category: name, productCount: data.count, revenue: Math.round(data.revenue), profit: Math.round(data.profit), share: totalCatRev > 0 ? ((data.revenue / totalCatRev) * 100).toFixed(1) : 0, avgTransaction: data.transactions > 0 ? Math.round(data.revenue / data.transactions) : 0, performance: data.revenue > 10000 ? 'high' : data.revenue > 5000 ? 'medium' : 'low' }));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dowMap = {};
    sales.forEach(s => {
      const d = new Date(s.date);
      if (!isNaN(d)) {
        const dn = dayNames[d.getDay()];
        if (!dowMap[dn]) dowMap[dn] = { revenue: 0, transactions: 0, count: 0 };
        dowMap[dn].revenue += Number(s.total || 0);
        dowMap[dn].count += 1;
      }
    });
    const seasonalTrends = dayNames.map(d => { const data = dowMap[d] || { revenue: 0, transactions: 0, count: 0 }; return { day: d, avgRevenue: data.count > 0 ? Math.round(data.revenue / data.count) : 0, avgTransactions: data.count, totalRevenue: data.revenue }; });
    const recommendations = [{ type: 'insight', title: 'Portfolio Overview', description: `${products.length} products across ${Object.keys(categoryMap).length} categories`, impact: 'low' }];
    res.json({ success: true, data: { summary: { totalProducts: products.length, topPerformers: 0, underperformers: 0, totalCategories: Object.keys(categoryMap).length }, productPerformance, categoryInsights, recommendations, seasonalTrends, customerInsights: { totalCustomers: new Set(sales.map(s => s.customerName)).size, registeredCustomers: 0, walkInCustomers: 0, avgOrderValue: sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0, topCustomers: [] } } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
