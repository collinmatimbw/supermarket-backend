import React, { useEffect, useState } from 'react';
import { Users, Package, ShoppingCart, UserCheck, Clock, TrendingUp } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js';
import PageHeader from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import api from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/users')
      .then(r => {
        const data = r.data.data || [];
        setUsers(data);
      })
      .catch(err => {
        console.error('Failed to load users:', err);
        setError(err.message);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalUsers = users.length;
  const totalProducts = users.reduce((s, u) => s + (u.products || 0), 0);
  const totalSales = users.reduce((s, u) => s + (u.sales || 0), 0);
  const totalCustomers = users.reduce((s, u) => s + (u.customers || 0), 0);

  const activeUsers = users.filter(u => (u.sales || 0) > 0).length;
  const topUsers = [...users].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 8);

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) return <LoadingState message="Loading user progress..." />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="User Progress" subtitle={`${totalUsers} registered users`} />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          Error loading data: {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs">Total Users</p>
              <p className="text-2xl font-bold text-white mt-1">{totalUsers}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Users className="text-emerald-400" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs">Active Users</p>
              <p className="text-2xl font-bold text-white mt-1">{activeUsers}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="text-blue-400" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs">Total Sales</p>
              <p className="text-2xl font-bold text-white mt-1">{totalSales.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <ShoppingCart className="text-purple-400" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs">Total Products</p>
              <p className="text-2xl font-bold text-white mt-1">{totalProducts.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Package className="text-amber-400" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* User Progress Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">User Progress</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-3 px-2">User</th>
                <th className="text-center py-3 px-2">Products</th>
                <th className="text-center py-3 px-2">Sales</th>
                <th className="text-center py-3 px-2">Customers</th>
                <th className="text-center py-3 px-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">No users yet</td></tr>
              ) : (
                users.map((user, i) => (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="py-3 px-2 text-white font-medium text-sm">{user.email}</td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 text-xs">
                        {user.products || 0}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-500/20 text-blue-300 text-xs">
                        {user.sales || 0}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 text-xs">
                        {user.customers || 0}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-slate-400 text-xs">
                      <Clock size={12} className="inline mr-1" />
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Users Chart */}
      {topUsers.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Users by Sales</h3>
          <div className="h-64">
            <Bar
              data={{
                labels: topUsers.map(u => u.email.split('@')[0]),
                datasets: [{
                  label: 'Sales Count',
                  data: topUsers.map(u => u.sales || 0),
                  backgroundColor: 'rgba(16, 185, 129, 0.6)',
                  borderColor: '#10b981',
                  borderWidth: 1,
                  borderRadius: 6,
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                  x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
