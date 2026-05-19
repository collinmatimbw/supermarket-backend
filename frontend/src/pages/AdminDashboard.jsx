import React, { useEffect, useState } from 'react';
import { Users, Package, ShoppingCart, UserCheck, Clock } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, ArcElement, Filler, BarElement
} from 'chart.js';
import PageHeader from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import api from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users').then(r => {
      setUsers(r.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const totalUsers = users.length;
  const totalProducts = users.reduce((sum, u) => sum + (u.products || 0), 0);
  const totalSales = users.reduce((sum, u) => sum + (u.sales || 0), 0);
  const totalCustomers = users.reduce((sum, u) => sum + (u.customers || 0), 0);

  const topUsers = [...users].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 8);

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) return <LoadingState />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="Overview of all registered users" />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white mt-1">{totalUsers}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Users className="text-emerald-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Sales</p>
              <p className="text-2xl font-bold text-white mt-1">{totalSales.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <ShoppingCart className="text-blue-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Products</p>
              <p className="text-2xl font-bold text-white mt-1">{totalProducts.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Package className="text-purple-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Customers</p>
              <p className="text-2xl font-bold text-white mt-1">{totalCustomers.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <UserCheck className="text-amber-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Registered Users & Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-3 px-2">Email</th>
                <th className="text-center py-3 px-2">Products</th>
                <th className="text-center py-3 px-2">Sales</th>
                <th className="text-center py-3 px-2">Customers</th>
                <th className="text-center py-3 px-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">No users registered</td></tr>
              ) : (
                users.map((user, i) => (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="py-3 px-2 text-white font-medium">{user.email}</td>
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
                    <td className="py-3 px-2 text-center text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {formatDate(user.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Users by Sales */}
      {topUsers.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Users by Sales Activity</h3>
          <div className="h-64">
            <Bar
              data={{
                labels: topUsers.map(u => u.email.split('@')[0]),
                datasets: [{
                  label: 'Sales',
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