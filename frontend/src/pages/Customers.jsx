import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Users, Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState, EmptyState } from '../components/LoadingState';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';

const emptyForm = { name: '', phone: '', email: '', address: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get('/customers').then(r => setCustomers(r.data.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) return toast.error('Customer name is required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/customers/${editing.id}`, form);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', form);
        toast.success('Customer added');
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
    if (!window.confirm(`Delete customer "${name}"?`)) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} registered customers`}
        action={
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={15} /> Add Customer
          </button>
        }
      />

      <div className="glass p-4 mb-4">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="form-input pl-9" placeholder="Search by name, phone, email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="glass overflow-hidden">
        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No customers found" subtitle="Add your first customer to get started"
            action={<button className="btn-primary" onClick={openAdd}><Plus size={14} />Add Customer</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Member Since</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: `hsl(${(c.name?.charCodeAt(0) || 0) * 137 % 360}, 60%, 35%)` }}>
                          {c.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-slate-200 font-medium text-sm leading-none">{c.name}</p>
                          <p className="text-xs text-slate-600 mt-0.5 font-mono">{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {c.phone ? (
                        <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                          <Phone size={12} className="text-slate-600" /> {c.phone}
                        </div>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td>
                      {c.email ? (
                        <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                          <Mail size={12} className="text-slate-600" /> {c.email}
                        </div>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td>
                      {c.address ? (
                        <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                          <MapPin size={12} className="text-slate-600" /> {c.address}
                        </div>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="text-slate-500 text-xs">{formatDate(c.dateAdded)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-edit" onClick={() => openEdit(c)}><Edit2 size={12} /></button>
                        <button className="btn-danger" onClick={() => handleDelete(c.id, c.name)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Full Name *</label>
            <input className="form-input" placeholder="e.g. James Mollel" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Phone Number</label>
            <input className="form-input" placeholder="+255 7XX XXX XXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email Address</label>
            <input className="form-input" type="email" placeholder="name@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Address</label>
            <input className="form-input" placeholder="Street, City" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-1">
            <button className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Add Customer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
