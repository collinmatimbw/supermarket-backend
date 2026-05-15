import React, { useEffect, useState } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { LoadingState } from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import { TrendingUp, DollarSign, ShoppingCart, Award } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

const tooltipStyle = {
  backgroundColor: 'rgba(15,23,42,0.95)',
  borderColor: 'rgba(255,255,255,0.08)',
  borderWidth: 1,
  titleColor: '#94a3b8',
  bodyColor: '#f1f5f9',
  padding: 12,
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sales/analytics').then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading analytics..." />;

  const lineData = {
    labels: data.dailyRevenue.map(d => {
      const dt = new Date(d.date);
      return dt.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Revenue',
      data: data.dailyRevenue.map(d => d.revenue),
      borderColor: '#6ee7b7',
      backgroundColor: 'rgba(110,231,183,0.07)',
      pointBackgroundColor: '#6ee7b7',
      pointRadius: 5,
      tension: 0.4,
      fill: true,
    }]
  };

  const barData = {
    labels: data.topProducts.map(p => p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name),
    datasets: [{
      label: 'Revenue',
      data: data.topProducts.map(p => p.revenue),
      backgroundColor: [
        'rgba(110,231,183,0.7)', 'rgba(56,189,248,0.7)', 'rgba(167,139,250,0.7)',
        'rgba(251,191,36,0.7)', 'rgba(248,113,113,0.7)'
      ],
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  const doughnutData = data.categoryRevenue.length > 0 ? {
    labels: data.categoryRevenue.map(c => c.category),
    datasets: [{
      data: data.categoryRevenue.map(c => c.revenue),
      backgroundColor: ['rgba(110,231,183,0.8)','rgba(56,189,248,0.8)','rgba(167,139,250,0.8)','rgba(251,191,36,0.8)','rgba(248,113,113,0.8)','rgba(34,211,238,0.8)'],
      borderColor: 'rgba(255,255,255,0.04)',
      borderWidth: 2,
    }]
  } : null;

  const chartOpts = (yFormat) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { ...tooltipStyle, callbacks: { label: ctx => ` TZS ${ctx.raw.toLocaleString()}` } } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { family: 'Sora', size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { family: 'Sora', size: 11 }, callback: v => yFormat(v) } }
    }
  });

  const noData = <div className="flex items-center justify-center h-full text-sm text-slate-500">No data yet</div>;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Analytics" subtitle="Business performance overview" />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Revenue', val: formatCurrency(data.totalRevenue), icon: DollarSign, color: '#6ee7b7', bg: 'rgba(110,231,183,0.08)' },
          { label: 'Total Profit', val: formatCurrency(data.totalProfit), icon: TrendingUp, color: '#38bdf8', bg: 'rgba(56,189,248,0.08)' },
          { label: 'Total Transactions', val: data.totalSales, icon: ShoppingCart, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
          { label: 'Top Category', val: data.categoryRevenue[0]?.category || '—', icon: Award, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
        ].map((k, i) => (
          <div key={i} className="glass p-5 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{k.label}</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: k.bg }}>
                <k.icon size={16} style={{ color: k.color }} />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-100">{k.val}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="glass p-5">
          <h3 className="font-semibold text-slate-200 text-sm mb-1">Revenue – Last 7 Days</h3>
          <p className="text-xs text-slate-500 mb-4">Daily revenue trend</p>
          <div style={{ height: 220 }}>
            {data.dailyRevenue.some(d => d.revenue > 0)
              ? <Line data={lineData} options={chartOpts(v => v >= 1000 ? (v/1000).toFixed(0)+'k' : v)} />
              : noData}
          </div>
        </div>
        <div className="glass p-5">
          <h3 className="font-semibold text-slate-200 text-sm mb-1">Top 5 Products by Revenue</h3>
          <p className="text-xs text-slate-500 mb-4">Best performing products</p>
          <div style={{ height: 220 }}>
            {data.topProducts.length > 0
              ? <Bar data={barData} options={chartOpts(v => 'TZS '+v.toLocaleString())} />
              : noData}
          </div>
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass p-5 lg:col-span-1">
          <h3 className="font-semibold text-slate-200 text-sm mb-1">Revenue by Category</h3>
          <p className="text-xs text-slate-500 mb-4">Category share</p>
          <div style={{ height: 240 }}>
            {doughnutData
              ? <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#64748b', font: { family: 'Sora', size: 11 }, padding: 14, boxWidth: 12 } }, tooltip: { ...tooltipStyle, callbacks: { label: ctx => ` ${ctx.label}: TZS ${ctx.raw.toLocaleString()}` } } }, cutout: '65%' }} />
              : noData}
          </div>
        </div>

        {/* Category breakdown table */}
        <div className="glass p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-200 text-sm mb-4">Category Breakdown</h3>
          {data.categoryRevenue.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No category data available</p>
          ) : (
            <div className="space-y-3">
              {data.categoryRevenue.sort((a,b) => b.revenue - a.revenue).map((c, i) => {
                const maxRev = data.categoryRevenue[0]?.revenue || 1;
                const pct = ((c.revenue / data.totalRevenue) * 100).toFixed(1);
                const w = (c.revenue / maxRev) * 100;
                const colors = ['#6ee7b7','#38bdf8','#a78bfa','#fbbf24','#f87171','#22d3ee'];
                return (
                  <div key={c.category}>
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="text-slate-300 font-medium">{c.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{pct}%</span>
                        <span className="font-semibold text-slate-200">{formatCurrency(c.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${w}%`, background: colors[i % colors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
