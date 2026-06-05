import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Download, TrendingUp, TrendingDown, DollarSign, PiggyBank, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState, EmptyState } from '../components/LoadingState';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import { formatCurrency, exportToCSV, formatDate } from '../utils/helpers';

const SOURCES = [
  { value: 'personal', label: 'Personal Savings', color: 'text-emerald-400 bg-emerald-500/10' },
  { value: 'loan', label: 'Loan', color: 'text-emerald-400 bg-emerald-500/10' },
  { value: 'investor', label: 'Investor', color: 'text-emerald-400 bg-emerald-500/10' },
  { value: 'other', label: 'Other', color: 'text-slate-400 bg-slate-500/10' },
];

const emptyForm = { amount: 0, source: 'personal', date: '', notes: '' };

export default function Savings() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get('/savings').then(r => {
      setData(r.data.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAddCapital = async () => {
    if (!form.amount || form.amount <= 0) return toast.error(t('amountRequired'));
    setSaving(true);
    try {
      await api.post('/capital', form);
      toast.success(t('capitalAdded'));
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  if (loading) return <LoadingState message={t('loadingSavings')} />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={t('savings')} subtitle={t('savingsBalance')} action={
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(data?.transactions || [], 'savings-history', [
            { label: 'Date', key: 'date' },
            { label: 'Type', key: 'type' },
            { label: 'Description', key: 'description' },
            { label: 'Amount', key: 'amount' },
          ])} className="btn-ghost text-sm"><Download size={14} className="mr-1.5" />{t('export')}</button>
          <button onClick={() => setModalOpen(true)} className="btn-primary text-sm"><Plus size={15} className="mr-1.5" />{t('addCapital')}</button>
        </div>
      } />

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <PiggyBank size={24} className="text-emerald-400" />
          <p className="text-sm font-medium text-emerald-400/80 uppercase tracking-wider">{t('savingsBalance')}</p>
        </div>
        <p className="text-3xl sm:text-4xl font-bold text-white">{formatCurrency(data?.balance || 0)}</p>
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-emerald-500/20">
          <div>
            <p className="text-xs text-slate-500">{t('totalCapital')}</p>
            <p className="text-lg font-semibold text-emerald-400">{formatCurrency(data?.totalCapital || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{t('totalProfitLabel')}</p>
            <p className="text-lg font-semibold text-emerald-400">+{formatCurrency(data?.totalProfit || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{t('totalExpensesLabel')}</p>
            <p className="text-lg font-semibold text-red-400">-{formatCurrency(data?.totalExpenses || 0)}</p>
          </div>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpCircle size={16} className="text-emerald-400" />
            <p className="text-xs text-slate-500">{t('capitalAdded')}</p>
          </div>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(data?.totalCapital || 0)}</p>
          <p className="text-xs text-slate-500 mt-1">{data?.capitalCount || 0} entries</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-emerald-400" />
            <p className="text-xs text-slate-500">{t('profitAdded')}</p>
          </div>
          <p className="text-xl font-bold text-emerald-400">+{formatCurrency(data?.totalProfit || 0)}</p>
          <p className="text-xs text-slate-500 mt-1">{data?.saleCount || 0} sales</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-red-400" />
            <p className="text-xs text-slate-500">{t('expenseDeducted')}</p>
          </div>
          <p className="text-xl font-bold text-red-400">-{formatCurrency(data?.totalExpenses || 0)}</p>
          <p className="text-xs text-slate-500 mt-1">{data?.expenseCount || 0} entries</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-white">{t('transactionHistory')}</h3>
        </div>
        {(!data?.transactions || data.transactions.length === 0) ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">{t('noTransactions')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50 max-h-[500px] overflow-y-auto">
            {data.transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5">
                <div className="flex items-center gap-3 min-w-0">
                  {tx.type === 'capital' ? (
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <DollarSign size={14} className="text-emerald-400" />
                    </div>
                  ) : tx.type === 'profit' ? (
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp size={14} className="text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <TrendingDown size={14} className="text-red-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                    <p className="text-xs text-slate-500">{tx.date}{tx.notes ? ` · ${tx.notes}` : ''}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold flex-shrink-0 ml-3 ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Capital Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('addCapital')}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">{t('capitalSource')}</label>
            <div className="grid grid-cols-2 gap-2">
              {SOURCES.map(s => (
                <button key={s.value} onClick={() => setForm({ ...form, source: s.value })}
                  className={`p-2.5 rounded-xl text-xs font-medium transition-all border ${form.source === s.value ? s.color + ' border-emerald-500/30' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('amount')}</label>
            <input className="form-input" type="number" min={0} placeholder="0" value={form.amount}
              onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('date')}</label>
            <input className="form-input" type="date" value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('notes')}</label>
            <input className="form-input" placeholder={t('optionalNotes')} value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button onClick={handleAddCapital} className="btn-primary w-full justify-center py-3" disabled={saving || !form.amount || form.amount <= 0}>
            {saving ? t('saving') : t('addCapital')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
