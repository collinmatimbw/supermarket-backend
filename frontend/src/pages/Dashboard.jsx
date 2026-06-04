import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle, Clock, Users, Target, Package, Phone, MessageCircle, Plus, TrendingDown, CreditCard, Wallet, BarChart3, FileText, X, Calendar, PiggyBank, Bell, CheckCheck } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import { LoadingState } from '../components/LoadingState';
import api from '../utils/api';
import { formatCurrency, formatDate, isLowStock } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function Dashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [leads, setLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [expensesToday, setExpensesToday] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eodOpen, setEodOpen] = useState(false);
  const [capitalRecords, setCapitalRecords] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [localNotifs, setLocalNotifs] = useState([]);
  const [activePeriod, setActivePeriod] = useState('all'); // today | week | month | all
  const [selectedCard, setSelectedCard] = useState(null);
  const auth = JSON.parse(localStorage.getItem('skyc_auth') || '{}');
  const currentUser = auth.email;
  const isAdmin = currentUser === 'skyclamiere@gmail.com';

  // Load local notifications
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('skyc_notifications') || '[]');
    setLocalNotifs(stored.filter(n => !n.read));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const printReceipt = () => {
    const w = window.open('', '_blank');
    const p = (v) => formatCurrency(v);
    const line = (a, b) => `<tr><td style="text-align:left">${a}</td><td style="text-align:right">${b}</td></tr>`;
    w.document.write(`<!DOCTYPE html><html><head><title>End of Day - ${today}</title>
    <style>
      @page { margin: 0; size: 80mm auto; }
      body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; margin: 0 auto; padding: 8mm 4mm; color: #000; text-align: center; }
      h1 { font-size: 16px; font-weight: bold; margin: 0 0 2px; text-transform: uppercase; letter-spacing: 2px; }
      h2 { font-size: 11px; font-weight: normal; margin: 0 0 4px; color: #555; }
      .divider { border-top: 1px dashed #999; margin: 6px 0; }
      .divider-solid { border-top: 1px solid #333; margin: 6px 0; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 1px 0; font-size: 12px; }
      .total td { font-weight: bold; font-size: 14px; padding-top: 2px; }
      .section-title { font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #555; text-align: left; padding-top: 4px; }
      .footer { font-size: 10px; color: #888; margin-top: 8px; }
      .big { font-size: 18px; font-weight: bold; }
    </style></head><body>
    <h1>SKYC CRM</h1>
    <h2>${dateStr}</h2>
    <h2>${timeStr}</h2>
    <div class="divider"></div>
    <table>${line('Total Sales', p(todayRevenue))}
    <tr><td style="text-align:left;font-size:10px;color:#666">(${todaySales.length} transactions)</td><td></td></tr>
    <tr><td style="padding-top:4px"></td></tr>
    ${line('Cash', p(cashToday))}
    ${line('Mobile Money', p(mobileToday))}
    ${line('Credit Sales', p(creditToday))}
    </table>
    <div class="divider"></div>
    <table>${line('Today\'s Expenses', p(expensesToday))}
    ${line('Today\'s Profit', p(todayProfit))}
    </table>
    <div class="divider"></div>
    <table>${line('Expected Cash in Till', p(eodExpectedCash))}
    <tr class="total"><td>Net Today</td><td>${p(todayRevenue - expensesToday)}</td></tr>
    </table>
    ${topProductToday ? `<div class="divider"></div><div style="text-align:left;font-size:11px"><span style="color:#555;font-weight:bold">Top Seller:</span> ${topProductToday.productName} — ${p(topProductToday.total)}</div>` : ''}
    ${outstandingDebts > 0 ? `<div class="divider"></div><div style="text-align:left;font-size:11px;color:#c00"><strong>Outstanding Debt:</strong> ${p(outstandingDebts)} (${creditSales.length} debtors)</div>` : ''}
    <div class="divider-solid"></div>
    <div class="footer">Thank you for using SKYC CRM</div>
    </body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); w.close(); }, 300);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/products'),
      api.get('/sales'),
      api.get('/leads'),
      api.get('/tasks'),
      api.get('/sales/analytics?period=30d'),
      api.get('/expenses'),
      api.get('/capital'),
      isAdmin ? api.get('/notifications').catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
    ]).then(([p, s, l, t, a, e, c, n]) => {
      setProducts(p.data.data);
      setSales(s.data.data);
      setLeads(l.data.data || []);
      setTasks(t.data.data || []);
      setAnalytics(a.data.data);
      const exps = e.data.data || [];
      setExpenses(exps);
      setExpensesToday(exps.filter(ex => ex.date === today).reduce((s, ex) => s + Number(ex.amount || 0), 0));
      setCapitalRecords(c.data.data || []);
      setNotifications(n.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;

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

  // Data cube filter logic — must be defined before anything that depends on it
  const filterSalesByPeriod = (arr) => {
    if (activePeriod === 'today') return arr.filter(s => s.date === today);
    if (activePeriod === 'week') { const d = new Date(); d.setDate(d.getDate() - 7); return arr.filter(s => s.date && new Date(s.date) >= d); }
    if (activePeriod === 'month') return arr.filter(s => s.date?.startsWith(today.slice(0, 7)));
    return arr;
  };
  const filterSalesByCard = (arr) => {
    if (selectedCard === 'debt') return arr.filter(s => s.paymentStatus === 'credit' || s.paymentStatus === 'partial');
    if (selectedCard === 'profit') return arr.filter(s => Number(s.profit || 0) > 0);
    return arr;
  };
  const filteredSales = filterSalesByCard(filterSalesByPeriod(sales));
  const filteredTodaySales = filteredSales.filter(s => s.date === today);
  const filteredMonthlySales = filteredSales.filter(s => s.date?.startsWith(today.slice(0, 7)));
  const filteredRevenue = filteredSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const filteredTodayRevenue = filteredTodaySales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const filteredProfit = filteredSales.reduce((sum, s) => sum + Number(s.profit || 0), 0);
  const filteredProfitMargin = filteredRevenue > 0 ? ((filteredProfit / filteredRevenue) * 100).toFixed(1) : 0;
  const filteredOutstandingDebt = filteredSales.reduce((s, sale) => s + Number(sale.balance || 0), 0);
  const filteredCreditSales = filteredSales.filter(s => s.paymentStatus === 'credit' || s.paymentStatus === 'partial');
  const filteredCashInHand = filteredRevenue - totalExpenses;
  const isFiltered = activePeriod !== 'all' || selectedCard !== null;

  // Period-filtered leads & tasks for cube interactivity
  const filteredPendingLeads = activePeriod === 'today' ? pendingLeads.filter(l => l.createdAt?.startsWith(today)) :
    activePeriod === 'month' ? pendingLeads.filter(l => l.createdAt?.startsWith(today.slice(0, 7))) :
    activePeriod === 'week' ? (() => { const d = new Date(); d.setDate(d.getDate() - 7); return pendingLeads.filter(l => l.createdAt && new Date(l.createdAt) >= d); })() :
    pendingLeads;
  const filteredPendingTasks = activePeriod === 'today' ? pendingTasks.filter(t => t.dueDate === today) :
    activePeriod === 'month' ? pendingTasks.filter(t => t.dueDate?.startsWith(today.slice(0, 7))) :
    activePeriod === 'week' ? (() => { const d = new Date(); d.setDate(d.getDate() - 7); return pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) >= d); })() :
    pendingTasks;

  const recentSales = filteredSales.slice(0, 5);

  // Dead stock - products not sold in 60 days
  const sixtyDaysAgo = new Date(); sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const salesForDeadStock = isFiltered ? filteredSales : sales;
  const deadStockItems = products.filter(p => {
    const sold = salesForDeadStock.some(s => (s.productId === p.id || s.productName === p.name) && new Date(s.date) >= sixtyDaysAgo);
    return !sold;
  });

  // Best selling hours - group today's sales by hour from createdAt
  const hourBuckets = Array(24).fill(0);
  filteredSales.forEach(s => {
    if (s.createdAt) {
      const h = new Date(s.createdAt).getHours();
      if (h >= 0 && h < 24) hourBuckets[h] += Number(s.total || 0);
    }
  });

  // End-of-day summary data
  const cashToday = todaySales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + Number(s.total || 0), 0);
  const mobileToday = todaySales.filter(s => s.paymentMethod === 'mobile').reduce((sum, s) => sum + Number(s.total || 0), 0);
  const creditToday = todaySales.filter(s => s.paymentMethod === 'credit').reduce((sum, s) => sum + Number(s.total || 0), 0);
  const eodExpectedCash = cashToday - expensesToday;
  const topProductToday = [...todaySales].sort((a, b) => b.total - a.total)[0];
  const todayProfit = todaySales.reduce((sum, s) => sum + Number(s.profit || 0), 0);
  const totalCapitalInjected = capitalRecords.reduce((s, r) => s + Number(r.amount || 0), 0);
  const capitalUtilized = totalCapitalInjected > 0 ? Math.min(100, (totalExpenses / totalCapitalInjected) * 100) : 0;

  const cubePeriods = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, titleColor: '#94a3b8', bodyColor: '#f1f5f9', padding: 12, callbacks: { label: ctx => ` TZS ${ctx.raw.toLocaleString()}` } } },
    scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { family: 'Sora', size: 11 } } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { family: 'Sora', size: 11 }, callback: v => 'TZS ' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) } } }
  };

  // Aggregate filtered sales by date for chart
  const dailyAgg = {};
  filteredSales.forEach(s => {
    if (s.date) { dailyAgg[s.date] = (dailyAgg[s.date] || 0) + Number(s.total || 0); }
  });
  const sortedDates = Object.keys(dailyAgg).sort();
  const lineData = isFiltered || Object.keys(dailyAgg).length > 0 ? {
    labels: sortedDates.map(d => d.length === 7 ? d.slice(5) : d.slice(5)),
    datasets: [{ label: 'Revenue', data: sortedDates.map(d => dailyAgg[d]), borderColor: '#6ee7b7', backgroundColor: 'rgba(110,231,183,0.06)', pointBackgroundColor: '#6ee7b7', pointRadius: 3, tension: 0.45, fill: true }]
  } : (analytics?.dailyRevenue ? {
    labels: analytics.dailyRevenue.map(d => d.date.length === 7 ? d.date.slice(5) : d.date.slice(5)),
    datasets: [{ label: 'Revenue', data: analytics.dailyRevenue.map(d => d.revenue), borderColor: '#6ee7b7', backgroundColor: 'rgba(110,231,183,0.06)', pointBackgroundColor: '#6ee7b7', pointRadius: 3, tension: 0.45, fill: true }]
  } : null);

  const cardLink = (path, label) => (
    <button onClick={() => navigate(path)} className="text-xs text-emerald-400 hover:underline">{label} →</button>
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Data Cube — Period Slicer & Active Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mr-1">Period</span>
          {cubePeriods.map(p => (
            <button key={p.key} onClick={() => { setActivePeriod(p.key); if (p.key === 'all' && !selectedCard) setSelectedCard(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activePeriod === p.key ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            >{p.label}</button>
          ))}
          <span className="w-px h-6 bg-slate-700/50 mx-1 hidden sm:block" />
          <button onClick={() => { setSelectedCard(null); setActivePeriod('all'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isFiltered ? 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40' : 'text-slate-600 cursor-default'}`}
          >Clear Filters</button>
        </div>
        {isFiltered && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-slate-700/30">
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider mr-0.5">Filters:</span>
            {activePeriod !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-700/50 text-xs text-slate-300">
                Period: {cubePeriods.find(p => p.key === activePeriod)?.label}
                <button onClick={() => setActivePeriod('all')} className="text-slate-500 hover:text-slate-300">&times;</button>
              </span>
            )}
            {selectedCard && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-700/50 text-xs text-slate-300">
                Focus: {selectedCard.charAt(0).toUpperCase() + selectedCard.slice(1)}
                <button onClick={() => setSelectedCard(null)} className="text-slate-500 hover:text-slate-300">&times;</button>
              </span>
            )}
            <span className="text-[10px] text-slate-600 ml-auto">{filteredSales.length} sales shown</span>
          </div>
        )}
      </div>

      {/* Summary Cards — Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button onClick={() => setSelectedCard(selectedCard === 'sales' ? null : 'sales')} className={`relative rounded-2xl p-4 text-white overflow-hidden text-left transition-all ${selectedCard === 'sales' ? 'ring-2 ring-emerald-300 ring-offset-2 ring-offset-slate-900 scale-[1.02]' : 'hover:scale-[1.02]'} bg-gradient-to-br from-emerald-600 to-emerald-800`}>
          <ShoppingCart size={16} className="opacity-80 mb-1.5" />
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Today's Sales</p>
          <p className="text-2xl font-bold mt-1">{isFiltered ? formatCurrency(filteredTodayRevenue) : formatCurrency(todayRevenue)}</p>
          <p className="text-xs opacity-70 mt-0.5">{(isFiltered ? filteredTodaySales : todaySales).length} transactions</p>
          {selectedCard === 'sales' && <span className="absolute top-2 right-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">Active</span>}
        </button>

        <button onClick={() => setSelectedCard(selectedCard === 'revenue' ? null : 'revenue')} className={`relative rounded-2xl p-4 text-white overflow-hidden text-left transition-all ${selectedCard === 'revenue' ? 'ring-2 ring-blue-300 ring-offset-2 ring-offset-slate-900 scale-[1.02]' : 'hover:scale-[1.02]'} bg-gradient-to-br from-blue-600 to-blue-800`}>
          <DollarSign size={16} className="opacity-80 mb-1.5" />
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Monthly Revenue</p>
          <p className="text-2xl font-bold mt-1">{isFiltered ? formatCurrency(filteredRevenue) : formatCurrency(monthlyRevenue)}</p>
          <p className="text-xs opacity-70 mt-0.5">{(isFiltered ? filteredSales.length : monthlySales.length)} sales</p>
          {selectedCard === 'revenue' && <span className="absolute top-2 right-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">Active</span>}
        </button>

        <button onClick={() => setSelectedCard(selectedCard === 'profit' ? null : 'profit')} className={`relative rounded-2xl p-4 text-white overflow-hidden text-left transition-all ${selectedCard === 'profit' ? 'ring-2 ring-purple-300 ring-offset-2 ring-offset-slate-900 scale-[1.02]' : 'hover:scale-[1.02]'} bg-gradient-to-br from-purple-600 to-purple-800`}>
          <TrendingUp size={16} className="opacity-80 mb-1.5" />
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Net Profit</p>
          <p className="text-2xl font-bold mt-1">{isFiltered ? formatCurrency(filteredProfit) : formatCurrency(totalProfit)}</p>
          <p className="text-xs opacity-70 mt-0.5">Margin: {isFiltered ? filteredProfitMargin : profitMargin}%</p>
          {selectedCard === 'profit' && <span className="absolute top-2 right-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">Active</span>}
        </button>
      </div>

      {/* Summary Cards — Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button onClick={() => setSelectedCard(selectedCard === 'debt' ? null : 'debt')} className={`relative rounded-2xl p-4 text-white overflow-hidden text-left transition-all ${selectedCard === 'debt' ? 'ring-2 ring-red-300 ring-offset-2 ring-offset-slate-900 scale-[1.02]' : 'hover:scale-[1.02]'} bg-gradient-to-br from-red-600 to-red-800`}>
          <CreditCard size={16} className="opacity-80 mb-1.5" />
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Outstanding Debt</p>
          <p className="text-xl font-bold mt-1">{isFiltered ? formatCurrency(filteredOutstandingDebt) : formatCurrency(outstandingDebts)}</p>
          <p className="text-xs opacity-70 mt-0.5">{isFiltered ? filteredCreditSales.length : creditSales.length} debtors</p>
          {selectedCard === 'debt' && <span className="absolute top-2 right-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">Active</span>}
        </button>

        <button onClick={() => setSelectedCard(selectedCard === 'cash' ? null : 'cash')} className={`relative rounded-2xl p-4 text-white overflow-hidden text-left transition-all ${selectedCard === 'cash' ? 'ring-2 ring-teal-300 ring-offset-2 ring-offset-slate-900 scale-[1.02]' : 'hover:scale-[1.02]'} bg-gradient-to-br from-teal-600 to-teal-800`}>
          <Wallet size={16} className="opacity-80 mb-1.5" />
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Cash in Hand</p>
          <p className="text-xl font-bold mt-1">{isFiltered ? formatCurrency(filteredCashInHand) : formatCurrency(cashInHand)}</p>
          <p className="text-xs opacity-70 mt-0.5">Revenue − Expenses</p>
          {selectedCard === 'cash' && <span className="absolute top-2 right-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">Active</span>}
        </button>

        <button onClick={() => setSelectedCard(selectedCard === 'stock' ? null : 'stock')} className={`relative rounded-2xl p-4 text-white overflow-hidden text-left transition-all ${selectedCard === 'stock' ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-slate-900 scale-[1.02]' : 'hover:scale-[1.02]'} bg-gradient-to-br from-amber-600 to-amber-800`}>
          <AlertTriangle size={16} className="opacity-80 mb-1.5" />
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Low Stock</p>
          <p className="text-xl font-bold mt-1">{lowStockItems.length}</p>
          <p className="text-xs opacity-70 mt-0.5">need reorder</p>
          {selectedCard === 'stock' && <span className="absolute top-2 right-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">Active</span>}
        </button>

        <button onClick={() => setSelectedCard(selectedCard === 'capital' ? null : 'capital')} className={`relative rounded-2xl p-4 text-white overflow-hidden text-left transition-all ${selectedCard === 'capital' ? 'ring-2 ring-rose-300 ring-offset-2 ring-offset-slate-900 scale-[1.02]' : 'hover:scale-[1.02]'} bg-gradient-to-br from-rose-600 to-rose-800`}>
          <PiggyBank size={16} className="opacity-80 mb-1.5" />
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Capital Injected</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(totalCapitalInjected)}</p>
          <p className="text-xs opacity-70 mt-0.5">{capitalUtilized.toFixed(0)}% utilized</p>
          {selectedCard === 'capital' && <span className="absolute top-2 right-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">Active</span>}
        </button>
      </div>

      {/* Charts + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">Sales Trend {isFiltered && <span className="text-emerald-400 font-normal text-xs ml-1">(filtered)</span>}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{isFiltered ? `${filteredSales.length} sales · ${formatCurrency(filteredRevenue)}` : `Last ${analytics?.period === '30d' ? 30 : analytics?.period === '7d' ? 7 : analytics?.period === '90d' ? 90 : analytics?.period === '1y' ? 365 : analytics?.period === 'all' ? 'all' : 30} days`}</p>
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
              <button onClick={() => setEodOpen(true)} className="p-3 rounded-xl bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors text-center">
                <FileText size={20} className="mx-auto mb-1" />
                <span className="text-xs font-medium">End of Day</span>
              </button>
              <button onClick={() => navigate('/products')} className="p-3 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-center">
                <Package size={20} className="mx-auto mb-1" />
                <span className="text-xs font-medium">Add Product</span>
              </button>
              <button onClick={() => navigate('/expenses')} className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-center">
                <TrendingDown size={20} className="mx-auto mb-1" />
                <span className="text-xs font-medium">Add Expense</span>
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
            <h3 className="text-sm font-semibold text-white">Leads ({filteredPendingLeads.length}){isFiltered && filteredPendingLeads.length !== pendingLeads.length ? <span className="text-[10px] text-slate-500 font-normal ml-1">filtered</span> : ''}</h3>
            {cardLink('/leads', 'All leads')}
          </div>
          {filteredPendingLeads.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No leads yet</p>
          ) : (
            <div className="space-y-2">
              {filteredPendingLeads.slice(0, 5).map(lead => (
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
            <h3 className="text-sm font-semibold text-white">Upcoming Tasks ({filteredPendingTasks.length}){isFiltered && filteredPendingTasks.length !== pendingTasks.length ? <span className="text-[10px] text-slate-500 font-normal ml-1">filtered</span> : ''}</h3>
            {cardLink('/tasks', 'All tasks')}
          </div>
          {filteredPendingTasks.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No pending tasks</p>
          ) : (
            <div className="space-y-2">
              {filteredPendingTasks.slice(0, 5).map(task => (
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

      {/* Dead Stock Alert */}
      {deadStockItems.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-400">Dead Stock — No Sale in 60 Days{isFiltered ? <span className="text-[10px] text-slate-500 font-normal ml-2">(filtered)</span> : ''}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {deadStockItems.slice(0, 4).map(p => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
                <div>
                  <p className="text-sm font-medium text-amber-200">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.quantity} in stock · TZS {((p.price || 0) * (p.quantity || 0)).toLocaleString()} tied up</p>
                </div>
                <button onClick={() => navigate('/products')} className="text-xs text-emerald-400 hover:underline">Review</button>
              </div>
            ))}
            {deadStockItems.length > 4 && (
              <p className="text-xs text-slate-500 mt-2">+{deadStockItems.length - 4} more items</p>
            )}
          </div>
        </div>
      )}

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

      {/* Notifications — admin only */}
      {(isAdmin && (notifications.filter(n => !n.read).length > 0 || localNotifs.length > 0)) && (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-violet-400" />
            <h3 className="text-sm font-semibold text-violet-400">Notifications</h3>
            <button onClick={() => {
              localStorage.setItem('skyc_notifications', '[]');
              setLocalNotifs([]);
              api.put('/notifications/read-all').catch(() => {});
              setNotifications(notifications.map(n => ({ ...n, read: true })));
            }} className="ml-auto text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
              <CheckCheck size={12} />Mark all read
            </button>
          </div>
          <div className="space-y-2">
            {localNotifs.slice(0, 5).map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{new Date(n.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <button onClick={() => {
                  const updated = JSON.parse(localStorage.getItem('skyc_notifications') || '[]').map(x => x.id === n.id ? { ...x, read: true } : x);
                  localStorage.setItem('skyc_notifications', JSON.stringify(updated));
                  setLocalNotifs(updated.filter(x => !x.read));
                }} className="text-xs text-slate-500 hover:text-slate-300 flex-shrink-0">Dismiss</button>
              </div>
            ))}
            {notifications.filter(n => !n.read).slice(0, 5).map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{new Date(n.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <button onClick={async () => {
                  try { await api.put(`/notifications/${n.id}/read`); setNotifications(notifications.map(x => x.id === n.id ? { ...x, read: true } : x)); } catch {}
                }} className="text-xs text-slate-500 hover:text-slate-300 flex-shrink-0">Dismiss</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* End-of-Day Summary Modal */}
      <Modal open={eodOpen} onClose={() => setEodOpen(false)} title={`End of Day — ${today}`} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-emerald-400 font-medium uppercase">Total Sales</p>
              <p className="text-xl font-bold text-white mt-1">{formatCurrency(todayRevenue)}</p>
              <p className="text-xs text-slate-500">{todaySales.length} transactions</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-400 font-medium uppercase">Cash</p>
              <p className="text-xl font-bold text-white mt-1">{formatCurrency(cashToday)}</p>
              <p className="text-xs text-slate-500">In till today</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-purple-400 font-medium uppercase">Mobile Money</p>
              <p className="text-xl font-bold text-white mt-1">{formatCurrency(mobileToday)}</p>
              <p className="text-xs text-slate-500">M-Pesa / Tigo / Airtel</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-amber-400 font-medium uppercase">Credit Sales</p>
              <p className="text-xl font-bold text-white mt-1">{formatCurrency(creditToday)}</p>
              <p className="text-xs text-slate-500">{todaySales.filter(s => s.paymentMethod === 'credit').length} debtors</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Today's Expenses</p>
              <p className="text-lg font-bold text-red-400">{formatCurrency(expensesToday)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Today's Profit</p>
              <p className="text-lg font-bold text-emerald-400">{formatCurrency(todayProfit)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Expected Cash in Till</p>
              <p className={`text-lg font-bold ${eodExpectedCash >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(eodExpectedCash)}</p>
              <p className="text-xs text-slate-500">Cash sales − expenses</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Net for Today</p>
              <p className={`text-lg font-bold ${todayRevenue - expensesToday >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(todayRevenue - expensesToday)}</p>
              <p className="text-xs text-slate-500">Revenue − expenses</p>
            </div>
          </div>

          {/* Best Selling Hours Today */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2">Sales by Hour Today</h4>
            <div style={{ height: 120 }}>
              <Bar data={{
                labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                datasets: [{ label: 'Revenue', data: hourBuckets, backgroundColor: hourBuckets.map(v => v > 0 ? 'rgba(110,231,183,0.7)' : 'rgba(255,255,255,0.04)'), borderRadius: 4 }]
              }} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 9 }, stepSize: 3 } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { size: 9 }, callback: v => 'TZS ' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) } } }
              }} />
            </div>
          </div>

          {topProductToday && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Today's Top Seller</p>
              <p className="text-sm font-bold text-white">{topProductToday.productName} — {formatCurrency(topProductToday.total)}</p>
              <p className="text-xs text-slate-500">{topProductToday.quantity} units</p>
            </div>
          )}

          {outstandingDebts > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
              <CreditCard size={18} className="text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-400">{formatCurrency(outstandingDebts)} outstanding across {creditSales.length} debtors</p>
                <button onClick={() => { setEodOpen(false); navigate('/sales'); }} className="text-xs text-emerald-400 hover:underline mt-0.5">Collect payments →</button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={printReceipt} className="btn-ghost flex-1 justify-center"><FileText size={14} className="mr-1.5" />Print Receipt</button>
            <button onClick={() => setEodOpen(false)} className="btn-primary flex-1 justify-center">Close</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
