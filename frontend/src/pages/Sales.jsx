import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, ShoppingCart, Trash2, Filter, Download, MessageCircle, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState, EmptyState } from '../components/LoadingState';
import api from '../utils/api';
import { formatCurrency, formatDate, exportToCSV, sendWhatsApp, formatReceipt, formatDebtReminder } from '../utils/helpers';

const emptyForm = { productId: '', productName: '', quantity: 1, price: 0, total: 0, profit: 0, customerName: 'Walk-in', customerPhone: '', paymentMethod: 'cash', paidAmount: 0, soldBy: '', sendReceipt: false };

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('all');

  const load = useCallback(() => {
    Promise.all([
      api.get('/sales'),
      api.get('/products'),
      api.get('/customers'),
      api.get('/employees'),
    ]).then(([s, p, c, e]) => {
      setSales(s.data.data);
      setProducts(p.data.data);
      setCustomers(c.data.data);
      setEmployees(e.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = paymentFilter === 'all' ? sales : sales.filter(s => s.paymentMethod === paymentFilter);
  const searched = filtered.filter(s =>
    !search || s.productName?.toLowerCase().includes(search.toLowerCase()) || s.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleProductSelect = (pid) => {
    const p = products.find(pr => pr.id === pid);
    if (p) {
      setForm(prev => ({
        ...prev,
        productId: p.id,
        productName: p.name,
        price: p.price,
        total: p.price * (prev.quantity || 1),
        profit: ((p.price - (p.costPrice || 0)) * (prev.quantity || 1)),
      }));
    }
  };

  const updateQuantity = (q) => {
    const quantity = Math.max(1, Number(q) || 1);
    setForm(prev => {
      const product = products.find(p => p.id === prev.productId);
      const costPrice = product?.costPrice || 0;
      return {
        ...prev,
        quantity,
        total: prev.price * quantity,
        profit: (prev.price - costPrice) * quantity,
      };
    });
  };

  const openNewSale = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.productId && !form.productName) return toast.error('Select a product');
    setSaving(true);
    try {
      const { data } = await api.post('/sales', form);
      const sale = data.data;
      if (form.sendReceipt && sale) {
        sendWhatsApp(form.customerPhone, formatReceipt(sale));
      }
      toast.success('Sale recorded');
      setModalOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sale?')) return;
    try {
      await api.delete(`/sales/${id}`);
      toast.success('Sale deleted');
      load();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <LoadingState message="Loading sales..." />;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Sales</h1>
          <p className="text-sm text-slate-500 mt-0.5">{sales.length} transactions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(sales, 'sales-export', [
            { label: 'Date', key: 'date' },
            { label: 'Product', key: 'productName' },
            { label: 'Quantity', key: 'quantity' },
            { label: 'Total', key: 'total' },
            { label: 'Profit', key: 'profit' },
            { label: 'Payment', key: 'paymentMethod' },
            { label: 'Status', key: 'paymentStatus' },
            { label: 'Balance', key: 'balance' },
            { label: 'Customer', key: 'customerName' },
          ])} className="btn-ghost text-sm px-3 py-2.5">
            <Download size={16} className="mr-1.5" />Export
          </button>
          <button onClick={openNewSale} className="btn-primary text-sm px-5 py-2.5 text-base">
            <Plus size={18} className="mr-1.5" />New Sale
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="form-input pl-9" placeholder="Search sales..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {['all', 'cash', 'mobile', 'credit'].map(p => (
            <button key={p} onClick={() => setPaymentFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${paymentFilter === p ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {searched.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <ShoppingCart size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No sales found</p>
          <button onClick={openNewSale} className="btn-primary text-sm mt-4">Record your first sale</button>
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Product</th>
                  <th className="text-center py-3 px-4 font-medium">Qty</th>
                  <th className="text-right py-3 px-4 font-medium">Total</th>
                  <th className="text-right py-3 px-4 font-medium">Profit</th>
                  <th className="text-center py-3 px-4 font-medium">Payment</th>
                  <th className="text-center py-3 px-4 font-medium">Status</th>
                  <th className="text-center py-3 px-4 font-medium">Sold By</th>
                  <th className="text-center py-3 px-4 font-medium">Customer</th>
                  <th className="text-center py-3 px-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {searched.map(sale => (
                  <tr key={sale.id} className="border-b border-slate-700/50 hover:bg-white/5">
                    <td className="py-3 px-4 text-slate-400 text-xs">{sale.date}</td>
                    <td className="py-3 px-4 text-white font-medium">{sale.productName}</td>
                    <td className="py-3 px-4 text-center text-slate-300">{sale.quantity}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-medium">{formatCurrency(sale.total)}</td>
                    <td className="py-3 px-4 text-right text-blue-400">{formatCurrency(sale.profit)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${sale.paymentMethod === 'cash' ? 'bg-emerald-500/20 text-emerald-400' : sale.paymentMethod === 'mobile' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${sale.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : sale.paymentStatus === 'partial' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {sale.paymentStatus === 'paid' ? 'Paid' : sale.paymentStatus === 'partial' ? `${formatCurrency(sale.balance)} due` : 'Debt'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400 text-xs">{sale.soldBy || '—'}</td>
                    <td className="py-3 px-4 text-center text-slate-400 text-xs">
                      <div className="flex items-center justify-center gap-1">
                        <span>{sale.customerName}</span>
                        {sale.customerName && sale.customerName !== 'Walk-in' && sale.balance > 0 && (
                          <button onClick={() => sendWhatsApp(sale.customerPhone || '', formatDebtReminder(sale))}
                            className="p-1 rounded text-green-400 hover:bg-green-500/10 transition-colors" title="Send debt reminder">
                            <MessageCircle size={11} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {sale.customerPhone && (
                          <button onClick={() => sendWhatsApp(sale.customerPhone, formatReceipt(sale))}
                            className="p-1.5 rounded-lg text-green-500 hover:bg-green-500/10 transition-colors" title="Send WhatsApp receipt">
                            <MessageCircle size={12} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(sale.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Sale" size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Product</label>
            <select className="form-input" value={form.productId} onChange={e => handleProductSelect(e.target.value)}>
              <option value="">Select product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} - TZS {p.price.toLocaleString()} (Stock: {p.quantity})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Quantity</label>
              <input className="form-input" type="number" min={1} value={form.quantity} onChange={e => updateQuantity(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Price (TZS)</label>
              <input className="form-input" type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value), total: Number(e.target.value) * form.quantity })} />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            <span className="text-sm text-slate-400">Total</span>
            <span className="text-lg font-bold text-emerald-400">{formatCurrency(form.total)}</span>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Customer</label>
            <select className="form-input" value={form.customerName} onChange={e => {
              const c = customers.find(c => c.name === e.target.value);
              setForm({ ...form, customerName: e.target.value, customerPhone: c?.phone || '' });
            }}>
              <option value="Walk-in">Walk-in Customer</option>
              {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          {(form.customerName && form.customerName !== 'Walk-in') && (
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Customer Phone</label>
              <input className="form-input" placeholder="Phone for WhatsApp receipt" value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Payment Method</label>
            <div className="flex gap-2">
              {['cash', 'mobile', 'credit'].map(m => (
                <button key={m} onClick={() => setForm({ ...form, paymentMethod: m, paidAmount: m === 'credit' ? 0 : form.total })}
                  className={`flex-1 p-2.5 rounded-xl text-xs font-medium capitalize transition-all ${form.paymentMethod === m ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          {form.paymentMethod === 'credit' && (
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Amount Paid Now (TZS)</label>
              <input className="form-input" type="number" min={0} max={form.total} placeholder="0" value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: Number(e.target.value) })} />
              {form.paidAmount < form.total && (
                <p className="text-xs text-yellow-400 mt-1">Balance: {formatCurrency(form.total - form.paidAmount)}</p>
              )}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Sold By</label>
            {employees.length > 0 ? (
              <select className="form-input" value={form.soldBy} onChange={e => setForm({ ...form, soldBy: e.target.value })}>
                <option value="">Select employee</option>
                {employees.filter(e => e.status === 'active').map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
              </select>
            ) : (
              <input className="form-input" placeholder="Employee name (optional)" value={form.soldBy} onChange={e => setForm({ ...form, soldBy: e.target.value })} />
            )}
          </div>
          {form.customerName && form.customerName !== 'Walk-in' && form.customerPhone && (
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 cursor-pointer">
              <input type="checkbox" checked={form.sendReceipt} onChange={e => setForm({ ...form, sendReceipt: e.target.checked })}
                className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500" />
              <span className="text-xs text-slate-300">Send WhatsApp receipt to customer</span>
            </label>
          )}
          <button onClick={handleSave} className="btn-primary w-full justify-center py-3 text-base" disabled={saving}>
            {saving ? 'Recording...' : 'Complete Sale'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
