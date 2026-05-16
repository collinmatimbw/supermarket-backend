import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { LoadingState } from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle,
  Lightbulb, Target, Package, BarChart3, Brain, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const tooltipStyle = {
  backgroundColor: 'rgba(15,23,42,0.95)',
  borderColor: 'rgba(255,255,255,0.08)',
  borderWidth: 1,
  titleColor: '#94a3b8',
  bodyColor: '#f1f5f9',
  padding: 12,
};

export default function Predictions() {
  const [predictions, setPredictions] = useState(null);
  const [marketAnalysis, setMarketAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('predictions');

  useEffect(() => {
    Promise.all([
      api.get('/predictions/predictions'),
      api.get('/predictions/market-analysis'),
    ]).then(([predRes, marketRes]) => {
      setPredictions(predRes.data.data);
      setMarketAnalysis(marketRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading predictions & analysis..." />;

  const trendIcon = (trend) => {
    if (trend === 'up') return <ArrowUpRight size={16} className="text-emerald-400" />;
    if (trend === 'down') return <ArrowDownRight size={16} className="text-red-400" />;
    return <Minus size={16} className="text-slate-400" />;
  };

  const performanceColor = (perf) => {
    switch (perf) {
      case 'excellent': return 'text-emerald-400 bg-emerald-400/10';
      case 'good': return 'text-blue-400 bg-blue-400/10';
      case 'average': return 'text-yellow-400 bg-yellow-400/10';
      case 'poor': return 'text-red-400 bg-red-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const impactColor = (impact) => {
    switch (impact) {
      case 'high': return 'text-emerald-400 bg-emerald-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'low': return 'text-slate-400 bg-slate-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const recommendationIcon = (type) => {
    switch (type) {
      case 'opportunity': return <Lightbulb size={16} className="text-yellow-400" />;
      case 'warning': return <AlertTriangle size={16} className="text-red-400" />;
      case 'insight': return <Brain size={16} className="text-blue-400" />;
      case 'positive': return <CheckCircle size={16} className="text-emerald-400" />;
      default: return <Target size={16} className="text-slate-400" />;
    }
  };

  const forecastLineData = predictions?.salesForecast ? {
    labels: predictions.salesForecast.map(d => {
      const dt = new Date(d.date);
      return dt.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Predicted Revenue',
      data: predictions.salesForecast.map(d => d.predictedRevenue),
      borderColor: '#6ee7b7',
      backgroundColor: 'rgba(110,231,183,0.07)',
      pointBackgroundColor: '#6ee7b7',
      pointRadius: 5,
      tension: 0.4,
      fill: true,
    }]
  } : null;

  const productBarData = predictions?.productPredictions ? {
    labels: predictions.productPredictions.slice(0, 10).map(p => p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name),
    datasets: [
      {
        label: 'Current Revenue',
        data: predictions.productPredictions.slice(0, 10).map(p => p.currentRevenue),
        backgroundColor: 'rgba(110,231,183,0.7)',
        borderRadius: 6,
      },
      {
        label: 'Predicted Weekly',
        data: predictions.productPredictions.slice(0, 10).map(p => p.predictedWeeklyRevenue),
        backgroundColor: 'rgba(56,189,248,0.7)',
        borderRadius: 6,
      }
    ]
  } : null;

  const chartOpts = (yFormat) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#64748b', font: { family: 'Sora', size: 11 } } }, tooltip: { ...tooltipStyle, callbacks: { label: ctx => ` TZS ${ctx.raw.toLocaleString()}` } } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { family: 'Sora', size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { family: 'Sora', size: 11 }, callback: v => yFormat(v) } }
    }
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Predictions & Market Analysis" subtitle="AI-powered sales forecasting and product insights" />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('predictions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'predictions'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Brain size={14} className="inline mr-2" />
          Sales Predictions
        </button>
        <button
          onClick={() => setActiveTab('market')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'market'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <BarChart3 size={14} className="inline mr-2" />
          Market Analysis
        </button>
      </div>

      {activeTab === 'predictions' && (
        <div className="space-y-6">
          {/* Confidence & Trends */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Model Confidence</p>
              <p className="text-3xl font-bold text-emerald-400">{predictions.confidence}%</p>
              <p className="text-xs text-slate-500 mt-1">Based on {predictions.historicalAvg?.dailyTransactions || 0} avg daily transactions</p>
            </div>
            <div className="glass p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Revenue Trend</p>
              <div className="flex items-center gap-2">
                {trendIcon(predictions.trends?.revenue)}
                <p className="text-2xl font-bold text-slate-100 capitalize">{predictions.trends?.revenue}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">Avg: {formatCurrency(predictions.historicalAvg?.dailyRevenue)}</p>
            </div>
            <div className="glass p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Profit Trend</p>
              <div className="flex items-center gap-2">
                {trendIcon(predictions.trends?.profit)}
                <p className="text-2xl font-bold text-slate-100 capitalize">{predictions.trends?.profit}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">Avg: {formatCurrency(predictions.historicalAvg?.dailyProfit)}</p>
            </div>
            <div className="glass p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Transaction Trend</p>
              <div className="flex items-center gap-2">
                {trendIcon(predictions.trends?.transactions)}
                <p className="text-2xl font-bold text-slate-100 capitalize">{predictions.trends?.transactions}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">Avg: {predictions.historicalAvg?.dailyTransactions}/day</p>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="glass p-5">
            <h3 className="font-semibold text-slate-200 text-sm mb-1">7-Day Sales Forecast</h3>
            <p className="text-xs text-slate-500 mb-4">Predicted revenue for the next week</p>
            <div style={{ height: 280 }}>
              {forecastLineData ? (
                <Line data={forecastLineData} options={chartOpts(v => v >= 1000 ? (v/1000).toFixed(0)+'k' : v)} />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-slate-500">No forecast data</div>
              )}
            </div>
          </div>

          {/* Forecast Table */}
          <div className="glass p-5">
            <h3 className="font-semibold text-slate-200 text-sm mb-4">Daily Forecast Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-white/5">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Predicted Revenue</th>
                    <th className="pb-3 font-medium">Predicted Profit</th>
                    <th className="pb-3 font-medium">Transactions</th>
                    <th className="pb-3 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {predictions.salesForecast?.map((d, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3">
                        {new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 font-medium text-emerald-400">{formatCurrency(d.predictedRevenue)}</td>
                      <td className="py-3">{formatCurrency(d.predictedProfit)}</td>
                      <td className="py-3">{d.predictedTransactions}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          d.confidence >= 70 ? 'bg-emerald-400/10 text-emerald-400' :
                          d.confidence >= 50 ? 'bg-yellow-400/10 text-yellow-400' :
                          'bg-red-400/10 text-red-400'
                        }`}>
                          {d.confidence}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Predictions */}
          <div className="glass p-5">
            <h3 className="font-semibold text-slate-200 text-sm mb-1">Product Revenue Predictions</h3>
            <p className="text-xs text-slate-500 mb-4">Current vs predicted weekly revenue</p>
            <div style={{ height: 280 }}>
              {productBarData ? (
                <Bar data={productBarData} options={chartOpts(v => 'TZS '+v.toLocaleString())} />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-slate-500">No product data</div>
              )}
            </div>
          </div>

          {/* Stock Alerts */}
          {predictions.productPredictions?.some(p => p.recommendation.priority === 'high') && (
            <div className="glass p-5 border-l-4 border-red-400">
              <h3 className="font-semibold text-red-400 text-sm mb-4 flex items-center gap-2">
                <AlertTriangle size={16} /> Urgent Stock Alerts
              </h3>
              <div className="space-y-3">
                {predictions.productPredictions
                  .filter(p => p.recommendation.priority === 'high')
                  .map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-red-400/5 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-200">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.recommendation.message}</p>
                      </div>
                      <p className="text-xs text-red-400 font-medium">{p.daysUntilStockout} days left</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'market' && marketAnalysis && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Total Products</p>
              <p className="text-3xl font-bold text-slate-100">{marketAnalysis.summary?.totalProducts}</p>
            </div>
            <div className="glass p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Top Performers</p>
              <p className="text-3xl font-bold text-emerald-400">{marketAnalysis.summary?.topPerformers}</p>
            </div>
            <div className="glass p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Underperformers</p>
              <p className="text-3xl font-bold text-red-400">{marketAnalysis.summary?.underperformers}</p>
            </div>
            <div className="glass p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Categories</p>
              <p className="text-3xl font-bold text-blue-400">{marketAnalysis.summary?.totalCategories}</p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="glass p-5">
            <h3 className="font-semibold text-slate-200 text-sm mb-4 flex items-center gap-2">
              <Lightbulb size={16} className="text-yellow-400" />
              Smart Recommendations
            </h3>
            <div className="space-y-3">
              {marketAnalysis.recommendations?.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-white/5 rounded-lg">
                  <div className="mt-0.5">
                    {recommendationIcon(rec.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-slate-200 text-sm">{rec.title}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${impactColor(rec.impact)}`}>
                        {rec.impact} impact
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Performance Table */}
          <div className="glass p-5">
            <h3 className="font-semibold text-slate-200 text-sm mb-4">Product Performance Analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-white/5">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Revenue</th>
                    <th className="pb-3 font-medium">Profit</th>
                    <th className="pb-3 font-medium">Margin</th>
                    <th className="pb-3 font-medium">Qty Sold</th>
                    <th className="pb-3 font-medium">Share</th>
                    <th className="pb-3 font-medium">Performance</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {marketAnalysis.productPerformance?.map((p, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 font-medium text-slate-200">{p.name}</td>
                      <td className="py-3 text-xs">{p.category}</td>
                      <td className="py-3 text-emerald-400">{formatCurrency(p.revenue)}</td>
                      <td className="py-3">{formatCurrency(p.profit)}</td>
                      <td className="py-3">{p.margin}%</td>
                      <td className="py-3">{p.quantity}</td>
                      <td className="py-3">{p.revenueShare}%</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${performanceColor(p.performance)}`}>
                          {p.performance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Insights */}
          <div className="glass p-5">
            <h3 className="font-semibold text-slate-200 text-sm mb-4">Category Insights</h3>
            <div className="space-y-4">
              {marketAnalysis.categoryInsights?.map((cat, i) => {
                const colors = ['#6ee7b7','#38bdf8','#a78bfa','#fbbf24','#f87171','#22d3ee'];
                const maxRev = marketAnalysis.categoryInsights[0]?.revenue || 1;
                const w = (cat.revenue / maxRev) * 100;
                return (
                  <div key={i}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 mb-2 text-sm">
                      <div>
                        <span className="font-medium text-slate-200">{cat.category}</span>
                        <span className="text-xs text-slate-500 ml-2">{cat.productCount} products</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="text-xs text-slate-500">{cat.share}% share</span>
                        <span className="text-xs text-slate-500">Avg: {formatCurrency(cat.avgTransaction)}</span>
                        <span className="font-semibold text-slate-200">{formatCurrency(cat.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${w}%`, background: colors[i % colors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seasonal Trends */}
          <div className="glass p-5">
            <h3 className="font-semibold text-slate-200 text-sm mb-4">Day-of-Week Performance</h3>
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 sm:gap-3">
              {marketAnalysis.seasonalTrends?.map((day, i) => (
                <div key={i} className="text-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1 sm:mb-2">{day.day.slice(0, 3)}</p>
                  <p className="text-sm sm:text-lg font-bold text-slate-200 truncate">{formatCurrency(day.avgRevenue)}</p>
                  <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">{day.avgTransactions} sales</p>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Insights */}
          {marketAnalysis.customerInsights && (
            <div className="glass p-5">
              <h3 className="font-semibold text-slate-200 text-sm mb-4">Customer Insights</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Total Customers</p>
                  <p className="text-xl font-bold text-slate-200">{marketAnalysis.customerInsights.totalCustomers}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Registered</p>
                  <p className="text-xl font-bold text-emerald-400">{marketAnalysis.customerInsights.registeredCustomers}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Walk-in</p>
                  <p className="text-xl font-bold text-blue-400">{marketAnalysis.customerInsights.walkInCustomers}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Avg Order Value</p>
                  <p className="text-xl font-bold text-slate-200">{formatCurrency(marketAnalysis.customerInsights.avgOrderValue)}</p>
                </div>
              </div>

              {marketAnalysis.customerInsights.topCustomers?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Top Customers</h4>
                  <div className="space-y-2">
                    {marketAnalysis.customerInsights.topCustomers.map((cust, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-medium text-slate-200 text-sm">{cust.name}</p>
                            <p className="text-xs text-slate-500">{cust.transactions} transactions · {cust.uniqueProducts} products</p>
                          </div>
                        </div>
                        <p className="font-semibold text-emerald-400">{formatCurrency(cust.totalSpent)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
