import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Truck, Phone, Mail, MapPin, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';

const emptyForm = { name: '', phone: '', email: '', address: '', product: '' };

export default function Suppliers() {
  const { t } = useLanguage();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/suppliers');
      setSuppliers(data.data);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search) ||
    s.product.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };

  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, phone: s.phone, email: s.email, address: s.address, product: s.product }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error(t('supplierNameRequired'));
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/suppliers/${editing.id}`, form);
        toast.success(t('supplierUpdated'));
      } else {
        await api.post('/suppliers', form);
        toast.success(t('supplierAdded'));
      }
      setModalOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`${t('deleteSupplier')} "${name}"?`)) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success(t('supplierDeleted'));
      load();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <LoadingState message={t('loadingSuppliers')} />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={t('suppliers')} subtitle={`${suppliers.length} ${t('registered')}`} action={
        <button onClick={openAdd} className="btn-primary text-sm"><Plus size={15} className="mr-1.5" />{t('addSupplier')}</button>
      } />

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input className="form-input pl-9" placeholder={t('searchSuppliers')} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Truck size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('noSuppliersFound')}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t('addFirstSupplier')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(s => (
            <div key={s.id} className="glass rounded-2xl p-5 hover-border transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
                    <Truck size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                    {s.product && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('product')}: {s.product}</p>}
                  </div>
                </div>
                <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
                  <Edit2 size={14} />
                </button>
              </div>

              <div className="space-y-1.5 mb-3">
                {s.phone && <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}><Phone size={11} />{s.phone}</p>}
                {s.email && <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}><Mail size={11} />{s.email}</p>}
                {s.address && <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}><MapPin size={11} />{s.address}</p>}
                {s.dateAdded && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('added')}: {s.dateAdded}</p>}
              </div>

              <div className="flex gap-2">
                {s.phone && (
                  <a href={`tel:${s.phone}`} className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-medium transition-colors"
                    style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
                    <Phone size={12} />{t('call')}
                  </a>
                )}
                <button onClick={() => handleDelete(s.id, s.name)} className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-medium transition-colors"
                  style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
                  <Trash2 size={12} />{t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('editSupplier') : t('addSupplier')}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('supplierName')} *</label>
            <input className="form-input" placeholder={t('supplierName')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('phone')}</label>
            <input className="form-input" placeholder={t('phonePlaceholder')} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('email')}</label>
            <input className="form-input" placeholder={t('emailPlaceholder')} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('address')}</label>
            <input className="form-input" placeholder={t('address')} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>{t('productSupplied')}</label>
            <input className="form-input" placeholder={t('productSupplied')} value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} />
          </div>
          <button onClick={handleSave} className="btn-primary w-full justify-center" disabled={saving}>
            {saving ? t('saving') : editing ? t('editSupplier') : t('addSupplier')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
