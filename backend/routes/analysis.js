const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Task = require('../models/Task');
const Capital = require('../models/Capital');

const getPeriodFilter = (period, userId) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const today = `${y}-${m}-${d}`;
  if (period === 'today') return { userId, date: today };
  if (period === 'week') {
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    return { userId, date: { $gte: weekAgo.toISOString().split('T')[0] } };
  }
  if (period === 'month') return { userId, date: { $regex: `^${y}-${m}` } };
  if (period === 'year') return { userId, date: { $regex: `^${y}` } };
  return { userId };
};

const computePeriod = (period) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const today = `${y}-${m}-${d}`;
  if (period === 'today') return { label: 'Today', start: today, end: today };
  if (period === 'week') {
    const d2 = new Date(now); d2.setDate(d2.getDate() - 7);
    return { label: 'This Week', start: d2.toISOString().split('T')[0], end: today };
  }
  if (period === 'month') return { label: `This Month (${now.toLocaleString('en', { month: 'long' })})`, start: `${y}-${m}-01`, end: today };
  if (period === 'year') return { label: `This Year (${y})`, start: `${y}-01-01`, end: today };
  return { label: 'All Time', start: '-', end: today };
};

// Sales Summary
const salesSummary = async (userId, period) => {
  const filter = getPeriodFilter(period, userId);
  const sales = await Sale.find(filter).lean();
  const periodInfo = computePeriod(period);
  const totalRevenue = sales.reduce((s, x) => s + Number(x.total || 0), 0);
  const totalProfit = sales.reduce((s, x) => s + Number(x.profit || 0), 0);
  const totalCost = sales.reduce((s, x) => s + (Number(x.total || 0) - Number(x.profit || 0)), 0);
  const transactionCount = sales.length;
  const avgPerTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;
  const cash = sales.filter(s => s.paymentMethod === 'cash').reduce((s, x) => s + Number(x.total || 0), 0);
  const mobile = sales.filter(s => s.paymentMethod === 'mobile').reduce((s, x) => s + Number(x.total || 0), 0);
  const credit = sales.filter(s => s.paymentMethod === 'credit').reduce((s, x) => s + Number(x.total || 0), 0);
  const debtBalance = sales.reduce((s, x) => s + Number(x.balance || 0), 0);
  const topSeller = [...sales].sort((a, b) => b.total - a.total).slice(0, 3).map(s => ({ name: s.productName || 'Sale', total: Number(s.total || 0), qty: s.quantity || 0 }));

  // Compare to previous period for growth
  const prev = await Sale.find(getPeriodFilter(period === 'today' ? 'yesterday' : period === 'week' ? 'prev_week' : period === 'month' ? 'prev_month' : 'prev_year', userId)).lean();
  const prevRevenue = prev.reduce((s, x) => s + Number(x.total || 0), 0);
  const growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : null;

  return { type: 'sales_summary', period: periodInfo, totalRevenue, totalProfit, totalCost, transactionCount, avgPerTransaction, cash, mobile, credit, debtBalance, topSeller, growth };
};

// Top Products
const topProducts = async (userId, period) => {
  const filter = getPeriodFilter(period, userId);
  const sales = await Sale.find(filter).lean();
  const agg = {};
  sales.forEach(s => {
    const key = s.productName || 'Unknown';
    if (!agg[key]) agg[key] = { name: key, qty: 0, revenue: 0, profit: 0, count: 0 };
    agg[key].qty += s.quantity || 0;
    agg[key].revenue += Number(s.total || 0);
    agg[key].profit += Number(s.profit || 0);
    agg[key].count += 1;
  });
  const products = Object.values(agg).sort((a, b) => b.revenue - a.revenue);
  const periodInfo = computePeriod(period);
  return { type: 'top_products', period: periodInfo, products: products.slice(0, 10), totalProducts: products.length };
};

// Profit Analysis
const profitAnalysis = async (userId, period) => {
  const filter = getPeriodFilter(period, userId);
  const sales = await Sale.find(filter).lean();
  const expenses = await Expense.find(filter).lean();
  const periodInfo = computePeriod(period);
  const totalRevenue = sales.reduce((s, x) => s + Number(x.total || 0), 0);
  const totalProfit = sales.reduce((s, x) => s + Number(x.profit || 0), 0);
  const totalExpenses = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
  const netProfit = totalProfit - totalExpenses;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : 0;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100).toFixed(1) : 0;

  // Daily profit trend
  const dailyMap = {};
  sales.forEach(s => {
    if (s.date) { dailyMap[s.date] = (dailyMap[s.date] || 0) + Number(s.profit || 0); }
  });
  const trend = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([date, profit]) => ({ date, profit }));
  const avgDailyProfit = trend.length > 0 ? trend.reduce((s, d) => s + d.profit, 0) / trend.length : 0;

  return { type: 'profit_analysis', period: periodInfo, totalRevenue, totalProfit, totalExpenses, netProfit, margin, netMargin, avgDailyProfit, trend };
};

// Expense Breakdown
const expenseBreakdown = async (userId, period) => {
  const filter = getPeriodFilter(period, userId);
  const expenses = await Expense.find(filter).lean();
  const sales = await Sale.find(getPeriodFilter(period, userId)).lean();
  const periodInfo = computePeriod(period);
  const totalExpenses = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
  const byCategory = {};
  expenses.forEach(e => {
    const cat = e.category || 'other';
    if (!byCategory[cat]) byCategory[cat] = { category: cat, amount: 0, count: 0 };
    byCategory[cat].amount += Number(e.amount || 0);
    byCategory[cat].count += 1;
  });
  const categories = Object.values(byCategory).sort((a, b) => b.amount - a.amount);
  const totalRevenue = sales.reduce((s, x) => s + Number(x.total || 0), 0);
  const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue * 100).toFixed(1) : 0;

  return { type: 'expense_breakdown', period: periodInfo, totalExpenses, categories, expenseCount: expenses.length, totalRevenue, expenseRatio };
};

// Debt Overview
const debtOverview = async (userId, period) => {
  const filter = getPeriodFilter(period, userId);
  const filterAll = { userId, paymentStatus: { $in: ['credit', 'partial'] } };
  if (period !== 'all') Object.assign(filterAll, filter);
  const debtSales = await Sale.find(filterAll).lean();
  const periodInfo = computePeriod(period);
  const totalDebt = debtSales.reduce((s, x) => s + Number(x.balance || 0), 0);
  const totalOriginal = debtSales.reduce((s, x) => s + Number(x.total || 0), 0);
  const totalPaid = debtSales.reduce((s, x) => s + Number(x.paidAmount || 0), 0);
  const debtors = {};
  debtSales.forEach(s => {
    const name = s.customerName || 'Unknown';
    if (!debtors[name]) debtors[name] = { name, totalDebt: 0, totalSales: 0, count: 0, phone: s.customerPhone || '' };
    debtors[name].totalDebt += Number(s.balance || 0);
    debtors[name].totalSales += Number(s.total || 0);
    debtors[name].count += 1;
  });
  const debtorList = Object.values(debtors).sort((a, b) => b.totalDebt - a.totalDebt);

  return { type: 'debt_overview', period: periodInfo, totalDebt, totalOriginal, totalPaid, debtorCount: debtorList.length, debtors: debtorList.slice(0, 10) };
};

// Inventory Alerts
const inventoryAlerts = async (userId) => {
  const products = await Product.find({ userId, visible: 'true' }).lean();
  const sixtyDaysAgo = new Date(); sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const sixtyDaysStr = sixtyDaysAgo.toISOString().split('T')[0];
  const recentSales = await Sale.find({
    userId,
    date: { $gte: sixtyDaysStr }
  }).lean();
  const recentProductNames = new Set(recentSales.map(s => s.productName));
  const lowStock = products.filter(p => Number(p.quantity) <= 5).map(p => ({
    name: p.name, qty: Number(p.quantity), value: Number(p.price || 0) * Number(p.quantity || 0)
  }));
  const deadStock = products.filter(p => {
    if (Number(p.quantity) <= 0) return false;
    return !recentProductNames.has(p.name);
  }).map(p => ({
    name: p.name, qty: Number(p.quantity), value: Number(p.price || 0) * Number(p.quantity || 0)
  }));
  const totalInventoryValue = products.reduce((s, p) => s + (Number(p.price || 0) * Number(p.quantity || 0)), 0);
  const totalProducts = products.length;

  return { type: 'inventory_alerts', totalProducts, totalInventoryValue, lowStockCount: lowStock.length, lowStock, deadStockCount: deadStock.length, deadStock: deadStock.slice(0, 10) };
};

// Sales Trend
const salesTrend = async (userId, period) => {
  const filter = getPeriodFilter(period, userId);
  const sales = await Sale.find(filter).lean();
  const periodInfo = computePeriod(period);
  const dailyMap = {};
  sales.forEach(s => {
    if (s.date) {
      if (!dailyMap[s.date]) dailyMap[s.date] = { date: s.date, revenue: 0, profit: 0, count: 0 };
      dailyMap[s.date].revenue += Number(s.total || 0);
      dailyMap[s.date].profit += Number(s.profit || 0);
      dailyMap[s.date].count += 1;
    }
  });
  const trend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  // Quick stats
  const totalRevenue = trend.reduce((s, d) => s + d.revenue, 0);
  const avgDaily = trend.length > 0 ? totalRevenue / trend.length : 0;
  const peakDay = trend.length > 0 ? trend.reduce((a, b) => a.revenue > b.revenue ? a : b) : null;
  const totalProfit = trend.reduce((s, d) => s + d.profit, 0);

  // Growth vs first half
  const mid = Math.floor(trend.length / 2);
  const firstHalf = trend.slice(0, mid).reduce((s, d) => s + d.revenue, 0);
  const secondHalf = trend.slice(mid).reduce((s, d) => s + d.revenue, 0);
  const growth = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf * 100).toFixed(1) : null;

  return { type: 'sales_trend', period: periodInfo, trend, totalRevenue, avgDaily, peakDay, totalProfit, growth, totalDays: trend.length };
};

// Customer Insights
const customerInsights = async (userId, period) => {
  const filter = getPeriodFilter(period, userId);
  const sales = await Sale.find(filter).lean();
  const customers = await Customer.find({ userId, visible: 'true' }).lean();
  const periodInfo = computePeriod(period);
  const customerMap = {};
  sales.forEach(s => {
    const name = s.customerName || 'Walk-in';
    if (!customerMap[name]) customerMap[name] = { name, revenue: 0, profit: 0, count: 0, phone: s.customerPhone || '' };
    customerMap[name].revenue += Number(s.total || 0);
    customerMap[name].profit += Number(s.profit || 0);
    customerMap[name].count += 1;
  });
  const topCustomers = Object.values(customerMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const totalCustomers = customers.length;
  const activeCustomers = Object.keys(customerMap).length;
  const returning = Object.values(customerMap).filter(c => c.count > 1).length;
  const repeatRate = activeCustomers > 0 ? (returning / activeCustomers * 100).toFixed(1) : 0;
  const totalRevenue = sales.reduce((s, x) => s + Number(x.total || 0), 0);
  const avgPerCustomer = activeCustomers > 0 ? totalRevenue / activeCustomers : 0;

  return { type: 'customer_insights', period: periodInfo, totalCustomers, activeCustomers, returning, repeatRate, avgPerCustomer, totalRevenue, topCustomers };
};

// Capital Analysis
const capitalAnalysis = async (userId) => {
  const capitalRecords = await Capital.find({ userId, visible: 'true' }).lean();
  const expenses = await Expense.find({ userId, visible: 'true' }).lean();
  const totalInjected = capitalRecords.reduce((s, x) => s + Number(x.amount || 0), 0);
  const totalUtilized = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
  const remaining = totalInjected - totalUtilized;
  const utilizationRate = totalInjected > 0 ? Math.min(100, (totalUtilized / totalInjected * 100)).toFixed(1) : 0;
  const bySource = {};
  capitalRecords.forEach(c => {
    const src = c.source || 'personal';
    if (!bySource[src]) bySource[src] = { source: src, amount: 0, count: 0 };
    bySource[src].amount += Number(c.amount || 0);
    bySource[src].count += 1;
  });
  const sources = Object.values(bySource).sort((a, b) => b.amount - a.amount);

  return { type: 'capital_analysis', totalInjected, totalUtilized, remaining, utilizationRate, capitalCount: capitalRecords.length, sources };
};

// Prediction (moving average based)
const prediction = async (userId) => {
  const sales = await Sale.find({ userId }).sort({ date: 1 }).lean();
  const dailyMap = {};
  sales.forEach(s => {
    if (s.date) {
      dailyMap[s.date] = (dailyMap[s.date] || 0) + Number(s.total || 0);
    }
  });
  const dailyRevenues = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  const n = dailyRevenues.length;
  if (n < 7) return { type: 'prediction', canPredict: false, message: 'Need at least 7 days of data to predict' };

  // 7-day moving average
  const last7 = dailyRevenues.slice(-7);
  const ma7 = last7.reduce((s, v) => s + v, 0) / 7;

  // Linear regression for trend
  const indices = Array.from({ length: n }, (_, i) => i);
  const sumX = indices.reduce((s, x) => s + x, 0);
  const sumY = dailyRevenues.reduce((s, y) => s + y, 0);
  const sumXY = indices.reduce((s, x) => s + x * dailyRevenues[x], 0);
  const sumX2 = indices.reduce((s, x) => s + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Predict next 7 days
  const predictions = [];
  for (let i = 1; i <= 7; i++) {
    const predicted = intercept + slope * (n + i - 1);
    predictions.push({ day: i, predicted: Math.max(0, Math.round(predicted)) });
  }

  // Current month projection
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysLeft = daysInMonth - dayOfMonth;
  const thisMonthSales = dailyRevenues.slice(-dayOfMonth);
  const monthAvg = thisMonthSales.length > 0 ? thisMonthSales.reduce((s, v) => s + v, 0) / thisMonthSales.length : 0;
  const projectedMonthTotal = thisMonthSales.reduce((s, v) => s + v, 0) + (monthAvg * daysLeft);
  const currentMonthTotal = thisMonthSales.reduce((s, v) => s + v, 0);

  return {
    type: 'prediction', canPredict: true,
    todayPrediction: Math.round(ma7),
    next7Days: predictions,
    currentMonthTotal: Math.round(currentMonthTotal),
    projectedMonthTotal: Math.round(projectedMonthTotal),
    avgLast7Days: Math.round(ma7),
    trend: slope > 0 ? 'up' : slope < 0 ? 'down' : 'stable',
    dataPoints: n,
    recentAvg: Math.round(last7.reduce((s, v) => s + v, 0) / 7),
    slope: Math.round(slope * 100) / 100
  };
};

// Main query handler
router.post('/query', async (req, res) => {
  try {
    const { type, period = 'all' } = req.body;
    const userId = req.user.email;
    if (!type) return res.status(400).json({ error: 'Query type required' });

    let result;
    switch (type) {
      case 'sales_summary': result = await salesSummary(userId, period); break;
      case 'top_products': result = await topProducts(userId, period); break;
      case 'profit_analysis': result = await profitAnalysis(userId, period); break;
      case 'expense_breakdown': result = await expenseBreakdown(userId, period); break;
      case 'debt_overview': result = await debtOverview(userId, period); break;
      case 'inventory_alerts': result = await inventoryAlerts(userId); break;
      case 'sales_trend': result = await salesTrend(userId, period); break;
      case 'customer_insights': result = await customerInsights(userId, period); break;
      case 'capital_analysis': result = await capitalAnalysis(userId); break;
      case 'prediction': result = await prediction(userId); break;
      default: return res.status(400).json({ error: `Unknown query type: ${type}` });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
