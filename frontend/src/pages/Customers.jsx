import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Users, Phone, Mail, MapPin, MessageCircle, Download, Eye, ShoppingCart, Star, CreditCard, DollarSign, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState, EmptyState } from '../components/LoadingState';
import api from '../utils/api';
import { formatCurrency, exportToCSV, formatDate } from '../utils/helpers';

const emptyForm = { name: '', phone: '', email: '', address: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      api.get('/customers'),
      api.get('/sales'),
    ]).then(([c, s]) => {
      setCustomers(c.data.data);
      setSales(s.data.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  const getLastPurchase = (customerId) => {
    const customerSales = sales.filter(s => s.customerId === customerId || s.customerName === customerId);
    if (customerSales.length === 0) return null;
    return customerSales.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  };

  const getTotalSpent = (customerId) => {
    return sales.filter(s => s.customerId === customerId || s.customerName === customerId)
      .reduce((sum, s) => sum + Number(s.total || 0), 0);
  };

  const getStatus = (customerId) => {
    const lastSale = getLastPurchase(customerId);
    if (!lastSale) return { label: 'Inactive', color: 'bg-slate-500/20 text-slate-400' };
    const daysSince = Math.floor((Date.now() - new Date(lastSale.date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 30) return { label: 'Active', color: 'bg-emerald-500/20 text-emerald-400' };
    if (daysSince <= 90) return { label: 'At Risk', color: 'bg-yellow-500/20 text-yellow-400' };
    return { label: 'Inactive', color: 'bg-slate-500/20 text-slate-400' };
  };

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
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"?`)) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted');
      load();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <LoadingState message="Loading customers..." />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Customers" subtitle={`${customers.length} registered customers`} action={
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(customers.map(c => ({
            ...c,
            totalSpent: getTotalSpent(c.id),
            lastPurchase: getLastPurchase(c.id)?.date || '',
            status: getStatus(c.id).label
          })), 'customers-export', [
            { label: 'Name', key: 'name' },
            { label: 'Phone', key: 'phone' },
            { label: 'Email', key: 'email' },
            { label: 'Address', key: 'address' },
            { label: 'Total Spent', key: 'totalSpent' },
            { label: 'Last Purchase', key: 'lastPurchase' },
            { label: 'Status', key: 'status' },
          ])} className="btn-ghost text-sm"><Download size={14} className="mr-1.5" />Export</button>
          <button onClick={openAdd} className="btn-primary text-sm"><Plus size={15} className="mr-1.5" />Add Customer</button>
        </div>
      } />

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="form-input pl-9" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Customer Cards */}
      {filtered.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <Users size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No customers found</p>
          <p className="text-slate-500 text-sm mt-1">Add your first customer to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(c => {
            const lastSale = getLastPurchase(c.id);
            const totalSpent = getTotalSpent(c.id);
            const status = getStatus(c.id);
            const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={c.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/50 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{c.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-1 ${status.color}`}>{status.label}</span>
                    </div>
                  </div>
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
                    <Edit2 size={14} />
                  </button>
                </div>

                <div className="space-y-1.5 mb-3">
                  {c.phone && <p className="text-xs text-slate-400 flex items-center gap-1.5"><Phone size={11} />{c.phone}</p>}
                  {c.email && <p className="text-xs text-slate-400 flex items-center gap-1.5"><Mail size={11} />{c.email}</p>}
                  {lastSale && <p className="text-xs text-slate-500">Last purchase: {lastSale.date}</p>}
                  {totalSpent > 0 && <p className="text-xs font-medium text-emerald-400">TZS {totalSpent.toLocaleString()}</p>}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { setSelected(c); setProfileOpen(true); }} className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-xl bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors text-xs font-medium">
                    <Eye size={12} />Profile
                  </button>
                  {c.phone && (
                    <>
                      <a href={`tel:${c.phone}`} className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs font-medium">
                        <Phone size={12} />Call
                      </a>
                      <a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-xs font-medium">
                        <MessageCircle size={12} />WhatsApp
                      </a>
                    </>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => openEdit(c)} className="flex-1 p-2 rounded-xl bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 transition-colors text-xs font-medium">
                    <Edit2 size={12} className="mr-1 inline" />Edit
                  </button>
                  <button onClick={() => handleDelete(c.id, c.name)} className="flex-1 p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-medium">
                    <Trash2 size={12} className="mr-1 inline" />Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer 360° Profile */}
      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="" size="lg">
        {selected && (() => {
          const c = selected;
          const cSales = sales.filter(s => s.customerName === c.name || s.customerId === c.id);
          const totalSpent = cSales.reduce((s, sale) => s + Number(sale.total || 0), 0);
          const totalProfit = cSales.reduce((s, sale) => s + Number(sale.profit || 0), 0);
          const totalVisits = cSales.length;
          const outstandingBalance = cSales.reduce((s, sale) => s + Number(sale.balance || 0), 0);
          const lastSale = cSales.length > 0 ? cSales.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
          const status = getStatus(c.id);
          const daysSinceLast = lastSale ? Math.floor((Date.now() - new Date(lastSale.date).getTime()) / (1000 * 60 * 60 * 24)) : null;

          // Favorite products - count by product name
          const prodCount = {};
          cSales.forEach(s => { prodCount[s.productName] = (prodCount[s.productName] || 0) + 1; });
          const favorites = Object.entries(prodCount).sort((a, b) => b[1] - a[1]).slice(0, 3);

          // Recent purchases
          const recentPurchases = [...cSales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

          return (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-white">{c.name}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-1 ${status.color}`}>{status.label}</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {c.phone && <a href={`tel:${c.phone}`} className="btn-ghost text-xs px-2 py-1"><Phone size={11} className="mr-1" />{c.phone}</a>}
                    {c.phone && <a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs px-2 py-1"><MessageCircle size={11} className="mr-1" />WhatsApp</a>}
                  </div>
                  {c.email && <p className="text-xs text-slate-500 mt-1"><Mail size={11} className="mr-1 inline" />{c.email}</p>}
                  {c.address && <p className="text-xs text-slate-500 mt-0.5"><MapPin size={11} className="mr-1 inline" />{c.address}</p>}
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                  <DollarSign size={16} className="mx-auto mb-1 text-emerald-400" />
                  <p className="text-xs text-slate-500">Total Spent</p>
                  <p className="text-lg font-bold text-white mt-0.5">{formatCurrency(totalSpent)}</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                  <ShoppingCart size={16} className="mx-auto mb-1 text-blue-400" />
                  <p className="text-xs text-slate-500">Visits</p>
                  <p className="text-lg font-bold text-white mt-0.5">{totalVisits}</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
                  <TrendingUp size={16} className="mx-auto mb-1 text-purple-400" />
                  <p className="text-xs text-slate-500">Avg per Visit</p>
                  <p className="text-lg font-bold text-white mt-0.5">{totalVisits > 0 ? formatCurrency(Math.round(totalSpent / totalVisits)) : '—'}</p>
                </div>
                <div className={outstandingBalance > 0 ? 'bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center' : 'bg-slate-500/10 border border-slate-500/20 rounded-xl p-4 text-center'}>
                  <CreditCard size={16} className={`mx-auto mb-1 ${outstandingBalance > 0 ? 'text-red-400' : 'text-slate-400'}`} />
                  <p className="text-xs text-slate-500">Balance Due</p>
                  <p className={`text-lg font-bold mt-0.5 ${outstandingBalance > 0 ? 'text-red-400' : 'text-white'}`}>{outstandingBalance > 0 ? formatCurrency(outstandingBalance) : '—'}</p>
                </div>
              </div>

              {/* Additional stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Last Purchase</p>
                  <p className="text-sm font-semibold text-white mt-1">{lastSale ? `${lastSale.date} · ${formatCurrency(lastSale.total)}` : 'No purchases'}</p>
                  {daysSinceLast !== null && <p className="text-xs text-slate-500 mt-0.5">{daysSinceLast} days ago</p>}
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Profit Generated</p>
                  <p className="text-sm font-semibold text-emerald-400 mt-1">{formatCurrency(totalProfit)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Customer Since</p>
                  <p className="text-sm font-semibold text-white mt-1">{c.dateAdded || 'N/A'}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Lifetime Value Score</p>
                  <p className={`text-sm font-semibold mt-1 ${totalSpent >= 500000 ? 'text-emerald-400' : totalSpent >= 100000 ? 'text-yellow-400' : 'text-slate-400'}`}>
                    {totalSpent >= 500000 ? '⭐ High Value' : totalSpent >= 100000 ? '📈 Growing' : '🆕 New'}
                  </p>
                </div>
              </div>

              {/* Favorite Products */}
              {favorites.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5"><Star size={14} className="text-yellow-400" />Favorite Products</h4>
                  <div className="flex flex-wrap gap-2">
                    {favorites.map(([name, count], i) => (
                      <span key={name} className="text-xs px-3 py-1.5 rounded-full bg-slate-700/50 text-slate-300">
                        {i === 0 && '🥇'} {i === 1 && '🥈'} {i === 2 && '🥉'} {name} ({count}x)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Purchases */}
              {recentPurchases.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Recent Purchases</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-700">
                          <th className="text-left py-2 pr-2 font-medium text-xs">Date</th>
                          <th className="text-left py-2 px-2 font-medium text-xs">Product</th>
                          <th className="text-center py-2 px-2 font-medium text-xs">Qty</th>
                          <th className="text-right py-2 pl-2 font-medium text-xs">Total</th>
                          <th className="text-center py-2 pl-2 font-medium text-xs">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentPurchases.map(s => (
                          <tr key={s.id} className="border-b border-slate-700/30">
                            <td className="py-2 pr-2 text-slate-400 text-xs">{s.date}</td>
                            <td className="py-2 px-2 text-white text-xs">{s.productName}</td>
                            <td className="py-2 px-2 text-center text-slate-400 text-xs">{s.quantity}</td>
                            <td className="py-2 pl-2 text-right text-emerald-400 text-xs font-medium">{formatCurrency(s.total)}</td>
                            <td className="py-2 pl-2 text-center">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${s.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : s.paymentStatus === 'partial' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                {s.paymentStatus === 'paid' ? 'Paid' : s.balance > 0 ? `Due ${formatCurrency(s.balance)}` : 'Debt'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Name *</label>
            <input className="form-input" placeholder="Customer name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Phone</label>
            <input className="form-input" placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Email</label>
            <input className="form-input" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Address</label>
            <input className="form-input" placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <button onClick={handleSave} className="btn-primary w-full justify-center" disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Update Customer' : 'Add Customer'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
