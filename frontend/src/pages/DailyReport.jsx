import React, { useEffect, useState, useRef } from 'react';
import { Printer, Calendar, ShoppingCart, TrendingUp, TrendingDown, CreditCard, Wallet, Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';

export default function DailyReport() {
  const { t } = useLanguage();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/sales'),
      api.get('/expenses'),
      api.get('/customers'),
    ]).then(([sRes, eRes, cRes]) => {
      setSales(sRes.data.data);
      setExpenses(eRes.data.data);
      setCustomers(cRes.data.data || []);
    }).catch(e => toast.error(e.message))
    .finally(() => setLoading(false));
  }, []);

  const daySales = sales.filter(s => s.date === date && (!selectedCustomer || s.customerName === selectedCustomer));
  const dayExpenses = expenses.filter(e => e.date === date && e.visible !== 'false');
  const customerNames = [...new Set(sales.filter(s => s.customerName && s.customerName !== 'Walk-in').map(s => s.customerName))].sort();

  const totalRevenue = daySales.reduce((s, sale) => s + Number(sale.total || 0), 0);
  const totalProfit = daySales.reduce((s, sale) => s + Number(sale.profit || 0), 0);
  const totalExpense = dayExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const net = totalRevenue - totalExpense;
  const cashSales = daySales.filter(s => s.paymentMethod === 'cash').reduce((s, sl) => s + Number(sl.total || 0), 0);
  const mobileSales = daySales.filter(s => s.paymentMethod === 'mobile').reduce((s, sl) => s + Number(sl.total || 0), 0);
  const creditSales = daySales.filter(s => s.paymentMethod === 'credit').reduce((s, sl) => s + Number(sl.total || 0), 0);
  const debtCollected = daySales.filter(s => s.paymentStatus === 'partial').reduce((s, sl) => s + Number(sl.paidAmount || 0), 0);

  const productMap = {};
  daySales.forEach(s => {
    const items = s.items?.length ? s.items : [{ productName: s.productName, quantity: s.quantity, total: s.total }];
    items.forEach(item => {
      if (!item.productName) return;
      productMap[item.productName] = productMap[item.productName] || { qty: 0, total: 0 };
      productMap[item.productName].qty += Number(item.quantity || 0);
      productMap[item.productName].total += Number(item.total || 0);
    });
  });
  const topProducts = Object.entries(productMap).sort((a, b) => b[1].total - a[1].total);

  const handlePrint = () => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Daily Report - ${date}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; color: #000; }
        h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
        h2 { font-size: 14px; text-align: center; color: #555; margin-top: 0; font-weight: normal; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #ddd; font-size: 11px; }
        th { background: #f5f5f5; font-weight: bold; }
        .total-row { font-weight: bold; border-top: 2px solid #000; }
        .right { text-align: right; }
        .center { text-align: center; }
        .kpi-grid { display: flex; gap: 12px; justify-content: center; margin: 12px 0; flex-wrap: wrap; }
        .kpi { padding: 10px 16px; border: 1px solid #ddd; border-radius: 4px; text-align: center; min-width: 120px; }
        .kpi-value { font-size: 16px; font-weight: bold; margin-top: 4px; }
        .section-title { font-size: 13px; font-weight: bold; margin-top: 16px; margin-bottom: 6px; border-bottom: 1px solid #000; padding-bottom: 4px; }
        .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #999; }
        .print-btn { text-align: center; margin-bottom: 16px; }
        @media print { .print-btn { display: none; } }
      </style></head><body>
      <h1>SKYC CRM - Daily Report</h1>
      <h2>${date}${selectedCustomer ? ` · ${selectedCustomer}` : ''}</h2>
      <div class="kpi-grid">
        <div class="kpi"><div>Total Sales</div><div class="kpi-value">${formatCurrency(totalRevenue)}</div></div>
        <div class="kpi"><div>Total Profit</div><div class="kpi-value">${formatCurrency(totalProfit)}</div></div>
        <div class="kpi"><div>Total Expenses</div><div class="kpi-value">${formatCurrency(totalExpense)}</div></div>
        <div class="kpi"><div>Net</div><div class="kpi-value">${formatCurrency(net)}</div></div>
      </div>
      <div class="print-btn"><button onclick="window.print()">Print</button></div>
      <div class="section-title">Payment Breakdown</div>
      <table><tr><th>Method</th><th class="right">Amount</th></tr>
      <tr><td>Cash</td><td class="right">${formatCurrency(cashSales)}</td></tr>
      <tr><td>Mobile Money</td><td class="right">${formatCurrency(mobileSales)}</td></tr>
      <tr><td>Credit</td><td class="right">${formatCurrency(creditSales)}</td></tr>
      <tr><td>Debt Collected</td><td class="right">${formatCurrency(debtCollected)}</td></tr>
      </table>
      <div class="section-title">Top Products</div>
      <table><tr><th>Product</th><th class="center">Qty</th><th class="right">Total</th></tr>
      ${topProducts.map(([name, data]) => `<tr><td>${name}</td><td class="center">${data.qty}</td><td class="right">${formatCurrency(data.total)}</td></tr>`).join('')}
      </table>
      <div class="section-title">All Sales (${daySales.length})</div>
      <table><tr><th>#</th><th>Product</th><th>Customer</th><th class="center">Qty</th><th class="right">Total</th><th>Payment</th></tr>
      ${daySales.map((s, i) => `<tr><td>${i + 1}</td><td>${s.productName || (s.items?.[0]?.productName || '—')}</td><td>${s.customerName || 'Walk-in'}</td><td class="center">${s.quantity}</td><td class="right">${formatCurrency(s.total)}</td><td>${s.paymentMethod}</td></tr>`).join('')}
      </table>
      <div class="section-title">Expenses (${dayExpenses.length})</div>
      <table><tr><th>Name</th><th>Category</th><th class="right">Amount</th></tr>
      ${dayExpenses.map(e => `<tr><td>${e.name}</td><td>${e.category}</td><td class="right">${formatCurrency(e.amount)}</td></tr>`).join('')}
      </table>
      <div class="footer">Generated by SKYC CRM · ${new Date().toLocaleString()}</div>
      <script>window.onload = function() { setTimeout(function() { window.print(); }, 300); }</script>
      </body></html>
    `);
    w.document.close();
  };

  if (loading) return <LoadingState message={t('loading')} />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Daily Report" subtitle={t('reportsSubtitle')} action={
        <button onClick={handlePrint} className="btn-primary text-sm"><Printer size={15} className="mr-1.5" />Print Report</button>
      } />

      <div className="flex flex-wrap gap-3 items-center">
        <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
        <input className="form-input w-auto" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <div className="relative" style={{ minWidth: 200 }}>
          <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <select className="form-input pl-9" value={selectedCustomer}
            onChange={e => setSelectedCustomer(e.target.value)}
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
            <option value="">All Customers</option>
            {customerNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{daySales.length} sales · {dayExpenses.length} expenses</span>
        {selectedCustomer && (
          <button onClick={() => setSelectedCustomer('')} className="text-xs" style={{ color: 'var(--red)' }}>Clear</button>
        )}
      </div>

      <div ref={printRef} className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--green-bg)' }}>
                <ShoppingCart size={15} style={{ color: 'var(--green)' }} />
              </div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total Sales</p>
            </div>
            <p className="text-lg font-bold" style={{ color: 'var(--green)' }}>{formatCurrency(totalRevenue)}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{daySales.length} transactions</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--green-bg)' }}>
                <TrendingUp size={15} style={{ color: 'var(--green)' }} />
              </div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total Profit</p>
            </div>
            <p className="text-lg font-bold" style={{ color: 'var(--green)' }}>{formatCurrency(totalProfit)}</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--red-bg)' }}>
                <TrendingDown size={15} style={{ color: 'var(--red)' }} />
              </div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total Expenses</p>
            </div>
            <p className="text-lg font-bold" style={{ color: 'var(--red)' }}>{formatCurrency(totalExpense)}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{dayExpenses.length} entries</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: net >= 0 ? 'var(--green-bg)' : 'var(--red-bg)' }}>
                <Wallet size={15} style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }} />
              </div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Net</p>
            </div>
            <p className="text-lg font-bold" style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatCurrency(net)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Payment Breakdown</h3>
            <div className="space-y-2">
              {[
                { label: 'Cash', amount: cashSales, color: 'var(--green)' },
                { label: 'Mobile Money', amount: mobileSales, color: 'var(--green)' },
                { label: 'Credit', amount: creditSales, color: 'var(--red)' },
                { label: 'Debt Collected', amount: debtCollected, color: 'var(--green)' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                  <span className="text-xs font-medium" style={{ color: item.color }}>{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Top Products</h3>
            <div className="space-y-2">
              {topProducts.slice(0, 8).map(([name, data]) => (
                <div key={name} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{name}</span>
                    <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>x{data.qty}</span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--green)' }}>{formatCurrency(data.total)}</span>
                </div>
              ))}
              {topProducts.length === 0 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No sales</p>}
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>All Sales ({daySales.length})</h3>
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>#</th>
                  <th className="text-left py-2 px-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Product</th>
                  <th className="text-left py-2 px-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Customer</th>
                  <th className="text-center py-2 px-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Qty</th>
                  <th className="text-right py-2 px-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Total</th>
                  <th className="text-center py-2 pl-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Payment</th>
                </tr>
              </thead>
              <tbody>
                {daySales.map((s, i) => (
                  <tr key={s.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-2 pr-2 text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td className="py-2 px-2 text-xs" style={{ color: 'var(--text-primary)' }}>{s.productName || s.items?.[0]?.productName || '—'}</td>
                    <td className="py-2 px-2 text-xs" style={{ color: 'var(--text-muted)' }}>{s.customerName || 'Walk-in'}</td>
                    <td className="py-2 px-2 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{s.quantity}</td>
                    <td className="py-2 px-2 text-right text-xs font-medium" style={{ color: 'var(--green)' }}>{formatCurrency(s.total)}</td>
                    <td className="py-2 pl-2 text-center">
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>{s.paymentMethod}</span>
                    </td>
                  </tr>
                ))}
                {daySales.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No sales on this date</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {dayExpenses.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Expenses ({dayExpenses.length})</h3>
            <div className="overflow-x-auto">
              <table className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Name</th>
                    <th className="text-left py-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Category</th>
                    <th className="text-right py-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {dayExpenses.map(e => (
                    <tr key={e.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-2 text-xs" style={{ color: 'var(--text-primary)' }}>{e.name}</td>
                      <td className="py-2 text-xs" style={{ color: 'var(--text-muted)' }}>{e.category}</td>
                      <td className="py-2 text-right text-xs font-medium" style={{ color: 'var(--red)' }}>{formatCurrency(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
