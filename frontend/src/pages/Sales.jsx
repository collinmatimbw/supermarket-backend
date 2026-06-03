import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, ShoppingCart, Trash2, Filter, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState, EmptyState } from '../components/LoadingState';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';

const emptyForm = { productId: '', productName: '', quantity: 1, price: 0, total: 0, profit: 0, customerName: 'Walk-in', paymentMethod: 'cash' };

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
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
    ]).then(([s, p, c]) => {
      setSales(s.data.data);
      setProducts(p.data.data);
      setCustomers(c.data.data);
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
    setForm(prev => ({
      ...prev,
      quantity,
      total: prev.price * quantity,
      profit: ((prev.price - 0) * quantity),
    }));
  };

  const openNewSale = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.productId && !form.productName) return toast.error('Select a product');
    setSaving(true);
    try {
      await api.post('/sales', form);
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
        <button onClick={openNewSale} className="btn-primary text-sm px-5 py-2.5 text-base">
          <Plus size={18} className="mr-1.5" />New Sale
        </button>
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
                    <td className="py-3 px-4 text-center text-slate-400 text-xs">{sale.customerName}</td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => handleDelete(sale.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
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
            <select className="form-input" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })}>
              <option value="Walk-in">Walk-in Customer</option>
              {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Payment Method</label>
            <div className="flex gap-2">
              {['cash', 'mobile', 'credit'].map(m => (
                <button key={m} onClick={() => setForm({ ...form, paymentMethod: m })}
                  className={`flex-1 p-2.5 rounded-xl text-xs font-medium capitalize transition-all ${form.paymentMethod === m ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSave} className="btn-primary w-full justify-center py-3 text-base" disabled={saving}>
            {saving ? 'Recording...' : 'Complete Sale'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
