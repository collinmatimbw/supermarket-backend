import React, { useEffect, useState } from 'react';
import { Plus, Search, Package, Calendar, ChevronDown, X, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';

const STATUS_COLORS = {
  pending: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24' },
  partial: { bg: 'rgba(96,165,250,0.12)', text: '#60a5fa' },
  received: { bg: 'rgba(110,231,183,0.12)', text: '#6ee7b7' },
  cancelled: { bg: 'rgba(248,113,113,0.12)', text: '#f87171' },
};

const emptyItem = { productName: '', quantity: 1, unitPrice: 0 };

export default function PurchaseOrders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ supplierName: '', expectedDate: '', notes: '', items: [{ ...emptyItem }] });
  const [detailOrder, setDetailOrder] = useState(null);

  const load = async () => {
    try {
      const [ordRes, prodRes] = await Promise.all([api.get('/purchase-orders'), api.get('/products')]);
      setOrders(ordRes.data.data);
      setProducts(prodRes.data.data);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter(o =>
    o.supplierName.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.items?.some(i => i.productName.toLowerCase().includes(search.toLowerCase()))
  );

  const addItem = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });

  const removeItem = (idx) => {
    if (form.items.length <= 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };

  const totalOrder = form.items.reduce((s, i) => s + (i.unitPrice || 0) * (i.quantity || 0), 0);

  const handleCreate = async () => {
    const valid = form.items.filter(i => i.productName.trim());
    if (valid.length === 0) return toast.error(t('atLeastOneItem'));
    setSaving(true);
    try {
      await api.post('/purchase-orders', { ...form, items: valid });
      toast.success(t('poCreated'));
      setModalOpen(false);
      setForm({ supplierName: '', expectedDate: '', notes: '', items: [{ ...emptyItem }] });
      load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const markReceived = async (order) => {
    try {
      await api.put(`/purchase-orders/${order.id}`, { status: 'received' });
      toast.success(t('poReceived'));
      load();
    } catch (e) { toast.error(e.message); }
  };

  const cancelOrder = async (order) => {
    if (!window.confirm(`${t('cancelPo')} "${order.id}"?`)) return;
    try {
      await api.put(`/purchase-orders/${order.id}`, { status: 'cancelled' });
      toast.success(t('poCancelled'));
      load();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <LoadingState message={t('loadingOrders')} />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={t('purchaseOrders')} subtitle={`${orders.length} ${t('orders')}`} action={
        <button onClick={() => setModalOpen(true)} className="btn-primary text-sm"><Plus size={15} className="mr-1.5" />{t('newOrder')}</button>
      } />

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input className="form-input pl-9" placeholder={t('searchOrders')} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Package size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('noOrders')}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t('createFirstOrder')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => {
            const sc = STATUS_COLORS[o.status] || STATUS_COLORS.pending;
            return (
              <div key={o.id} className="glass rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{o.id}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: sc.bg, color: sc.text }}>{o.status}</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{o.supplierName || t('noSupplier')} &middot; {o.orderDate}</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: 'var(--green)' }}>{formatCurrency(o.totalAmount)}</p>
                </div>

                {o.items && (
                  <div className="mb-3 space-y-1">
                    {o.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>{item.productName} x{item.quantity}</span>
                        <span>{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                    {o.items.length > 3 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>+{o.items.length - 3} {t('moreItems')}</p>}
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setDetailOrder(o)} className="flex-1 p-2 rounded-xl text-xs font-medium transition-colors"
                    style={{ background: 'rgba(100,116,139,0.08)', color: 'var(--text-primary)' }}>{t('viewDetails')}</button>
                  {o.status === 'pending' && (
                    <>
                      <button onClick={() => markReceived(o)} className="flex-1 p-2 rounded-xl text-xs font-medium transition-colors"
                        style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>{t('markReceived')}</button>
                      <button onClick={() => cancelOrder(o)} className="flex-1 p-2 rounded-xl text-xs font-medium transition-colors"
                        style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>{t('cancel')}</button>
                    </>
                  )}
                  {o.status === 'partial' && (
                    <button onClick={() => markReceived(o)} className="flex-1 p-2 rounded-xl text-xs font-medium transition-colors"
                      style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>{t('markReceived')}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!detailOrder} onClose={() => setDetailOrder(null)} title={t('orderDetails')} size="lg">
        {detailOrder && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{detailOrder.id}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{detailOrder.supplierName || t('noSupplier')}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: STATUS_COLORS[detailOrder.status]?.bg, color: STATUS_COLORS[detailOrder.status]?.text }}>{detailOrder.status}</span>
            </div>
            <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>{t('ordered')}: {detailOrder.orderDate}</span>
              {detailOrder.expectedDate && <span>{t('expected')}: {detailOrder.expectedDate}</span>}
              {detailOrder.receivedDate && <span>{t('received')}: {detailOrder.receivedDate}</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <th className="text-left py-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('product')}</th>
                    <th className="text-center py-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('qty')}</th>
                    <th className="text-right py-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('unitPrice')}</th>
                    <th className="text-right py-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {detailOrder.items.map((item, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-2 text-xs" style={{ color: 'var(--text-primary)' }}>{item.productName}</td>
                      <td className="py-2 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{item.quantity}</td>
                      <td className="py-2 text-right text-xs" style={{ color: 'var(--text-muted)' }}>{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2 text-right text-xs font-medium" style={{ color: 'var(--green)' }}>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center pt-2">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('totalAmount')}</p>
              <p className="text-lg font-bold" style={{ color: 'var(--green)' }}>{formatCurrency(detailOrder.totalAmount)}</p>
            </div>
            {detailOrder.notes && (
              <div className="p-3 rounded-xl" style={{ background: 'rgba(100,116,139,0.08)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{t('notes')}</p>
                <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{detailOrder.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('newOrder')} size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('supplierName')}</label>
            <input className="form-input" placeholder={t('supplierName')} value={form.supplierName}
              onChange={e => setForm({ ...form, supplierName: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('expectedDate')}</label>
            <input className="form-input" type="date" value={form.expectedDate}
              onChange={e => setForm({ ...form, expectedDate: e.target.value })} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{t('items')}</label>
              <button onClick={addItem} className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--green)' }}>
                <Plus size={12} />{t('addItem')}
              </button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input className="form-input text-xs" list="product-list" placeholder={t('productName')}
                      value={item.productName} onChange={e => updateItem(idx, 'productName', e.target.value)} />
                  </div>
                  <input className="form-input text-xs w-16 text-center" type="number" min="1" placeholder={t('qty')}
                    value={item.quantity} onChange={e => updateItem(idx, 'quantity', Math.max(1, Number(e.target.value)))} />
                  <input className="form-input text-xs w-24 text-right" type="number" min="0" placeholder={t('unitPrice')}
                    value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} />
                  <p className="text-xs font-medium pt-2.5 w-20 text-right" style={{ color: 'var(--green)' }}>
                    {formatCurrency((item.unitPrice || 0) * (item.quantity || 0))}</p>
                  <button onClick={() => removeItem(idx)} className="pt-2.5" style={{ color: 'var(--red)' }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <datalist id="product-list">
              {products.map(p => <option key={p.id} value={p.name} />)}
            </datalist>
          </div>

          <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{t('totalAmount')}</span>
            <span className="text-base font-bold" style={{ color: 'var(--green)' }}>{formatCurrency(totalOrder)}</span>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('notes')}</label>
            <textarea className="form-input" rows={2} placeholder={t('notesPlaceholder')} value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>

          <button onClick={handleCreate} className="btn-primary w-full justify-center" disabled={saving}>
            {saving ? t('saving') : t('createOrder')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
