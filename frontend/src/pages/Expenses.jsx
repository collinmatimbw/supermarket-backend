import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trash2, Receipt, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState, EmptyState } from '../components/LoadingState';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';

const EXPENSE_CATEGORIES = ['rent', 'salaries', 'transport', 'stock purchase', 'utilities', 'maintenance', 'marketing', 'other'];
const emptyForm = { name: '', category: 'other', amount: 0, date: '', paymentMethod: 'cash', notes: '' };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const load = useCallback(() => {
    api.get('/expenses').then(r => setExpenses(r.data.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = categoryFilter === 'all' ? expenses : expenses.filter(e => e.category === categoryFilter);
  const searched = filtered.filter(e =>
    !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.category?.toLowerCase().includes(search.toLowerCase())
  );
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const openAdd = () => { setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.amount) return toast.error('Name and amount required');
    setSaving(true);
    try {
      await api.post('/expenses', form);
      toast.success('Expense recorded');
      setModalOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await api.delete(`/expenses/${id}`); toast.success('Deleted'); load(); } catch (e) { toast.error(e.message); }
  };

  if (loading) return <LoadingState message="Loading expenses..." />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Expenses" subtitle={`${expenses.length} records · ${formatCurrency(totalExpenses)} total`} action={
        <button onClick={openAdd} className="btn-primary text-sm"><Plus size={15} className="mr-1.5" />Add Expense</button>
      } />

      {/* Category Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {EXPENSE_CATEGORIES.filter(c => expenses.some(e => e.category === c)).map(cat => {
          const catTotal = expenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount || 0), 0);
          return (
            <div key={cat} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4" style={categoryFilter === cat ? { borderColor: 'rgba(110,231,183,0.3)' } : {}}>
              <p className="text-xs text-slate-500 capitalize">{cat}</p>
              <p className="text-base font-bold text-white mt-1">{formatCurrency(catTotal)}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="form-input pl-9" placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1 flex-wrap">
          {['all', ...EXPENSE_CATEGORIES].map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${categoryFilter === c ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {searched.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <TrendingDown size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No expenses found</p>
          <button onClick={openAdd} className="btn-primary text-sm mt-4">Record first expense</button>
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-center py-3 px-4 font-medium">Category</th>
                  <th className="text-right py-3 px-4 font-medium">Amount</th>
                  <th className="text-center py-3 px-4 font-medium">Payment</th>
                  <th className="text-center py-3 px-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {searched.map(exp => (
                  <tr key={exp.id} className="border-b border-slate-700/50 hover:bg-white/5">
                    <td className="py-3 px-4 text-slate-400 text-xs">{exp.date}</td>
                    <td className="py-3 px-4 text-white font-medium">{exp.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-500/20 text-slate-300 capitalize">{exp.category}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-red-400 font-medium">{formatCurrency(exp.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${exp.paymentMethod === 'cash' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {exp.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => handleDelete(exp.id, exp.name)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Expense">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Name *</label>
            <input className="form-input" placeholder="What was it for?" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Category</label>
              <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Amount (TZS) *</label>
              <input className="form-input" type="number" min={0} placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Date</label>
              <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Payment Method</label>
              <div className="flex gap-2">
                {['cash', 'mobile', 'bank'].map(m => (
                  <button key={m} onClick={() => setForm({ ...form, paymentMethod: m })}
                    className={`flex-1 p-2.5 rounded-xl text-xs font-medium capitalize transition-all ${form.paymentMethod === m ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Notes</label>
            <input className="form-input" placeholder="Optional notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button onClick={handleSave} className="btn-primary w-full justify-center" disabled={saving}>
            {saving ? 'Recording...' : 'Record Expense'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
