import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, BarChart3, Target, Activity } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import api from '../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, totalSales: 0, avgSales: 0 });

  useEffect(() => {
    api.get('/users')
      .then(r => {
        const users = r.data.data || [];
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.sales > 0 || u.products > 0).length;
        const totalSales = users.reduce((s, u) => s + (u.sales || 0), 0);
        const avgSales = totalUsers > 0 ? Math.round(totalSales / totalUsers) : 0;
        setStats({ totalUsers, activeUsers, totalSales, avgSales });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Admin Dashboard" subtitle={`${stats.totalUsers} registered users`} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 -translate-y-6 translate-x-6" style={{ background: 'radial-gradient(circle, white, transparent)' }} />
          <Users size={20} className="mb-3 opacity-80" />
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
          <p className="text-sm opacity-80 mt-1">Total Users</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 -translate-y-6 translate-x-6" style={{ background: 'radial-gradient(circle, white, transparent)' }} />
          <Activity size={20} className="mb-3 opacity-80" />
          <p className="text-3xl font-bold">{stats.activeUsers}</p>
          <p className="text-sm opacity-80 mt-1">Active Users</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 -translate-y-6 translate-x-6" style={{ background: 'radial-gradient(circle, white, transparent)' }} />
          <BarChart3 size={20} className="mb-3 opacity-80" />
          <p className="text-3xl font-bold">{stats.totalSales.toLocaleString()}</p>
          <p className="text-sm opacity-80 mt-1">Total Sales</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 -translate-y-6 translate-x-6" style={{ background: 'radial-gradient(circle, white, transparent)' }} />
          <Target size={20} className="mb-3 opacity-80" />
          <p className="text-3xl font-bold">{stats.avgSales}</p>
          <p className="text-sm opacity-80 mt-1">Avg Sales/User</p>
        </div>
      </div>
    </div>
  );
}
