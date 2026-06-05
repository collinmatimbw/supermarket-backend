import React, { useEffect, useState } from 'react';
import { Search, Package, Plus, X, Minus, AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';

const REASONS = ['return', 'damage', 'theft', 'count', 'expiry', 'other'];
const REASON_COLORS = {
  sale: 'rgba(110,231,183,0.12)', purchase: 'rgba(96,165,250,0.12)',
  return: 'rgba(110,231,183,0.12)', damage: 'rgba(248,113,113,0.12)',
  theft: 'rgba(248,113,113,0.12)', count: 'rgba(251,191,36,0.12)',
  expiry: 'rgba(248,113,113,0.12)', other: 'rgba(100,116,139,0.12)',
};

export default function InventoryHistory() {
  const { t } = useLanguage();
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ productName: '', productId: '', newQuantity: 1, reason: 'count', notes: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);

  const load = async () => {
    try {
      const [adjRes, prodRes] = await Promise.all([api.get('/stock-adjustments'), api.get('/products')]);
      setAdjustments(adjRes.data.data);
      setProducts(prodRes.data.data);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = adjustments.filter(a =>
    a.productName.toLowerCase().includes(search.toLowerCase()) ||
    a.reason.toLowerCase().includes(search.toLowerCase())
  );

  const handleProductSelect = (e) => {
    const name = e.target.value;
    const prod = products.find(p => p.name === name);
    setForm({ ...form, productName: name, productId: prod?.id || '', newQuantity: prod ? prod.quantity : 0 });
    setSelectedProduct(prod);
  };

  const handleSave = async () => {
    if (!form.productName) return toast.error(t('selectProduct'));
    if (form.newQuantity < 0) return toast.error(t('quantityPositive'));
    setSaving(true);
    try {
      await api.post('/stock-adjustments', form);
      toast.success(t('adjustmentSaved'));
      setModalOpen(false);
      setForm({ productName: '', productId: '', newQuantity: 1, reason: 'count', notes: '' });
      setSelectedProduct(null);
      load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  if (loading) return <LoadingState message={t('loading')} />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={t('inventoryHistory')} subtitle={`${adjustments.length} ${t('adjustments')}`} action={
        <button onClick={() => setModalOpen(true)} className="btn-primary text-sm"><Plus size={15} className="mr-1.5" />{t('adjustStock')}</button>
      } />

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input className="form-input pl-9" placeholder={t('searchAdjustments')} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Package size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('noAdjustments')}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t('firstAdjustment')}</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('date')}</th>
                  <th className="text-left py-3 px-4 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('product')}</th>
                  <th className="text-center py-3 px-4 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('reason')}</th>
                  <th className="text-center py-3 px-4 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('previous')}</th>
                  <th className="text-center py-3 px-4 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('new')}</th>
                  <th className="text-center py-3 px-4 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('change')}</th>
                  <th className="text-right py-3 px-4 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-muted)' }}>{a.date}</td>
                    <td className="py-3 px-4 text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{a.productName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: REASON_COLORS[a.reason] || REASON_COLORS.other, color: a.change > 0 ? 'var(--green)' : 'var(--red)' }}>
                        {a.reason}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{a.previousQuantity}</td>
                    <td className="py-3 px-4 text-center text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{a.newQuantity}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs font-medium flex items-center justify-center gap-0.5`}
                        style={{ color: a.change > 0 ? 'var(--green)' : a.change < 0 ? 'var(--red)' : 'var(--text-muted)' }}>
                        {a.change > 0 ? <Plus size={10} /> : a.change < 0 ? <Minus size={10} /> : null}
                        {Math.abs(a.change)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {a.notes && <span className="text-xs" style={{ color: 'var(--text-muted)' }} title={a.notes}>*</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('adjustStock')}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('product')} *</label>
            <input className="form-input" list="product-list" placeholder={t('selectProduct')}
              value={form.productName} onChange={handleProductSelect} />
            <datalist id="product-list">
              {products.map(p => <option key={p.id} value={p.name} />)}
            </datalist>
            {selectedProduct && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {t('currentStock')}: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedProduct.quantity}</span>
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('reason')}</label>
            <div className="flex flex-wrap gap-2">
              {REASONS.map(r => (
                <button key={r} onClick={() => setForm({ ...form, reason: r })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${form.reason === r ? 'btn-primary' : 'glass'}`}>
                  {t(r)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('newQuantity')} *</label>
            <input className="form-input" type="number" min="0" value={form.newQuantity}
              onChange={e => setForm({ ...form, newQuantity: Number(e.target.value) })} />
            {selectedProduct && form.newQuantity !== selectedProduct.quantity && (
              <div className="flex items-center gap-1 mt-1">
                {form.newQuantity > selectedProduct.quantity ? (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--green)' }}>
                    <Plus size={10} />{form.newQuantity - selectedProduct.quantity} {t('increase')}
                  </span>
                ) : (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--red)' }}>
                    <Minus size={10} />{selectedProduct.quantity - form.newQuantity} {t('decrease')}
                  </span>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('notes')}</label>
            <textarea className="form-input" rows={2} placeholder={t('notesPlaceholder')} value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button onClick={handleSave} className="btn-primary w-full justify-center" disabled={saving}>
            {saving ? t('saving') : t('saveAdjustment')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
