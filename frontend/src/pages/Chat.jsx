import React, { useState, useRef, useEffect } from 'react';
import { Bot, TrendingUp, Package, DollarSign, CreditCard, AlertTriangle, Users, PiggyBank, BarChart3, Target, Loader2, ShoppingCart, Wallet, TrendingDown } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';

const QUESTIONS = [
  { type: 'sales_summary', label: 'Sales Summary', icon: DollarSign, color: 'emerald', desc: 'Revenue, profit, transactions' },
  { type: 'top_products', label: 'Top Products', icon: ShoppingCart, color: 'blue', desc: 'Best selling items ranked' },
  { type: 'profit_analysis', label: 'Profit Analysis', icon: TrendingUp, color: 'purple', desc: 'Margins, net profit, trends' },
  { type: 'expense_breakdown', label: 'Expense Breakdown', icon: TrendingDown, color: 'red', desc: 'Where money is going' },
  { type: 'debt_overview', label: 'Debt Overview', icon: CreditCard, color: 'amber', desc: 'Outstanding balances' },
  { type: 'inventory_alerts', label: 'Inventory Alerts', icon: Package, color: 'rose', desc: 'Low stock & dead stock' },
  { type: 'sales_trend', label: 'Sales Trend', icon: BarChart3, color: 'cyan', desc: 'Daily trend & growth' },
  { type: 'customer_insights', label: 'Customer Insights', icon: Users, color: 'indigo', desc: 'Top customers & repeat rate' },
  { type: 'capital_analysis', label: 'Capital Analysis', icon: PiggyBank, color: 'teal', desc: 'Injected vs utilized' },
  { type: 'prediction', label: 'Predictions', icon: Target, color: 'violet', desc: 'Forecast next 7 days' },
];

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
];

const COLORS = {
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: 'bg-emerald-500/20' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', icon: 'bg-blue-500/20' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', icon: 'bg-purple-500/20' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: 'bg-red-500/20' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: 'bg-amber-500/20' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', icon: 'bg-rose-500/20' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', icon: 'bg-cyan-500/20' },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', icon: 'bg-indigo-500/20' },
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/20', text: 'text-teal-400', icon: 'bg-teal-500/20' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', icon: 'bg-violet-500/20' },
};

function StatBox({ label, value, color }) {
  const c = COLORS[color] || COLORS.emerald;
  return (
    <div className={`${c.bg} ${c.border} border rounded-xl p-3`}>
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${c.text}`}>{value}</p>
    </div>
  );
}

function ResultCard({ result }) {
  const { type } = result;

  if (type === 'sales_summary') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Revenue" value={formatCurrency(result.totalRevenue)} color="emerald" />
          <StatBox label="Profit" value={formatCurrency(result.totalProfit)} color="purple" />
          <StatBox label="Transactions" value={result.transactionCount} color="blue" />
          <StatBox label="Avg/Transaction" value={formatCurrency(result.avgPerTransaction)} color="cyan" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatBox label="Cash" value={formatCurrency(result.cash)} color="emerald" />
          <StatBox label="Mobile" value={formatCurrency(result.mobile)} color="blue" />
          <StatBox label="Credit" value={formatCurrency(result.credit)} color="amber" />
        </div>
        {result.debtBalance > 0 && <StatBox label="Outstanding Debt" value={formatCurrency(result.debtBalance)} color="red" />}
        {result.growth !== null && (
          <div className={`text-xs ${Number(result.growth) >= 0 ? 'text-emerald-400' : 'text-red-400'} text-center`}>
            {Number(result.growth) >= 0 ? '↑' : '↓'} {Math.abs(result.growth)}% vs previous period
          </div>
        )}
        {result.topSeller.length > 0 && (
          <div className="text-xs text-slate-400 text-center">Top: {result.topSeller.map(t => t.name).join(', ')}</div>
        )}
      </div>
    );
  }

  if (type === 'top_products') {
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-slate-500 text-center mb-2">{result.totalProducts} products sold</p>
        {result.products.slice(0, 7).map((p, i) => (
          <div key={p.name} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <span className="text-xs font-bold text-slate-500 w-4">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{p.name}</p>
              <p className="text-[10px] text-slate-500">{p.qty} units · {p.count} sales</p>
            </div>
            <p className="text-sm font-semibold text-emerald-400">{formatCurrency(p.revenue)}</p>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'profit_analysis') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Revenue" value={formatCurrency(result.totalRevenue)} color="emerald" />
          <StatBox label="Gross Profit" value={formatCurrency(result.totalProfit)} color="purple" />
          <StatBox label="Expenses" value={formatCurrency(result.totalExpenses)} color="red" />
          <StatBox label="Net Profit" value={formatCurrency(result.netProfit)} color={result.netProfit >= 0 ? 'emerald' : 'red'} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Gross Margin" value={`${result.margin}%`} color="purple" />
          <StatBox label="Net Margin" value={`${result.netMargin}%`} color={Number(result.netMargin) >= 0 ? 'emerald' : 'red'} />
        </div>
        {result.avgDailyProfit > 0 && <StatBox label="Avg Daily Profit" value={formatCurrency(result.avgDailyProfit)} color="cyan" />}
        {result.trend.length > 0 && (
          <div className="text-xs text-slate-400 text-center">
            Profit trend: {result.trend.length} days · {result.trend.filter(d => d.profit > 0).length} profitable days
          </div>
        )}
      </div>
    );
  }

  if (type === 'expense_breakdown') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Total Expenses" value={formatCurrency(result.totalExpenses)} color="red" />
          <StatBox label="vs Revenue" value={`${result.expenseRatio}%`} color={Number(result.expenseRatio) <= 50 ? 'emerald' : 'red'} />
        </div>
        {result.categories.map(c => (
          <div key={c.category} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <div>
              <p className="text-sm font-medium text-white capitalize">{c.category}</p>
              <p className="text-[10px] text-slate-500">{c.count} entries</p>
            </div>
            <p className="text-sm font-semibold text-red-400">{formatCurrency(c.amount)}</p>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'debt_overview') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <StatBox label="Total Debt" value={formatCurrency(result.totalDebt)} color="red" />
          <StatBox label="Collected" value={formatCurrency(result.totalPaid)} color="emerald" />
          <StatBox label="Debtors" value={result.debtorCount} color="amber" />
        </div>
        {result.debtors.map(d => (
          <div key={d.name} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <div>
              <p className="text-sm font-medium text-white">{d.name}</p>
              <p className="text-[10px] text-slate-500">{d.count} sales · {d.phone}</p>
            </div>
            <p className="text-sm font-semibold text-amber-400">{formatCurrency(d.totalDebt)}</p>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'inventory_alerts') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Total Products" value={result.totalProducts} color="blue" />
          <StatBox label="Inventory Value" value={formatCurrency(result.totalInventoryValue)} color="emerald" />
        </div>
        {result.lowStock.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-rose-400 mb-1.5">Low Stock ({result.lowStockCount})</p>
            {result.lowStock.slice(0, 5).map(p => (
              <div key={p.name} className="flex items-center justify-between p-2 rounded-lg bg-white/5 mb-1">
                <p className="text-sm text-white">{p.name}</p>
                <p className="text-sm text-rose-400">{p.qty} left · {formatCurrency(p.value)}</p>
              </div>
            ))}
          </div>
        )}
        {result.deadStock.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-400 mb-1.5">Dead Stock ({result.deadStockCount})</p>
            {result.deadStock.slice(0, 5).map(p => (
              <div key={p.name} className="flex items-center justify-between p-2 rounded-lg bg-white/5 mb-1">
                <p className="text-sm text-white">{p.name}</p>
                <p className="text-sm text-amber-400">{p.qty} units · {formatCurrency(p.value)} tied up</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (type === 'sales_trend') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Total Revenue" value={formatCurrency(result.totalRevenue)} color="emerald" />
          <StatBox label="Total Profit" value={formatCurrency(result.totalProfit)} color="purple" />
          <StatBox label="Avg Daily" value={formatCurrency(result.avgDaily)} color="blue" />
          <StatBox label="Days" value={result.totalDays} color="cyan" />
        </div>
        {result.peakDay && <StatBox label="Best Day" value={`${result.peakDay.date} · ${formatCurrency(result.peakDay.revenue)}`} color="emerald" />}
        {result.growth !== null && (
          <div className={`text-xs text-center ${Number(result.growth) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {Number(result.growth) >= 0 ? '↑ Growing' : '↓ Declining'} · {Math.abs(result.growth)}% trend
          </div>
        )}
      </div>
    );
  }

  if (type === 'customer_insights') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Total Customers" value={result.totalCustomers} color="blue" />
          <StatBox label="Active" value={result.activeCustomers} color="emerald" />
          <StatBox label="Repeat Rate" value={`${result.repeatRate}%`} color="purple" />
          <StatBox label="Avg/Customer" value={formatCurrency(result.avgPerCustomer)} color="cyan" />
        </div>
        {result.topCustomers.slice(0, 5).map(c => (
          <div key={c.name} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <div>
              <p className="text-sm font-medium text-white">{c.name}</p>
              <p className="text-[10px] text-slate-500">{c.count} visits</p>
            </div>
            <p className="text-sm font-semibold text-emerald-400">{formatCurrency(c.revenue)}</p>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'capital_analysis') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Total Injected" value={formatCurrency(result.totalInjected)} color="emerald" />
          <StatBox label="Utilized" value={formatCurrency(result.totalUtilized)} color="red" />
          <StatBox label="Remaining" value={formatCurrency(result.remaining)} color={result.remaining >= 0 ? 'emerald' : 'red'} />
          <StatBox label="Utilization" value={`${result.utilizationRate}%`} color="purple" />
        </div>
        {result.sources.map(s => (
          <div key={s.source} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <p className="text-sm text-white capitalize">{s.source}</p>
            <p className="text-sm font-semibold text-emerald-400">{formatCurrency(s.amount)}</p>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'prediction') {
    if (!result.canPredict) {
      return <p className="text-sm text-slate-400 text-center">{result.message}</p>;
    }
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Today's Forecast" value={formatCurrency(result.todayPrediction)} color="emerald" />
          <StatBox label="7-Day Avg" value={formatCurrency(result.avgLast7Days)} color="blue" />
          <StatBox label="Current Month" value={formatCurrency(result.currentMonthTotal)} color="purple" />
          <StatBox label="Projected Month" value={formatCurrency(result.projectedMonthTotal)} color="cyan" />
        </div>
        <div className="bg-slate-800/40 rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-2">Next 7 Days Forecast</p>
          <div className="grid grid-cols-7 gap-1">
            {result.next7Days.map((d, i) => (
              <div key={i} className="text-center p-1.5 rounded-lg bg-white/5">
                <p className="text-[10px] text-slate-500">Day {d.day}</p>
                <p className="text-xs font-bold text-emerald-400">{formatCurrency(d.predicted)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className={`text-xs text-center ${result.trend === 'up' ? 'text-emerald-400' : result.trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
          Trend: {result.trend === 'up' ? '↑ Upward' : result.trend === 'down' ? '↓ Downward' : '→ Stable'} · slope {result.slope}
        </div>
      </div>
    );
  }

  return <p className="text-sm text-slate-400">Analysis complete</p>;
}

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m SKYC Analytics. Select a question below or choose a period to analyze your business data.' }
  ]);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const runQuery = async (q) => {
    const userMsg = { role: 'user', content: q.label };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const { data } = await api.post('/analysis/query', { type: q.type, period });
      setMessages(prev => [...prev, { role: 'assistant', content: null, result: data, question: q }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Samahani — failed to load analysis. Check your connection.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">SKYC Analytics</h2>
          <p className="text-xs text-slate-500">Data-driven insights for your business</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PERIODS.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p.key ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40' : 'bg-slate-800/40 text-slate-400 hover:bg-white/10'}`}
          >{p.label}</button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin mb-3">
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'user' ? (
              <div className="flex gap-3 justify-end">
                <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-emerald-500/20 text-emerald-100 text-sm rounded-br-md">
                  <p>{msg.content}</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={15} className="text-emerald-400" />
                </div>
                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-slate-800/60 border border-slate-700/30 text-slate-200 text-sm rounded-bl-md">
                  {msg.content}
                  {msg.result && <ResultCard result={msg.result} />}
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Bot size={15} className="text-emerald-400" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-slate-800/60 border border-slate-700/30">
              <Loader2 size={16} className="animate-spin text-emerald-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Question Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
        {QUESTIONS.map(q => {
          const c = COLORS[q.color];
          return (
            <button key={q.type} onClick={() => runQuery(q)} disabled={loading}
              className={`${c.bg} ${c.border} border rounded-xl p-2.5 text-left hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className={`w-7 h-7 rounded-lg ${c.icon} flex items-center justify-center mb-1.5`}>
                <q.icon size={14} className={c.text} />
              </div>
              <p className={`text-xs font-semibold ${c.text}`}>{q.label}</p>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{q.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
