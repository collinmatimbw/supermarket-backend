import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState, EmptyState } from '../components/LoadingState';
import api from '../utils/api';
import { formatCurrency, formatDate, isLowStock, CATEGORIES } from '../utils/helpers';

const emptyForm = { name: '', category: 'Grains', buyingPrice: '', sellingPrice: '', quantity: '', barcode: '', supplier: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get('/products').then(r => setProducts(r.data.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(search.toLowerCase()) || p.supplier?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, category: p.category, buyingPrice: p.buyingPrice, sellingPrice: p.sellingPrice, quantity: p.quantity, barcode: p.barcode, supplier: p.supplier });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category) return toast.error('Name and category required');
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
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const lowCount = products.filter(p => isLowStock(p.quantity)).length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Products"
        subtitle={`${products.length} total${lowCount > 0 ? ` · ${lowCount} low stock` : ''}`}
        action={
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={15} /> Add Product
          </button>
        }
      />

      {/* Filters */}
      <div className="glass p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="form-input pl-9" placeholder="Search products, barcode, supplier..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={13} className="text-slate-500" />
          {CATEGORIES.map(cat => (
            <button key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === cat
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 border border-white/6 hover:border-white/12'
              }`}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState icon={Package} title="No products found" subtitle="Try adjusting your search or add a new product" action={<button className="btn-primary" onClick={openAdd}><Plus size={14} />Add Product</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Buy Price</th>
                  <th>Sell Price</th>
                  <th>Stock</th>
                  <th>Barcode</th>
                  <th>Supplier</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div>
                        <p className="text-slate-200 font-medium text-sm leading-none">{p.name}</p>
                        <p className="text-xs text-slate-600 mt-0.5 font-mono">{p.id}</p>
                      </div>
                    </td>
                    <td><span className="badge badge-purple">{p.category}</span></td>
                    <td className="text-slate-400 font-mono text-xs">{formatCurrency(p.buyingPrice)}</td>
                    <td className="text-emerald-400 font-semibold font-mono text-xs">{formatCurrency(p.sellingPrice)}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {isLowStock(p.quantity) && <AlertTriangle size={12} className="text-amber-400" />}
                        <span className={`badge ${Number(p.quantity) === 0 ? 'badge-red' : isLowStock(p.quantity) ? 'badge-yellow' : 'badge-green'}`}>
                          {p.quantity} units
                        </span>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-slate-500">{p.barcode || '—'}</td>
                    <td className="text-slate-400 text-sm">{p.supplier || '—'}</td>
                    <td className="text-slate-500 text-xs">{formatDate(p.dateAdded)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-edit" onClick={() => openEdit(p)}><Edit2 size={12} /></button>
                        <button className="btn-danger" onClick={() => handleDelete(p.id, p.name)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add New Product'}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Product Name *</label>
            <input className="form-input" placeholder="e.g. White Rice (5kg)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Category *</label>
            <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Quantity</label>
            <input className="form-input" type="number" min="0" placeholder="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Buying Price (TZS)</label>
            <input className="form-input" type="number" min="0" placeholder="0" value={form.buyingPrice} onChange={e => setForm({ ...form, buyingPrice: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Selling Price (TZS)</label>
            <input className="form-input" type="number" min="0" placeholder="0" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Barcode</label>
            <input className="form-input" placeholder="e.g. BC001" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Supplier</label>
            <input className="form-input" placeholder="Supplier name" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
          </div>
        </div>

        {/* Profit preview */}
        {form.buyingPrice && form.sellingPrice && (
          <div className="mt-4 p-3 rounded-xl flex gap-4 text-sm" style={{ background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.12)' }}>
            <div>
              <span className="text-slate-500 text-xs">Margin</span>
              <p className="text-emerald-400 font-bold">{formatCurrency(Number(form.sellingPrice) - Number(form.buyingPrice))}</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs">Markup</span>
              <p className="text-sky-400 font-bold">
                {form.buyingPrice > 0 ? (((form.sellingPrice - form.buyingPrice) / form.buyingPrice) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
