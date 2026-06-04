import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trash2, Download, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import { formatCurrency, exportToCSV } from '../utils/helpers';

const SOURCES = [
  { value: 'personal', label: 'Personal Savings', color: 'text-emerald-400 bg-emerald-500/10' },
  { value: 'loan', label: 'Loan', color: 'text-blue-400 bg-blue-500/10' },
  { value: 'investor', label: 'Investor', color: 'text-purple-400 bg-purple-500/10' },
  { value: 'other', label: 'Other', color: 'text-slate-400 bg-slate-500/10' },
];

const emptyForm = { amount: 0, source: 'personal', date: '', notes: '' };

export default function Capital() {
  const { t } = useLanguage();
  const [records, setRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      api.get('/capital'),
      api.get('/expenses'),
    ]).then(([c, e]) => {
      setRecords(c.data.data);
      setExpenses(e.data.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const searched = records.filter(r =>
    !search || r.source?.toLowerCase().includes(search.toLowerCase()) || r.notes?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCapital = records.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const remaining = Math.max(0, totalCapital - totalExpenses);
  const utilizationPct = totalCapital > 0 ? Math.min(100, (totalExpenses / totalCapital) * 100) : 0;

  const handleSave = async () => {
    if (!form.amount || form.amount <= 0) return toast.error(t('amountPositive'));
    setSaving(true);
    try {
      await api.post('/capital', form);
      toast.success(t('capitalAdded'));
      setModalOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id, amount) => {
    if (!window.confirm(t('capitalRemoved').replace('...', `TZS ${Number(amount).toLocaleString()}`))) return;
    try { await api.delete(`/capital/${id}`); toast.success(t('removed')); load(); } catch (e) { toast.error(e.message); }
  };

  if (loading) return <LoadingState message={t('loadingCapital')} />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={t('capital')} subtitle={`${formatCurrency(totalCapital)} ${t('totalInjected')}`} action={
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(records, 'capital-export', [
            { label: 'Date', key: 'date' },
            { label: 'Amount', key: 'amount' },
            { label: 'Source', key: 'source' },
            { label: 'Notes', key: 'notes' },
          ])} className="btn-ghost text-sm"><Download size={14} className="mr-1.5" />{t('export')}</button>
          <button onClick={() => { setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] }); setModalOpen(true); }} className="btn-primary text-sm"><Plus size={15} className="mr-1.5" />{t('addCapital')}</button>
        </div>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
          <DollarSign size={16} className="text-emerald-400 mb-1.5" />
          <p className="text-xs text-slate-500">{t('totalInjected')}</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalCapital)}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
          <TrendingUp size={16} className="text-blue-400 mb-1.5" />
          <p className="text-xs text-slate-500">{t('utilized')}</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
          <PieChart size={16} className="text-amber-400 mb-1.5" />
          <p className="text-xs text-slate-500">{t('remaining')}</p>
          <p className="text-xl font-bold text-amber-400">{formatCurrency(remaining)}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-center">
          <p className="text-xs text-slate-500 mb-1.5">{t('utilizationProgress')}</p>
          <div className="bg-slate-700/50 rounded-full h-2.5 overflow-hidden mb-1">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${utilizationPct}%`, background: utilizationPct > 80 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : utilizationPct > 50 ? 'linear-gradient(90deg, #6ee7b7, #f59e0b)' : 'linear-gradient(90deg, #6ee7b7, #34d399)' }} />
          </div>
          <p className="text-xs text-slate-500">{utilizationPct.toFixed(1)}{t('percentUsed')}</p>
        </div>
      </div>

      {records.length > 0 && (
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="form-input pl-9" placeholder={t('searchCapital')} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {searched.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <TrendingDown size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">{t('noCapitalRecords')}</p>
          <p className="text-slate-500 text-sm mt-1">{t('trackMoney')}</p>
          <button onClick={() => { setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] }); setModalOpen(true); }} className="btn-primary text-sm mt-4">{t('addFirstInjection')}</button>
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-3 px-4 font-medium">{t('date')}</th>
                  <th className="text-left py-3 px-4 font-medium">{t('source')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('amount')}</th>
                  <th className="text-left py-3 px-4 font-medium">{t('notes')}</th>
                  <th className="text-center py-3 px-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {searched.map(r => {
                  const src = SOURCES.find(s => s.value === r.source) || SOURCES[3];
                  return (
                    <tr key={r.id} className="border-b border-slate-700/50 hover:bg-white/5">
                      <td className="py-3 px-4 text-slate-400 text-xs">{r.date}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${src.color}`}>{t(src.value === 'personal' ? 'personalSavings' : src.value)}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-medium">{formatCurrency(r.amount)}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{r.notes || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleDelete(r.id, r.amount)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('addCapitalInjection')}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('source')}</label>
            <div className="grid grid-cols-2 gap-2">
              {SOURCES.map(s => (
                  <button key={s.value} onClick={() => setForm({ ...form, source: s.value })}
                  className={`p-3 rounded-xl text-xs font-medium transition-all ${form.source === s.value ? 'ring-2 ring-emerald-500/40 bg-emerald-500/10 ' + s.color : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                  {t(s.value === 'personal' ? 'personalSavings' : s.value)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('amountTzs')}</label>
            <input className="form-input" type="number" min={1} placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} autoFocus />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('date')}</label>
            <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('notes')}</label>
            <input className="form-input" placeholder={t('whereFrom')} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button onClick={handleSave} className="btn-primary w-full justify-center" disabled={saving}>
            {saving ? t('adding') : t('addCapital')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
