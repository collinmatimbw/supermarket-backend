import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, Calendar, Tag, Warehouse, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState, EmptyState } from '../components/LoadingState';
import api from '../utils/api';
import { formatCurrency, isLowStock, exportToCSV } from '../utils/helpers';

const emptyForm = { name: '', category: '', quantity: 0, price: 0, costPrice: 0, unit: '', expiryDate: '', batch: '', warehouse: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get('/products').then(r => setProducts(r.data.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())
  );
  const lowStockItems = products.filter(p => isLowStock(p.quantity));

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, category: p.category || '', quantity: p.quantity || 0, price: p.price || 0, costPrice: p.costPrice || 0, unit: p.unit || '', expiryDate: p.expiryDate || '', batch: p.batch || '', warehouse: p.warehouse || '' }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) return toast.error('Product name is required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form);
        toast.success('Product updated');
      } else {
        await api.post('/products', form);
        toast.success('Product added');
      }
      setModalOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    const removeOnly = window.confirm(`Remove "${name}" from view?\n\nOK = Remove from web only\nCancel = Permanently delete`);
    if (removeOnly) {
      try { await api.delete(`/products/${id}`); toast.success('Removed'); load(); } catch (e) { toast.error(e.message); }
      return;
    }
    const confirmPerm = window.confirm(`Permanently delete "${name}"?`);
    if (confirmPerm) {
      try { await api.delete(`/products/${id}?permanent=true`); toast.success('Deleted'); load(); } catch (e) { toast.error(e.message); }
    }
  };

  if (loading) return <LoadingState message="Loading products..." />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Products" subtitle={`${products.length} products · ${lowStockItems.length} low stock`} action={
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(products, 'products-export', [
            { label: 'Name', key: 'name' },
            { label: 'Category', key: 'category' },
            { label: 'Sell Price', key: 'price' },
            { label: 'Cost Price', key: 'costPrice' },
            { label: 'Stock', key: 'quantity' },
            { label: 'Unit', key: 'unit' },
            { label: 'Expiry', key: 'expiryDate' },
            { label: 'Batch', key: 'batch' },
            { label: 'Warehouse', key: 'warehouse' },
          ])} className="btn-ghost text-sm"><Download size={14} className="mr-1.5" />Export</button>
          <button onClick={openAdd} className="btn-primary text-sm"><Plus size={15} className="mr-1.5" />Add Product</button>
        </div>
      } />

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-400">{lowStockItems.length} product{lowStockItems.length > 1 ? 's' : ''} low on stock</p>
            <p className="text-xs text-red-400/70">{lowStockItems.map(p => p.name).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="form-input pl-9" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <Package size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(p => {
            const profit = (p.price || 0) - (p.costPrice || 0);
            const profitMargin = p.price > 0 ? ((profit / p.price) * 100).toFixed(0) : 0;
            const low = isLowStock(p.quantity);
            return (
              <div key={p.id} className={`rounded-2xl p-5 transition-all ${low ? 'bg-red-900/10 border border-red-500/20' : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                    {p.category && <p className="text-xs text-slate-500 mt-0.5">{p.category}</p>}
                  </div>
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors ml-2">
                    <Edit2 size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="text-xs text-slate-500">Sell Price</p>
                    <p className="text-sm font-semibold text-white">{formatCurrency(p.price)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Cost Price</p>
                    <p className="text-sm text-slate-300">{formatCurrency(p.costPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Profit/Item</p>
                    <p className={`text-sm font-semibold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(profit)} <span className="text-xs ml-0.5">({profitMargin}%)</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Stock</p>
                    <p className={`text-sm font-semibold ${low ? 'text-red-400' : 'text-white'}`}>
                      {p.quantity} {p.unit || 'units'}
                    </p>
                  </div>
                </div>

                {(p.batch || p.expiryDate || p.warehouse) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {p.batch && <span className="text-xs flex items-center gap-1 bg-slate-500/10 text-slate-300 px-2 py-1 rounded-lg"><Tag size={10} />{p.batch}</span>}
                    {p.expiryDate && <span className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg ${new Date(p.expiryDate) < new Date() ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-300'}`}><Calendar size={10} />{new Date(p.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                    {p.warehouse && <span className="text-xs flex items-center gap-1 bg-slate-500/10 text-slate-300 px-2 py-1 rounded-lg"><Warehouse size={10} />{p.warehouse}</span>}
                  </div>
                )}

                <button onClick={() => handleDelete(p.id, p.name)} className="w-full p-2 rounded-xl bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors text-xs font-medium">
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Name *</label>
              <input className="form-input" placeholder="Product name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Category</label>
              <input className="form-input" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Unit</label>
              <input className="form-input" placeholder="pcs, kg, ltr" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Cost Price (TZS)</label>
              <input className="form-input" type="number" min={0} placeholder="0" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Sell Price (TZS)</label>
              <input className="form-input" type="number" min={0} placeholder="0" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Quantity in Stock</label>
              <input className="form-input" type="number" min={0} placeholder="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Expiry Date</label>
              <input className="form-input" type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Batch Number</label>
              <input className="form-input" placeholder="e.g. BATCH-001" value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Warehouse / Location</label>
              <input className="form-input" placeholder="e.g. Main Store, Branch A" value={form.warehouse} onChange={e => setForm({ ...form, warehouse: e.target.value })} />
            </div>
          </div>
          <button onClick={handleSave} className="btn-primary w-full justify-center" disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
