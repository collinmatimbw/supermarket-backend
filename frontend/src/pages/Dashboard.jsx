import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle, Clock, Users, Target, Package, Phone, MessageCircle, Plus, TrendingDown, CreditCard, Wallet } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import StatCard from '../components/StatCard';
import { LoadingState } from '../components/LoadingState';
import api from '../utils/api';
import { formatCurrency, formatDate, isLowStock } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function Dashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [leads, setLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/products'),
      api.get('/sales'),
      api.get('/leads'),
      api.get('/tasks'),
      api.get('/sales/analytics?period=30d'),
      api.get('/expenses'),
    ]).then(([p, s, l, t, a, e]) => {
      setProducts(p.data.data);
      setSales(s.data.data);
      setLeads(l.data.data || []);
      setTasks(t.data.data || []);
      setAnalytics(a.data.data);
      setExpenses(e.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date === today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const monthlySales = sales.filter(s => s.date?.startsWith(today.slice(0, 7)));
  const monthlyRevenue = monthlySales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const totalProfit = sales.reduce((sum, s) => sum + Number(s.profit || 0), 0);
  const profitMargin = monthlyRevenue > 0 ? ((totalProfit / sales.reduce((sum, s) => sum + Number(s.total || 0), 0)) * 100).toFixed(1) : 0;
  const lowStockItems = products.filter(p => isLowStock(p.quantity));
  const pendingLeads = leads.filter(l => l.stage !== 'won' && l.stage !== 'lost');
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const outstandingDebts = sales.reduce((s, sale) => s + Number(sale.balance || 0), 0);
  const creditSales = sales.filter(s => s.paymentStatus === 'credit' || s.paymentStatus === 'partial');
  const totalRevenueAll = sales.reduce((s, sale) => s + Number(sale.total || 0), 0);
  const cashInHand = totalRevenueAll - totalExpenses;
  const pendingTasks = tasks.filter(t => t.done !== 'true');
  const todayTasks = pendingTasks.filter(t => t.dueDate === today);
  const overdueTasks = pendingTasks.filter(t => t.dueDate && t.dueDate < today);

  const recentSales = [...sales].reverse().slice(0, 5);

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, titleColor: '#94a3b8', bodyColor: '#f1f5f9', padding: 12, callbacks: { label: ctx => ` TZS ${ctx.raw.toLocaleString()}` } } },
    scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { family: 'Sora', size: 11 } } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { family: 'Sora', size: 11 }, callback: v => 'TZS ' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) } } }
  };

  const lineData = analytics?.dailyRevenue ? {
    labels: analytics.dailyRevenue.map(d => d.date.length === 7 ? d.date.slice(5) : d.date.slice(5)),
    datasets: [{ label: 'Revenue', data: analytics.dailyRevenue.map(d => d.revenue), borderColor: '#6ee7b7', backgroundColor: 'rgba(110,231,183,0.06)', pointBackgroundColor: '#6ee7b7', pointRadius: 3, tension: 0.45, fill: true }]
  } : null;

  const cardLink = (path, label) => (
    <button onClick={() => navigate(path)} className="text-xs text-emerald-400 hover:underline">{label} →</button>
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-4 text-white relative overflow-hidden">
          <ShoppingCart size={16} className="opacity-80 mb-1.5" />
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Today's Sales</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(todayRevenue)}</p>
          <p className="text-xs opacity-70 mt-0.5">{todaySales.length} transactions</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-4 text-white relative overflow-hidden">
          <DollarSign size={16} className="opacity-80 mb-1.5" />
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Monthly Revenue</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(monthlyRevenue)}</p>
          <p className="text-xs opacity-70 mt-0.5">{monthlySales.length} sales</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-4 text-white relative overflow-hidden">
          <TrendingUp size={16} className="opacity-80 mb-1.5" />
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Net Profit</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(totalProfit)}</p>
          <p className="text-xs opacity-70 mt-0.5">Margin: {profitMargin}%</p>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-4 text-white relative overflow-hidden">
          <CreditCard size={16} className="opacity-80 mb-1.5" />
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Outstanding Debt</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(outstandingDebts)}</p>
          <p className="text-xs opacity-70 mt-0.5">{creditSales.length} debtors</p>
        </div>

        <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-4 text-white relative overflow-hidden">
          <Wallet size={16} className="opacity-80 mb-1.5" />
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Cash in Hand</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(cashInHand)}</p>
          <p className="text-xs opacity-70 mt-0.5">Revenue − Expenses</p>
        </div>

        <div className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl p-4 text-white relative overflow-hidden">
          <AlertTriangle size={16} className="opacity-80 mb-1.5" />
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Low Stock</p>
          <p className="text-xl font-bold mt-1">{lowStockItems.length}</p>
          <p className="text-xs opacity-70 mt-0.5">need reorder</p>
        </div>
      </div>

      {/* Charts + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">Sales Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Last {analytics?.period || 30} days</p>
            </div>
            <button onClick={() => navigate('/sales')} className="btn-primary text-xs px-3 py-1.5">
              <Plus size={13} className="mr-1" />New Sale
            </button>
          </div>
          <div style={{ height: 200 }}>
            {lineData ? <Line data={lineData} options={chartOpts} /> : <div className="flex items-center justify-center h-full text-slate-500 text-sm">No data yet</div>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <h3 className="font-semibold text-white text-sm mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => navigate('/sales')} className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-center">
                <ShoppingCart size={20} className="mx-auto mb-1" />
                <span className="text-xs font-medium">New Sale</span>
              </button>
              <button onClick={() => navigate('/products')} className="p-3 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-center">
                <Package size={20} className="mx-auto mb-1" />
                <span className="text-xs font-medium">Add Product</span>
              </button>
              <button onClick={() => navigate('/customers')} className="p-3 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors text-center">
                <Users size={20} className="mx-auto mb-1" />
                <span className="text-xs font-medium">Customers</span>
              </button>
              <button onClick={() => navigate('/leads')} className="p-3 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-center">
                <Target size={20} className="mx-auto mb-1" />
                <span className="text-xs font-medium">New Lead</span>
              </button>
            </div>
          </div>

          {/* Today's Tasks */}
          {todayTasks.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-amber-400" />
                <span className="text-sm font-medium text-amber-400">{todayTasks.length} task{todayTasks.length > 1 ? 's' : ''} today</span>
              </div>
              <p className="text-xs text-amber-300/70">{cardLink('/tasks', 'View tasks')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales + Leads + Tasks Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Sales */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Recent Sales</h3>
            {cardLink('/sales', 'All sales')}
          </div>
          {recentSales.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No sales yet</p>
          ) : (
            <div className="space-y-2">
              {recentSales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{sale.productName || 'Sale'}</p>
                    <p className="text-xs text-slate-500">{sale.date} · {sale.quantity || 0} units</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-400 ml-2">{formatCurrency(sale.total)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Leads */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Leads ({pendingLeads.length})</h3>
            {cardLink('/leads', 'All leads')}
          </div>
          {pendingLeads.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No leads yet</p>
          ) : (
            <div className="space-y-2">
              {pendingLeads.slice(0, 5).map(lead => (
                <div key={lead.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{lead.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{lead.stage}</p>
                  </div>
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                      <Phone size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Upcoming Tasks</h3>
            {cardLink('/tasks', 'All tasks')}
          </div>
          {pendingTasks.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No pending tasks</p>
          ) : (
            <div className="space-y-2">
              {pendingTasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
                  <div className={`w-2 h-2 rounded-full ${task.dueDate && task.dueDate < today ? 'bg-red-400' : 'bg-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{task.title}</p>
                    {task.dueDate && (
                      <p className={`text-xs ${task.dueDate < today ? 'text-red-400' : 'text-slate-500'}`}>
                        {task.dueDate === today ? 'Today' : new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-400" />
            <h3 className="text-sm font-semibold text-red-400">Low Stock Alert</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {lowStockItems.slice(0, 4).map(p => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                <div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.quantity} left</p>
                </div>
                <button onClick={() => navigate('/products')} className="text-xs text-emerald-400 hover:underline">Restock</button>
              </div>
            ))}
            {lowStockItems.length > 4 && (
              <p className="text-xs text-slate-500 mt-2">+{lowStockItems.length - 4} more items</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
