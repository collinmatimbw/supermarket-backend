import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, BarChart3, Target, Crown, Clock, Activity, Star } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, BarElement, Filler
} from 'chart.js';
import PageHeader from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import api from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/users')
      .then(r => {
        console.log('Users:', r.data);
        setUsers(r.data.data || []);
        setError(null);
      })
      .catch(err => {
        console.error('Error:', err.message);
        setError(err.message);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading..." />;

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Admin Dashboard" subtitle="Error" />
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
          <p className="text-red-400">{error}</p>
          <p className="text-slate-500 text-xs mt-2">Press F12 to see console errors</p>
        </div>
      </div>
    );
  }

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.sales > 0 || u.products > 0).length;
  const totalSales = users.reduce((s, u) => s + (u.sales || 0), 0);
  const totalProducts = users.reduce((s, u) => s + (u.products || 0), 0);
  const avgSales = totalUsers > 0 ? Math.round(totalSales / totalUsers) : 0;

  const topUsers = [...users].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 5);
  const recentUsers = [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const growthMonths = {};
  users.forEach(u => {
    const m = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }) : 'Unknown';
    growthMonths[m] = (growthMonths[m] || 0) + 1;
  });

  const lineData = {
    labels: Object.keys(growthMonths),
    datasets: [{
      label: 'New Users',
      data: Object.values(growthMonths),
      borderColor: '#6ee7b7',
      backgroundColor: 'rgba(110,231,183,0.08)',
      pointBackgroundColor: '#6ee7b7',
      pointRadius: 5,
      tension: 0.4,
      fill: true,
    }]
  };

  const barData = {
    labels: topUsers.map(u => u.email.split('@')[0]),
    datasets: [{
      label: 'Sales',
      data: topUsers.map(u => u.sales || 0),
      backgroundColor: 'rgba(110,231,183,0.7)',
      borderRadius: 8,
    }]
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#64748b', font: { family: 'Sora', size: 11 } } }, tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, titleColor: '#94a3b8', bodyColor: '#f1f5f9', padding: 12 } },
    scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { family: 'Sora', size: 11 } } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { family: 'Sora', size: 11 } }, beginAtZero: true } }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    const diff = Date.now() - d;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const getInitials = (email) => email.split('@')[0].slice(0, 2).toUpperCase();
  const gradients = ['linear-gradient(135deg, #059669, #10b981)', 'linear-gradient(135deg, #0891b2, #06b6d4)', 'linear-gradient(135deg, #7c3aed, #8b5cf6)', 'linear-gradient(135deg, #d97706, #f59e0b)', 'linear-gradient(135deg, #dc2626, #ef4444)'];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Admin Dashboard" subtitle={`${totalUsers} registered users`} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Users', value: totalUsers, gradient: 'linear-gradient(135deg, #059669, #10b981)' },
          { icon: Activity, label: 'Active Users', value: activeUsers, gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)' },
          { icon: BarChart3, label: 'Total Sales', value: totalSales.toLocaleString(), gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' },
          { icon: Target, label: 'Avg Sales/User', value: avgSales, gradient: 'linear-gradient(135deg, #d97706, #f59e0b)' },
        ].map((stat, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl p-5 text-white" style={{ background: stat.gradient }}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 -translate-y-6 translate-x-6" style={{ background: 'radial-gradient(circle, white, transparent)' }} />
            <stat.icon size={20} className="mb-3 opacity-80" />
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm opacity-80 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">User Growth</h3>
              <p className="text-xs text-slate-500 mt-0.5">Sign-ups over time</p>
            </div>
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <div style={{ height: 220 }}>
            {Object.keys(growthMonths).length > 0 ? (
              <Line data={lineData} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } } }} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-600 text-sm">No data yet</div>
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">Top Users by Sales</h3>
              <p className="text-xs text-slate-500 mt-0.5">Leaderboard</p>
            </div>
            <Crown size={18} className="text-yellow-400" />
          </div>
          <div style={{ height: 220 }}>
            {topUsers.length > 0 ? (
              <Bar data={barData} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } } }} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-600 text-sm">No data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={18} className="text-yellow-400" />
            <h3 className="font-semibold text-white">Top Performers</h3>
          </div>
          {topUsers.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {topUsers.map((user, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: gradients[i % gradients.length] }}>
                    {getInitials(user.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    <p className="text-xs text-slate-500">{user.sales || 0} sales · {user.products || 0} products · {user.customers || 0} customers</p>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400">
                    <Star size={14} />
                    <span className="text-sm font-semibold">#{i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-blue-400" />
            <h3 className="font-semibold text-white">Recent Sign-ups</h3>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No users yet</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: gradients[(i + 2) % gradients.length] }}>
                    {getInitials(user.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    <p className="text-xs text-slate-500">Joined {formatDate(user.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
