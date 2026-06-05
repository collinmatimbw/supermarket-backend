import React, { useEffect, useState, useCallback } from 'react';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, Plus, X, Wallet, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';

const PERIODS = ['all', 'today', 'week', 'month'];

export default function CashFlow() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [adjustModal, setAdjustModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adjForm, setAdjForm] = useState({ type: 'in', description: '', amount: '', date: new Date().toISOString().split('T')[0] });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/cash-flow/summary?period=${period}`);
      setSummary(data.data);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const handleAdjust = async () => {
    if (!adjForm.amount || Number(adjForm.amount) <= 0) return toast.error(t('amountRequired'));
    setSaving(true);
    try {
      await api.post('/cash-flow/adjust', { ...adjForm, amount: Number(adjForm.amount) });
      toast.success(t('adjustmentAdded'));
      setAdjustModal(false);
      setAdjForm({ type: 'in', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
      load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  if (loading) return <LoadingState message={t('loading')} />;

  const breakdownItems = summary?.breakdown ? Object.entries(summary.breakdown) : [];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={t('cashFlow')} subtitle={t('cashFlowSubtitle')} action={
        <button onClick={() => setAdjustModal(true)} className="btn-primary text-sm"><Plus size={15} className="mr-1.5" />{t('addAdjustment')}</button>
      } />

      <div className="flex gap-2 flex-wrap">
        {PERIODS.map(p => (
          <button key={p} onClick={() => { setLoading(true); setPeriod(p); }}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${period === p ? 'btn-primary' : 'glass'}`}>
            {t(p)}
          </button>
        ))}
        <button onClick={() => { setLoading(true); load(); }} className="px-3 py-2 rounded-xl text-xs glass">
          <RefreshCw size={12} className="mr-1 inline" />{t('refresh')}
        </button>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--green-bg)' }}>
                  <Wallet size={15} style={{ color: 'var(--green)' }} />
                </div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t('cashIn')}</p>
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--green)' }}>{formatCurrency(summary.cashIn)}</p>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--red-bg)' }}>
                  <Wallet size={15} style={{ color: 'var(--red)' }} />
                </div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t('cashOut')}</p>
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--red)' }}>{formatCurrency(summary.cashOut)}</p>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: summary.netCashFlow >= 0 ? 'var(--green-bg)' : 'var(--red-bg)' }}>
                  <TrendingUp size={15} style={{ color: summary.netCashFlow >= 0 ? 'var(--green)' : 'var(--red)' }} />
                </div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t('netCashFlow')}</p>
              </div>
              <p className="text-lg font-bold" style={{ color: summary.netCashFlow >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {summary.netCashFlow >= 0 ? '+' : ''}{formatCurrency(summary.netCashFlow)}</p>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--green-bg)' }}>
                  <DollarSign size={15} style={{ color: 'var(--green)' }} />
                </div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t('transactions')}</p>
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{summary.salesCount + summary.expenseCount}</p>
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{t('breakdown')}</h3>
            <div className="space-y-3">
              {breakdownItems.map(([key, item]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{
                      background: ['sales', 'capital', 'adjustmentsIn'].includes(key) ? 'var(--green)' : 'var(--red)'
                    }} />
                    <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                  </div>
                  <span className="text-xs font-medium" style={{
                    color: ['sales', 'capital', 'adjustmentsIn'].includes(key) ? 'var(--green)' : 'var(--red)'
                  }}>
                    {['sales', 'capital', 'adjustmentsIn'].includes(key) ? '+' : '-'}{formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 mt-2 border-t-2" style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t('netCashFlow')}</span>
              <span className="text-sm font-bold" style={{ color: summary.netCashFlow >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {summary.netCashFlow >= 0 ? '+' : ''}{formatCurrency(summary.netCashFlow)}</span>
            </div>
          </div>
        </>
      )}

      <Modal open={adjustModal} onClose={() => setAdjustModal(false)} title={t('addAdjustment')}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('type')}</label>
            <div className="flex gap-2">
              <button onClick={() => setAdjForm({ ...adjForm, type: 'in' })}
                className={`flex-1 p-2.5 rounded-xl text-xs font-medium transition-all ${adjForm.type === 'in' ? 'btn-primary' : 'glass'}`}>
                {t('cashIn')}
              </button>
              <button onClick={() => setAdjForm({ ...adjForm, type: 'out' })}
                className={`flex-1 p-2.5 rounded-xl text-xs font-medium transition-all ${adjForm.type === 'out' ? 'btn-primary' : 'glass'}`}>
                {t('cashOut')}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('description')}</label>
            <input className="form-input" placeholder={t('descriptionPlaceholder')} value={adjForm.description}
              onChange={e => setAdjForm({ ...adjForm, description: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('amount')} *</label>
            <input className="form-input" type="number" min="1" placeholder="TZS 0" value={adjForm.amount}
              onChange={e => setAdjForm({ ...adjForm, amount: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('date')}</label>
            <input className="form-input" type="date" value={adjForm.date}
              onChange={e => setAdjForm({ ...adjForm, date: e.target.value })} />
          </div>
          <button onClick={handleAdjust} className="btn-primary w-full justify-center" disabled={saving}>
            {saving ? t('saving') : t('addAdjustment')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
