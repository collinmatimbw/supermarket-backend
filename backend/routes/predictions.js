const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');

router.get('/predictions', async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user.email });
    const products = await Product.find({ userId: req.user.email });

    if (sales.length === 0 || products.length === 0) {
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

    // Check for negative profit sales (sold below cost)
    const negativeProfitSales = sales.filter(s => Number(s.profit || 0) < 0);
    const profitHealth = negativeProfitSales.length > 0 ? 'declining' : (profitTrend > 0 ? 'growing' : 'stable');

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

    const productSalesMap = {};
    sales.forEach(s => {
      const pid = s.productId || 'unknown';
      if (!productSalesMap[pid]) productSalesMap[pid] = { quantity: 0, revenue: 0, profit: 0 };
      productSalesMap[pid].quantity += Number(s.quantity || 0);
      productSalesMap[pid].revenue += Number(s.total || 0);
      productSalesMap[pid].profit += Number(s.profit || 0);
    });

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const productPredictions = products.map(p => {
      const pid = p.id || p._id.toString();
      const ps = productSalesMap[pid] || { quantity: 0, revenue: 0, profit: 0 };
      const revenueShare = totalRevenue > 0 ? ((ps.revenue / totalRevenue) * 100).toFixed(1) : 0;
      const margin = ps.revenue > 0 ? ((ps.profit / ps.revenue) * 100).toFixed(1) : 0;
      const avgDailyQty = sortedDates.length > 0 ? ps.quantity / sortedDates.length : 0;
      const daysUntilStockout = p.quantity > 0 && avgDailyQty > 0 ? Math.round(p.quantity / avgDailyQty) : 999;
      const predictedWeekly = Math.round(avgDailyQty * 7);

      return {
        name: p.name || 'Unknown',
        category: p.category || 'Uncategorized',
        currentRevenue: Math.round(ps.revenue),
        predictedWeeklyRevenue: Math.round(ps.revenue * 1.1),
        revenue: Math.round(ps.revenue),
        profit: Math.round(ps.profit),
        margin: Number(margin),
        quantity: ps.quantity,
        revenueShare: Number(revenueShare),
        performance: Number(revenueShare) > 10 ? 'excellent' : Number(revenueShare) > 5 ? 'good' : Number(revenueShare) > 2 ? 'average' : 'poor',
        daysUntilStockout,
        recommendation: {
          priority: daysUntilStockout < 7 ? 'high' : daysUntilStockout < 14 ? 'medium' : 'low',
          message: daysUntilStockout < 7 ? `Restock soon - ${daysUntilStockout} days left` : 'Stock level OK',
        },
      };
    }).filter(p => p.quantity > 0 || p.revenue > 0);

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
          profit: profitHealth,
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
          summary: { totalProducts: 0, topPerformers: 0, underperformers: 0, totalCategories: 0 },
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
      if (!productSalesMap[pid]) productSalesMap[pid] = { quantity: 0, revenue: 0, profit: 0 };
      productSalesMap[pid].quantity += Number(s.quantity || 0);
      productSalesMap[pid].revenue += Number(s.total || 0);
      productSalesMap[pid].profit += Number(s.profit || 0);
    });

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    Object.entries(productSalesMap).forEach(([pid, data]) => {
      const product = products.find(p => (p.id || p._id.toString()) === pid);
      const revenueShare = totalRevenue > 0 ? ((data.revenue / totalRevenue) * 100).toFixed(1) : 0;
      const margin = data.revenue > 0 ? ((data.profit / data.revenue) * 100).toFixed(1) : 0;
      productPerformance.push({
        name: product?.name || pid,
        category: product?.category || 'Unknown',
        revenue: Math.round(data.revenue),
        profit: Math.round(data.profit),
        margin: Number(margin),
        quantity: data.quantity,
        revenueShare: Number(revenueShare),
        performance: Number(margin) < 0 ? 'poor' : Number(revenueShare) > 10 ? 'excellent' : Number(revenueShare) > 5 ? 'good' : Number(revenueShare) > 2 ? 'average' : 'poor',
      });
    });
    productPerformance.sort((a, b) => b.revenue - a.revenue);

    const categoryMap = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, revenue: 0, profit: 0 };
      categoryMap[cat].count += 1;
    });
    sales.forEach(s => {
      const cat = s.category || 'Unknown';
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, revenue: 0, profit: 0 };
      categoryMap[cat].revenue += Number(s.total || 0);
      categoryMap[cat].profit += Number(s.profit || 0);
    });

    const categoryInsights = Object.entries(categoryMap).map(([name, data]) => ({
      category: name,
      productCount: data.count,
      revenue: Math.round(data.revenue),
      profit: Math.round(data.profit),
      performance: data.revenue > 10000 ? 'high' : data.revenue > 5000 ? 'medium' : 'low',
    }));

    const topPerformers = productPerformance.filter(p => p.performance === 'excellent' || p.performance === 'good').length;
    const underperformers = productPerformance.filter(p => p.performance === 'poor').length;

    const recommendations = [];
    if (productPerformance.length > 0) {
      recommendations.push({
        type: 'opportunity',
        title: 'Top Performer',
        description: `${productPerformance[0].name} leads with ${productPerformance[0].revenue.toLocaleString()} revenue`,
        impact: 'high',
      });
    }
    if (underperformers > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Underperforming Products',
        description: `${underperformers} products have low sales or negative margins - consider discounting or removing`,
        impact: 'medium',
      });
    }
    const negativeMargin = productPerformance.filter(p => p.margin < 0);
    if (negativeMargin.length > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Products Sold Below Cost',
        description: `${negativeMargin.length} products are being sold at a loss - review pricing immediately`,
        impact: 'high',
      });
    }
    recommendations.push({
      type: 'insight',
      title: 'Portfolio Overview',
      description: `${productPerformance.length} products across ${categoryInsights.length} categories`,
      impact: 'low',
    });

    const monthSales = {};
    sales.forEach(s => {
      const month = s.date?.slice(0, 7) || 'unknown';
      if (!monthSales[month]) monthSales[month] = 0;
      monthSales[month] += Number(s.total || 0);
    });
    const seasonalTrends = Object.entries(monthSales).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue),
      trend: 'stable',
    }));
    seasonalTrends.sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      data: {
        summary: {
          totalProducts: productPerformance.length,
          topPerformers: topPerformers,
          underperformers: underperformers,
          totalCategories: categoryInsights.length,
        },
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