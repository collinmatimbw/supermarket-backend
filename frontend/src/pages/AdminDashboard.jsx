import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, DollarSign, ShoppingCart, BarChart3, UserCheck, UserX } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, ArcElement, Filler, BarElement
} from 'chart.js';
import PageHeader from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

export default function AdminDashboard() {
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/customers'),
      api.get('/sales'),
    ]).then(([c, s]) => {
      setCustomers(c.data.data);
      setSales(s.data.data);
    }).finally(() => setLoading(false));
  }, []);

  // Calculate customer analytics
  const totalCustomers = customers.length;
  const totalSalesAmount = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const avgSaleValue = totalCustomers > 0 ? totalSalesAmount / totalCustomers : 0;

  // Top customers by spending
  const customerSpending = {};
  sales.forEach(sale => {
    const name = sale.customerName || 'Walk-in';
    customerSpending[name] = (customerSpending[name] || 0) + Number(sale.total || 0);
  });
  const topCustomers = Object.entries(customerSpending)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, amount]) => ({ name, amount }));

  // Sales by customer type
  const walkInSales = sales.filter(s => !s.customerId || s.customerName === 'Walk-in Customer').length;
  const registeredCustomers = totalCustomers > 0 ? sales.length - walkInSales : 0;

  // Prediction: identify high-value customers
  const highValueCustomers = customers
    .map(c => {
      const customerSales = sales.filter(s => s.customerId === c.id);
      const totalSpent = customerSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
      return { ...c, totalSpent, purchaseCount: customerSales.length };
    })
    .filter(c => c.purchaseCount > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // Customer prediction - likely to return
  const likelyToReturn = highValueCustomers
    .filter(c => c.purchaseCount >= 3)
    .slice(0, 5);

  // Sales trend (mock data for demo - would need date-based grouping in real app)
  const salesTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Sales',
      data: [120000, 190000, 150000, 250000, 220000, totalSalesAmount],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const customerTypeData = {
    labels: ['Walk-in', 'Registered'],
    datasets: [{
      data: [walkInSales, registeredCustomers],
      backgroundColor: ['#6366f1', '#10b981'],
    }],
  };

  if (loading) return <LoadingState />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Customer Analytics & Predictions"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Users size={16} />
            <span className="text-xs">Total Customers</span>
          </div>
          <p className="text-2xl font-bold text-slate-200">{totalCustomers}</p>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <DollarSign size={16} />
            <span className="text-xs">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalSalesAmount)}</p>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <TrendingUp size={16} />
            <span className="text-xs">Avg per Customer</span>
          </div>
          <p className="text-2xl font-bold text-sky-400">{formatCurrency(avgSaleValue)}</p>
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <ShoppingCart size={16} />
            <span className="text-xs">Total Transactions</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">{sales.length}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="glass p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Sales Trend</h3>
          <Line 
            data={salesTrendData}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
              },
            }}
          />
        </div>

        {/* Customer Type */}
        <div className="glass p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Customer Type Distribution</h3>
          <div className="h-48 flex items-center justify-center">
            <Doughnut 
              data={customerTypeData}
              options={{
                responsive: true,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } },
              }}
            />
          </div>
        </div>
      </div>

      {/* High Value Customers */}
      <div className="glass p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">🏆 High Value Customers</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Purchases</th>
                <th>Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {highValueCustomers.map((c, i) => (
                <tr key={i}>
                  <td className="font-medium text-slate-200">{c.name || c.id}</td>
                  <td><span className="badge badge-blue">{c.purchaseCount}</span></td>
                  <td className="text-emerald-400 font-semibold">{formatCurrency(c.totalSpent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Predictions */}
      <div className="glass p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">🔮 Likely to Return</h3>
        <div className="flex items-center gap-2">
          <UserCheck className="text-emerald-400" size={20} />
          <span className="text-slate-300">These customers have made 3+ purchases and are likely to return:</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {likelyToReturn.map((c, i) => (
            <span key={i} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {c.name || c.id}
            </span>
          ))}
          {likelyToReturn.length === 0 && (
            <span className="text-slate-500">Not enough data yet - need more purchase history</span>
          )}
        </div>
      </div>
    </div>
  );
}