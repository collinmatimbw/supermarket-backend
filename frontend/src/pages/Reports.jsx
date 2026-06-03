import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Users, Package, ShoppingCart, Download } from 'lucide-react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, ArcElement, Filler, BarElement
} from 'chart.js';
import PageHeader from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import api from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

export default function Reports() {
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const PERIODS = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
    { key: '1y', label: '1 Year' },
    { key: 'all', label: 'All Time' },
  ];

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/sales/analytics?period=${period}`),
      api.get('/products'),
      api.get('/sales'),
    ]).then(([a, p, s]) => {
      setAnalytics(a.data.data);
      setProducts(p.data.data);
      setSales(s.data.data);
    }).finally(() => setLoading(false));
  }, [period]);

  if (loading) return <LoadingState message="Loading reports..." />;

  const totalRevenue = sales.reduce((s, sale) => s + Number(sale.total || 0), 0);
  const totalProfit = sales.reduce((s, sale) => s + Number(sale.profit || 0), 0);
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;
  const totalCustomers = sales.filter(s => s.customerName && s.customerName !== 'Walk-in').length;
  const lowStockCount = products.filter(p => Number(p.quantity) <= 10).length;

  const productSales = {};
  sales.forEach(s => {
    productSales[s.productName] = (productSales[s.productName] || 0) + Number(s.total || 0);
  });
  const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, revenue]) => ({ name, revenue }));
  const productLabels = topProducts.map(p => p.name.length > 12 ? p.name.slice(0, 12) + '...' : p.name);

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#64748b', font: { family: 'Sora', size: 11 } } }, tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, titleColor: '#94a3b8', bodyColor: '#f1f5f9', padding: 12 } },
    scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { family: 'Sora', size: 11 } } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { family: 'Sora', size: 11 }, callback: v => 'TZS ' + v.toLocaleString() } } }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Reports" subtitle="Profit & Loss, sales, and customer reports" />

      {/* Period Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {PERIODS.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${period === p.key ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200 bg-white/5'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-emerald-400 mb-2"><DollarSign size={18} /><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Revenue</span></div>
          <p className="text-2xl font-bold text-white">TZS {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-blue-400 mb-2"><TrendingUp size={18} /><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Profit</span></div>
          <p className="text-2xl font-bold text-white">TZS {totalProfit.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Margin: {profitMargin}%</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-purple-400 mb-2"><Users size={18} /><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customers</span></div>
          <p className="text-2xl font-bold text-white">{totalCustomers}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-amber-400 mb-2"><Package size={18} /><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Low Stock</span></div>
          <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-400' : 'text-white'}`}>{lowStockCount}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Sales Trend</h3>
            <TrendingUp size={16} className="text-slate-500" />
          </div>
          <div style={{ height: 220 }}>
            {analytics?.dailyRevenue?.length > 0 ? (
              <Line data={{
                labels: analytics.dailyRevenue.map(d => d.date.length === 7 ? d.date.slice(5) : d.date.slice(5)),
                datasets: [{ label: 'Revenue', data: analytics.dailyRevenue.map(d => d.revenue), borderColor: '#6ee7b7', backgroundColor: 'rgba(110,231,183,0.06)', pointBackgroundColor: '#6ee7b7', pointRadius: 3, tension: 0.4, fill: true }]
              }} options={chartOpts} />
            ) : <div className="flex items-center justify-center h-full text-slate-600 text-sm">No data</div>}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Top Products</h3>
            <ShoppingCart size={16} className="text-slate-500" />
          </div>
          <div style={{ height: 220 }}>
            {topProducts.length > 0 ? (
              <Bar data={{
                labels: productLabels,
                datasets: [{ label: 'Revenue', data: topProducts.map(p => p.revenue), backgroundColor: 'rgba(110,231,183,0.7)', borderRadius: 8 }]
              }} options={chartOpts} />
            ) : <div className="flex items-center justify-center h-full text-slate-600 text-sm">No data</div>}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      {topProducts.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">Top Products by Revenue</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-3 px-2 font-medium">#</th>
                  <th className="text-left py-3 px-2 font-medium">Product</th>
                  <th className="text-right py-3 px-2 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-white/5">
                    <td className="py-3 px-2 text-slate-500">{i + 1}</td>
                    <td className="py-3 px-2 text-white">{p.name}</td>
                    <td className="py-3 px-2 text-right text-emerald-400 font-medium">TZS {p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
