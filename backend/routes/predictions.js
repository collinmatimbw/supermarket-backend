const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');

router.get('/predictions', async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user.email });
    const products = await Product.find({ userId: req.user.email });

    if (sales.length === 0) {
      return res.json({
        success: true,
        data: {
          salesForecast: [],
          productPredictions: [],
          confidence: 0,
          message: 'No sales data available for prediction',
        }
      });
    }

    const dailySales = {};
    sales.forEach(s => {
      const date = s.date;
      if (!dailySales[date]) {
        dailySales[date] = { revenue: 0, profit: 0, transactions: 0 };
      }
      dailySales[date].revenue += Number(s.total || 0);
      dailySales[date].profit += Number(s.profit || 0);
      dailySales[date].transactions += 1;
    });

    const sortedDates = Object.keys(dailySales).sort();
    const revenues = sortedDates.map(d => dailySales[d].revenue);
    const profits = sortedDates.map(d => dailySales[d].profit);
    const transactions = sortedDates.map(d => dailySales[d].transactions);

    const calculateTrend = (arr) => {
      if (arr.length < 2) return 0;
      const n = arr.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = arr.reduce((a, b) => a + b, 0);
      const sumXY = arr.reduce((sum, y, x) => sum + x * y, 0);
      const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      return slope || 0;
    };

    const revenueTrend = calculateTrend(revenues);
    const profitTrend = calculateTrend(profits);
    const transactionTrend = calculateTrend(transactions);

    const avgRevenue = revenues.length > 0 ? revenues.reduce((a, b) => a + b, 0) / revenues.length : 0;
    const avgProfit = profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0;
    const avgTransactions = transactions.length > 0 ? transactions.reduce((a, b) => a + b, 0) / transactions.length : 0;

    const forecastDays = 7;
    const salesForecast = [];
    const lastDate = sortedDates.length > 0 ? new Date(sortedDates[sortedDates.length - 1]) : new Date();

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      const dateStr = forecastDate.toISOString().split('T')[0];

      const predictedRevenue = Math.max(0, avgRevenue + revenueTrend * i);
      const predictedProfit = Math.max(0, avgProfit + profitTrend * i);
      const predictedTransactions = Math.max(1, Math.round(avgTransactions + transactionTrend * i));

      salesForecast.push({
        date: dateStr,
        predictedRevenue: Math.round(predictedRevenue),
        predictedProfit: Math.round(predictedProfit),
        predictedTransactions,
        confidence: Math.min(90, Math.max(40, 50 + sales.length / 10)),
      });
    }

    const productPredictions = [];
    const productSales = {};
    sales.forEach(s => {
      const pid = s.productId || 'unknown';
      if (!productSales[pid]) productSales[pid] = { quantity: 0, revenue: 0 };
      productSales[pid].quantity += Number(s.quantity || 0);
      productSales[pid].quantity += Number(s.total || 0);
    });

    Object.entries(productSales).forEach(([pid, data]) => {
      productPredictions.push({
        productId: pid,
        predictedDemand: data.quantity > 10 ? 'high' : data.quantity > 5 ? 'medium' : 'low',
        confidence: Math.min(85, 40 + data.quantity * 5),
      });
    });

    const totalDataPoints = sales.length;
    const overallConfidence = Math.min(95, Math.max(30, 50 + (totalDataPoints > 30 ? 30 : totalDataPoints)));

    res.json({
      success: true,
      data: {
        salesForecast,
        productPredictions,
        confidence: overallConfidence,
        historicalAvg: {
          dailyRevenue: Math.round(avgRevenue),
          dailyProfit: Math.round(avgProfit),
          dailyTransactions: Math.round(avgTransactions),
        },
        trends: {
          revenue: revenueTrend > 0 ? 'up' : revenueTrend < 0 ? 'down' : 'stable',
          profit: profitTrend > 0 ? 'up' : profitTrend < 0 ? 'down' : 'stable',
          transactions: transactionTrend > 0 ? 'up' : transactionTrend < 0 ? 'down' : 'stable',
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/market-analysis', async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user.email });
    const products = await Product.find({ userId: req.user.email });

    if (sales.length === 0) {
      return res.json({
        success: true,
        data: {
          productPerformance: [],
          categoryInsights: [],
          recommendations: [],
          seasonalTrends: [],
          message: 'No sales data available for analysis',
        }
      });
    }

    const productPerformance = [];
    const productSalesMap = {};
    sales.forEach(s => {
      const pid = s.productId || 'unknown';
      if (!productSalesMap[pid]) productSalesMap[pid] = { quantity: 0, revenue: 0 };
      productSalesMap[pid].quantity += Number(s.quantity || 0);
      productSalesMap[pid].revenue += Number(s.total || 0);
    });

    Object.entries(productSalesMap).forEach(([pid, data]) => {
      productPerformance.push({
        productId: pid,
        totalQuantity: data.quantity,
        totalRevenue: data.revenue,
        performance: data.revenue > 10000 ? 'excellent' : data.revenue > 5000 ? 'good' : data.revenue > 1000 ? 'average' : 'poor',
      });
    });
    productPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue);

    const categoryMap = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, revenue: 0 };
      categoryMap[cat].count += 1;
    });
    sales.forEach(s => {
      const cat = s.category || 'Unknown';
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, revenue: 0 };
      categoryMap[cat].revenue += Number(s.total || 0);
    });

    const categoryInsights = Object.entries(categoryMap).map(([name, data]) => ({
      category: name,
      productCount: data.count,
      totalRevenue: data.revenue,
      performance: data.revenue > 10000 ? 'high' : data.revenue > 5000 ? 'medium' : 'low',
    }));

    const recommendations = [];
    if (productPerformance.length > 0) {
      recommendations.push({
        type: 'stock',
        priority: 'high',
        message: `Top performer: ${productPerformance[0].productId} with ${productPerformance[0].totalRevenue.toLocaleString()} revenue`,
        impact: 'high',
      });
    }
    if (productPerformance.filter(p => p.performance === 'poor').length > 0) {
      recommendations.push({
        type: 'discount',
        priority: 'medium',
        message: `${productPerformance.filter(p => p.performance === 'poor').length} products underperforming - consider promotion`,
        impact: 'medium',
      });
    }

    const seasonalTrends = [];
    const monthSales = {};
    sales.forEach(s => {
      const month = s.date?.slice(0, 7) || 'unknown';
      if (!monthSales[month]) monthSales[month] = 0;
      monthSales[month] += Number(s.total || 0);
    });
    Object.entries(monthSales).forEach(([month, revenue]) => {
      seasonalTrends.push({ month, revenue, trend: 'stable' });
    });
    seasonalTrends.sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      data: {
        productPerformance: productPerformance.slice(0, 20),
        categoryInsights,
        recommendations,
        seasonalTrends,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;