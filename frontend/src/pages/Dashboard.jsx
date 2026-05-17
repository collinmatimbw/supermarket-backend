import React, { useEffect, useState } from 'react';
import { Package, ShoppingCart, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import StatCard from '../components/StatCard';
import { LoadingState } from '../components/LoadingState';
import api from '../utils/api';
import { formatCurrency, formatDate, isLowStock } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

export default function Dashboard() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  const PERIODS = [
    { key: '7d', label: `7 ${t('days')}` },
    { key: '30d', label: `30 ${t('days')}` },
    { key: '90d', label: `90 ${t('days')}` },
    { key: '1y', label: `1 ${t('days')}` },
    { key: 'all', label: t('allTime') },
  ];

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/products'),
      api.get('/sales'),
      api.get(`/sales/analytics?period=${period}`),
    ]).then(([p, s, a]) => {
      setProducts(p.data.data);
      setSales(s.data.data);
      setAnalytics(a.data.data);
    }).finally(() => setLoading(false));
  }, [period]);

  const totalRevenue = sales.reduce((s, sale) => s + Number(sale.total || 0), 0);
  const lowStockCount = products.filter(p => isLowStock(p.quantity)).length;
  const recentSales = [...sales].reverse().slice(0, 8);

  const lineData = analytics ? {
    labels: analytics.dailyRevenue.map(d => {
      const isMonthly = d.date.length === 7;
      if (isMonthly) {
        const [y, m] = d.date.split('-');
        const dt = new Date(y, m - 1);
        return dt.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
      }
      const dt = new Date(d.date);
      return dt.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Revenue (TZS)',
      data: analytics.dailyRevenue.map(d => d.revenue),
      borderColor: '#6ee7b7',
      backgroundColor: 'rgba(110,231,183,0.06)',
      pointBackgroundColor: '#6ee7b7',
      pointRadius: 4,
      tension: 0.45,
      fill: true,
    }],
  } : null;

  const doughnutData = analytics && analytics.categoryRevenue.length > 0 ? {
    labels: analytics.categoryRevenue.map(c => c.category),
    datasets: [{
      data: analytics.categoryRevenue.map(c => c.revenue),
      backgroundColor: [
        'rgba(110,231,183,0.8)', 'rgba(56,189,248,0.8)', 'rgba(167,139,250,0.8)',
        'rgba(251,191,36,0.8)', 'rgba(248,113,113,0.8)', 'rgba(34,211,238,0.8)',
      ],
      borderColor: 'rgba(255,255,255,0.05)',
      borderWidth: 2,
    }],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        titleColor: '#94a3b8',
        bodyColor: '#f1f5f9',
        padding: 12,
        callbacks: {
          label: (ctx) => ` TZS ${ctx.raw.toLocaleString()}`,
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#475569', font: { family: 'Sora', size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#475569',
          font: { family: 'Sora', size: 11 },
          callback: (v) => 'TZS ' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v),
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#64748b', font: { family: 'Sora', size: 11 }, padding: 16, boxWidth: 12 }
      },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        bodyColor: '#f1f5f9',
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: TZS ${ctx.raw.toLocaleString()}`,
        }
      }
    },
    cutout: '68%',
  };

  if (loading) return <LoadingState message={`${t('loading')}...`} />;

  return (
    <div className="animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title={t('totalProducts')} value={products.length} subtitle={t('inInventory')} icon={Package} color="blue" />
        <StatCard title={t('totalSales')} value={sales.length} subtitle={t('transactions')} icon={ShoppingCart} color="green" />
        <StatCard title={t('revenue')} value={formatCurrency(totalRevenue)} subtitle={t('allTime')} icon={DollarSign} color="yellow" />
        <StatCard title={t('lowStock')} value={lowStockCount} subtitle={`≤10 ${t('unitsOrLess')}`} icon={AlertTriangle} color="red" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Line Chart */}
        <div className="glass p-5 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">{t('revenueTrend')}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{analytics?.dailyRevenue?.length || 0} {t('dataPoints')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    period === p.key
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 200 }}>
            {lineData ? <Line data={lineData} options={chartOptions} /> : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">{t('noDataYet')}</div>
            )}
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="glass p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-200 text-sm">{t('revenueByCategory')}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('allTime')}</p>
          </div>
          <div style={{ height: 220 }}>
            {doughnutData ? <Doughnut data={doughnutData} options={doughnutOptions} /> : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">{t('noDataYet')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Sales */}
        <div className="glass p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-200 text-sm mb-4">{t('recentSales')}</h3>
          {recentSales.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">{t('noSalesYet')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('product')}</th>
                    <th>{t('customer')}</th>
                    <th>{t('qty')}</th>
                    <th>{t('total')}</th>
                    <th>{t('date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map(s => (
                    <tr key={s.id}>
                      <td className="text-slate-200 font-medium">{s.productName}</td>
                      <td className="text-slate-400">{s.customerName || '—'}</td>
                      <td><span className="badge badge-blue">{s.quantity}</span></td>
                      <td className="text-emerald-400 font-semibold font-mono text-sm">{formatCurrency(s.total)}</td>
                      <td className="text-slate-500 text-xs">{formatDate(s.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-amber-400" />
            <h3 className="font-semibold text-slate-200 text-sm">{t('lowStockAlerts')}</h3>
          </div>
          {products.filter(p => isLowStock(p.quantity)).length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">✓ {t('allProductsWellStocked')}</p>
          ) : (
            <div className="space-y-2">
              {products.filter(p => isLowStock(p.quantity)).map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.12)' }}>
                  <div>
                    <p className="text-sm font-medium text-slate-200 leading-none">{p.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.category}</p>
                  </div>
                  <span className={`badge ${Number(p.quantity) === 0 ? 'badge-red' : 'badge-yellow'}`}>
                    {p.quantity} {t('left')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
