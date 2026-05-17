const express = require('express');
const router = express.Router();
const { readSheet } = require('../helpers/googleSheets');

router.get('/predictions', async (req, res) => {
  try {
    const sales = await readSheet(req.user.spreadsheetId, 'sales');
    const products = await readSheet(req.user.spreadsheetId, 'products');

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
        dailySales[date] = { revenue: 0, profit: 0, transactions: 0, quantity: 0 };
      }
      dailySales[date].revenue += Number(s.total) || 0;
      dailySales[date].profit += Number(s.profit) || 0;
      dailySales[date].transactions += 1;
      dailySales[date].quantity += Number(s.quantity) || 0;
    });

    const sortedDates = Object.keys(dailySales).sort();
    const revenues = sortedDates.map(d => dailySales[d].revenue);
    const profits = sortedDates.map(d => dailySales[d].profit);
    const transactions = sortedDates.map(d => dailySales[d].transactions);

    const forecastDays = 7;
    const salesForecast = [];
    const revenueTrend = calculateTrend(revenues);
    const profitTrend = calculateTrend(profits);
    const transactionTrend = calculateTrend(transactions);

    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    const avgProfit = profits.reduce((a, b) => a + b, 0) / profits.length;
    const avgTransactions = transactions.reduce((a, b) => a + b, 0) / transactions.length;

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      const dateStr = forecastDate.toISOString().split('T')[0];

      const dayOfWeek = forecastDate.getDay();
      const weekendFactor = (dayOfWeek === 5 || dayOfWeek === 6) ? 1.15 : 1.0;

      const predictedRevenue = Math.max(0, (avgRevenue + revenueTrend * i) * weekendFactor);
      const predictedProfit = Math.max(0, (avgProfit + profitTrend * i) * weekendFactor);
      const predictedTransactions = Math.max(1, Math.round((avgTransactions + transactionTrend * i) * weekendFactor));

      salesForecast.push({
        date: dateStr,
        predictedRevenue: Math.round(predictedRevenue),
        predictedProfit: Math.round(predictedProfit),
        predictedTransactions,
        confidence: calculateConfidence(sales.length, i),
      });
    }

    const productPredictions = getProductPredictions(sales, products);

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
    const sales = await readSheet(req.user.spreadsheetId, 'sales');
    const products = await readSheet(req.user.spreadsheetId, 'products');

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

    const productPerformance = analyzeProductPerformance(sales, products);
    const categoryInsights = analyzeCategories(sales, products);
    const recommendations = generateRecommendations(productPerformance, categoryInsights, sales);
    const seasonalTrends = analyzeSeasonalTrends(sales);
    const customerInsights = analyzeCustomerBehavior(sales);

    res.json({
      success: true,
      data: {
        productPerformance,
        categoryInsights,
        recommendations,
        seasonalTrends,
        customerInsights,
        summary: {
          totalProducts: productPerformance.length,
          topPerformers: productPerformance.filter(p => p.performance === 'excellent' || p.performance === 'good').length,
          underperformers: productPerformance.filter(p => p.performance === 'poor').length,
          totalCategories: categoryInsights.length,
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

function calculateTrend(data) {
  if (data.length < 2) return 0;
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
  }
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

function calculateConfidence(dataPoints, forecastDay) {
  const baseConfidence = Math.min(80, 40 + dataPoints * 0.5);
  const decayFactor = Math.max(0.5, 1 - (forecastDay - 1) * 0.08);
  return Math.round(baseConfidence * decayFactor);
}

function getProductPredictions(sales, products) {
  const productSales = {};
  sales.forEach(s => {
    const name = s.productName;
    if (!productSales[name]) {
      productSales[name] = { totalRevenue: 0, totalQuantity: 0, totalProfit: 0, transactions: 0, dates: [] };
    }
    productSales[name].totalRevenue += Number(s.total) || 0;
    productSales[name].totalQuantity += Number(s.quantity) || 0;
    productSales[name].totalProfit += Number(s.profit) || 0;
    productSales[name].transactions += 1;
    productSales[name].dates.push(s.date);
  });

  const predictions = Object.entries(productSales)
    .map(([name, data]) => {
      const uniqueDates = [...new Set(data.dates)].sort();
      const dailyRevenues = uniqueDates.map(d => {
        return sales.filter(s => s.productName === name && s.date === d)
          .reduce((sum, s) => sum + Number(s.total), 0);
      });
      const trend = calculateTrend(dailyRevenues);
      const avgDailyRevenue = data.totalRevenue / uniqueDates.length;
      const predictedWeeklyRevenue = Math.max(0, (avgDailyRevenue + trend) * 7);

      const prod = products.find(p => p.name === name);
      const currentStock = prod ? Number(prod.quantity) : 0;
      const avgDailyQty = data.totalQuantity / uniqueDates.length;
      const daysUntilStockout = avgDailyQty > 0 ? Math.round(currentStock / avgDailyQty) : Infinity;

      return {
        name,
        currentRevenue: Math.round(data.totalRevenue),
        predictedWeeklyRevenue: Math.round(predictedWeeklyRevenue),
        trend: trend > 5 ? 'rising' : trend < -5 ? 'declining' : 'stable',
        totalQuantity: data.totalQuantity,
        totalProfit: Math.round(data.totalProfit),
        transactions: data.transactions,
        currentStock,
        daysUntilStockout: daysUntilStockout === Infinity ? null : daysUntilStockout,
        recommendation: getStockRecommendation(daysUntilStockout, trend),
      };
    })
    .sort((a, b) => b.currentRevenue - a.currentRevenue);

  return predictions.slice(0, 20);
}

function getStockRecommendation(daysUntilStockout, trend) {
  if (daysUntilStockout !== null && daysUntilStockout <= 3) {
    return { action: 'reorder_urgent', message: 'Urgent: Restock needed within 3 days', priority: 'high' };
  }
  if (daysUntilStockout !== null && daysUntilStockout <= 7) {
    return { action: 'reorder_soon', message: 'Plan reorder within this week', priority: 'medium' };
  }
  if (trend === 'rising') {
    return { action: 'increase_stock', message: 'Consider increasing stock - demand rising', priority: 'medium' };
  }
  if (trend === 'declining') {
    return { action: 'reduce_stock', message: 'Consider reducing stock - demand declining', priority: 'low' };
  }
  return { action: 'maintain', message: 'Stock levels adequate', priority: 'low' };
}

function analyzeProductPerformance(sales, products) {
  const productData = {};
  sales.forEach(s => {
    const name = s.productName;
    if (!productData[name]) {
      productData[name] = { revenue: 0, quantity: 0, profit: 0, transactions: 0, category: 'General' };
    }
    productData[name].revenue += Number(s.total) || 0;
    productData[name].quantity += Number(s.quantity) || 0;
    productData[name].profit += Number(s.profit) || 0;
    productData[name].transactions += 1;
    const prod = products.find(p => p.name === name);
    if (prod) productData[name].category = prod.category;
  });

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const avgRevenue = totalRevenue / Object.keys(productData).length;

  return Object.entries(productData)
    .map(([name, data]) => {
      const revenueShare = (data.revenue / totalRevenue) * 100;
      const margin = data.revenue > 0 ? ((data.profit / data.revenue) * 100) : 0;
      let performance;
      if (data.revenue > avgRevenue * 1.5 && margin > 20) performance = 'excellent';
      else if (data.revenue > avgRevenue) performance = 'good';
      else if (data.revenue > avgRevenue * 0.5) performance = 'average';
      else performance = 'poor';

      return {
        name,
        category: data.category,
        revenue: Math.round(data.revenue),
        profit: Math.round(data.profit),
        quantity: data.quantity,
        transactions: data.transactions,
        revenueShare: revenueShare.toFixed(1),
        margin: margin.toFixed(1),
        performance,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

function analyzeCategories(sales, products) {
  const catData = {};
  sales.forEach(s => {
    const prod = products.find(p => p.id === s.productId);
    const cat = prod ? prod.category : 'General';
    if (!catData[cat]) {
      catData[cat] = { revenue: 0, profit: 0, products: new Set(), transactions: 0 };
    }
    catData[cat].revenue += Number(s.total) || 0;
    catData[cat].profit += Number(s.profit) || 0;
    catData[cat].products.add(s.productName);
    catData[cat].transactions += 1;
  });

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);

  return Object.entries(catData)
    .map(([category, data]) => ({
      category,
      revenue: Math.round(data.revenue),
      profit: Math.round(data.profit),
      productCount: data.products.size,
      transactions: data.transactions,
      share: ((data.revenue / totalRevenue) * 100).toFixed(1),
      avgTransaction: Math.round(data.revenue / data.transactions),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

function generateRecommendations(productPerformance, categoryInsights, sales) {
  const recommendations = [];

  const topProducts = productPerformance.slice(0, 3);
  if (topProducts.length > 0) {
    recommendations.push({
      type: 'opportunity',
      title: 'Top Performers',
      description: `Focus on ${topProducts.map(p => p.name).join(', ')} - they generate the most revenue`,
      impact: 'high',
    });
  }

  const poorProducts = productPerformance.filter(p => p.performance === 'poor');
  if (poorProducts.length > 0) {
    recommendations.push({
      type: 'warning',
      title: 'Underperforming Products',
      description: `Consider discounting or replacing: ${poorProducts.slice(0, 3).map(p => p.name).join(', ')}`,
      impact: 'medium',
    });
  }

  const topCategory = categoryInsights[0];
  if (topCategory) {
    recommendations.push({
      type: 'insight',
      title: 'Leading Category',
      description: `${topCategory.category} dominates with ${topCategory.share}% of revenue. Consider expanding this category.`,
      impact: 'high',
    });
  }

  const dailyTotals = {};
  sales.forEach(s => {
    if (!dailyTotals[s.date]) dailyTotals[s.date] = 0;
    dailyTotals[s.date] += Number(s.total);
  });
  const avgDaily = Object.values(dailyTotals).reduce((a, b) => a + b, 0) / Object.keys(dailyTotals).length;
  const recentDates = Object.keys(dailyTotals).sort().slice(-7);
  const recentAvg = recentDates.reduce((sum, d) => sum + dailyTotals[d], 0) / recentDates.length;

  if (recentAvg > avgDaily * 1.1) {
    recommendations.push({
      type: 'positive',
      title: 'Sales Trending Up',
      description: 'Recent sales are above average. Ensure adequate stock levels.',
      impact: 'high',
    });
  } else if (recentAvg < avgDaily * 0.9) {
    recommendations.push({
      type: 'warning',
      title: 'Sales Trending Down',
      description: 'Recent sales are below average. Consider promotions or discounts.',
      impact: 'medium',
    });
  }

  const highMarginProducts = productPerformance.filter(p => parseFloat(p.margin) > 30);
  if (highMarginProducts.length > 0) {
    recommendations.push({
      type: 'opportunity',
      title: 'High Margin Products',
      description: `Promote ${highMarginProducts.slice(0, 2).map(p => p.name).join(', ')} for maximum profit`,
      impact: 'medium',
    });
  }

  return recommendations;
}

function analyzeSeasonalTrends(sales) {
  const dayOfWeekSales = {};
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  sales.forEach(s => {
    const date = new Date(s.date);
    const dayName = days[date.getDay()];
    if (!dayOfWeekSales[dayName]) {
      dayOfWeekSales[dayName] = { revenue: 0, transactions: 0, count: 0 };
    }
    dayOfWeekSales[dayName].revenue += Number(s.total) || 0;
    dayOfWeekSales[dayName].transactions += 1;
    dayOfWeekSales[dayName].count += 1;
  });

  return days.map(day => {
    const data = dayOfWeekSales[day];
    return {
      day,
      avgRevenue: data ? Math.round(data.revenue / data.count) : 0,
      avgTransactions: data ? Math.round(data.transactions / data.count) : 0,
      isPeak: data && data.revenue > 0,
    };
  }).sort((a, b) => b.avgRevenue - a.avgRevenue);
}

function analyzeCustomerBehavior(sales) {
  const customerData = {};
  sales.forEach(s => {
    const custId = s.customerId || 'walk-in';
    const custName = s.customerName || 'Walk-in Customer';
    if (!customerData[custId]) {
      customerData[custId] = { name: custName, totalSpent: 0, transactions: 0, products: new Set() };
    }
    customerData[custId].totalSpent += Number(s.total) || 0;
    customerData[custId].transactions += 1;
    customerData[custId].products.add(s.productName);
  });

  const customers = Object.values(customerData)
    .map(c => ({
      name: c.name,
      totalSpent: Math.round(c.totalSpent),
      transactions: c.transactions,
      uniqueProducts: c.products.size,
      avgOrderValue: Math.round(c.totalSpent / c.transactions),
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);

  const walkIn = customers.filter(c => c.name === 'Walk-in Customer');
  const registered = customers.filter(c => c.name !== 'Walk-in Customer');

  return {
    totalCustomers: customers.length,
    registeredCustomers: registered.length,
    walkInCustomers: walkIn.length,
    topCustomers: customers.slice(0, 5).filter(c => c.name !== 'Walk-in Customer'),
    avgOrderValue: customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + c.avgOrderValue, 0) / customers.length) : 0,
  };
}

module.exports = router;
