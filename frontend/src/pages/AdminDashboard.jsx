import React, { useEffect, useState, useCallback } from 'react';
import { Users, DollarSign, Calendar, Eye, EyeOff, Shield, RefreshCw, Key, CreditCard, TrendingUp, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [editingBilling, setEditingBilling] = useState(null);
  const [billingForm, setBillingForm] = useState({ startDate: '', lastPaymentDate: '', nextDueDate: '', amountPaid: '', subscriptionStatus: 'trial' });
  const [resettingPass, setResettingPass] = useState(null);
  const [newPass, setNewPass] = useState('');
  const [globalStartDate, setGlobalStartDate] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.data);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const togglePassword = (email) => {
    setRevealedPasswords(prev => ({ ...prev, [email]: !prev[email] }));
  };

  const openBilling = (user) => {
    setEditingBilling(user.email);
    setBillingForm({
      startDate: user.startDate || '',
      lastPaymentDate: user.lastPaymentDate || '',
      nextDueDate: user.nextDueDate || '',
      amountPaid: user.amountPaid?.toString() || '0',
      subscriptionStatus: user.subscriptionStatus || 'trial',
    });
  };

  const saveBilling = async () => {
    try {
      await api.put(`/users/${editingBilling}/billing`, {
        ...billingForm,
        amountPaid: Number(billingForm.amountPaid),
      });
      toast.success('Billing updated');
      setEditingBilling(null);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const handleResetPassword = async (email) => {
    if (!newPass || newPass.length < 4) return toast.error('Password must be at least 4 characters');
    try {
      await api.put(`/users/${email}/reset-password`, { newPassword: newPass });
      toast.success('Password reset');
      setResettingPass(null);
      setNewPass('');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const applyGlobalStartDate = async () => {
    if (!globalStartDate) return toast.error('Select a date');
    try {
      for (const user of users) {
        if (user.role !== 'admin') {
          const due = new Date(globalStartDate);
          due.setDate(due.getDate() + 30);
          await api.put(`/users/${user.email}/billing`, {
            startDate: globalStartDate,
            lastPaymentDate: globalStartDate,
            nextDueDate: due.toISOString().split('T')[0],
            subscriptionStatus: 'active',
          });
        }
      }
      toast.success('Billing start date applied to all users');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const totalRevenue = users.reduce((s, u) => s + (u.amountPaid || 0), 0);
  const activeSubscribers = users.filter(u => u.subscriptionStatus === 'active').length;
  const overdueUsers = users.filter(u => u.nextDueDate && new Date(u.nextDueDate) < new Date() && u.subscriptionStatus === 'active');

  if (loading) return <LoadingState message={t('loading')} />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Admin Dashboard" subtitle={`${users.length} registered users · ${activeSubscribers} active`} />

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--green-bg)' }}>
              <DollarSign size={15} style={{ color: 'var(--green)' }} />
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total Revenue</p>
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--green-bg)' }}>
              <Users size={15} style={{ color: 'var(--green)' }} />
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Active Users</p>
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{activeSubscribers} / {users.length}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--red-bg)' }}>
              <Clock size={15} style={{ color: 'var(--red)' }} />
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Overdue</p>
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--red)' }}>{overdueUsers.length}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--green-bg)' }}>
              <TrendingUp size={15} style={{ color: 'var(--green)' }} />
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Avg/User</p>
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{users.length > 0 ? formatCurrency(Math.round(totalRevenue / users.length)) : '—'}</p>
        </div>
      </div>

      {/* Global Start Date */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Set Billing Start Date for All Users</h3>
        <div className="flex gap-3 items-center">
          <input className="form-input w-auto" type="date" value={globalStartDate}
            onChange={e => setGlobalStartDate(e.target.value)} />
          <button onClick={applyGlobalStartDate} className="btn-primary text-sm"><Calendar size={14} className="mr-1.5" />Apply to All</button>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>This sets the start date, last payment date, and a 30-day due date for every non-admin user.</p>
      </div>

      {/* Users Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-3 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Email</th>
                <th className="text-left py-3 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Password</th>
                <th className="text-center py-3 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Start Date</th>
                <th className="text-center py-3 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Last Payment</th>
                <th className="text-center py-3 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Due Date</th>
                <th className="text-right py-3 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Amount</th>
                <th className="text-center py-3 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Status</th>
                <th className="text-right py-3 px-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const isOverdue = user.nextDueDate && new Date(user.nextDueDate) < new Date() && user.subscriptionStatus === 'active';
                return (
                  <tr key={user.email} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {user.role === 'admin' && <Shield size={12} style={{ color: 'var(--green)' }} />}
                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                          {revealedPasswords[user.email] ? (user.displayPassword || '—') : '••••••••'}
                        </span>
                        <button onClick={() => togglePassword(user.email)} className="p-0.5" style={{ color: 'var(--text-muted)' }}>
                          {revealedPasswords[user.email] ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button onClick={() => { setResettingPass(user.email); setNewPass(''); }} className="p-0.5" style={{ color: 'var(--green)' }}>
                          <Key size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{user.startDate || '—'}</td>
                    <td className="py-3 px-3 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{user.lastPaymentDate || '—'}</td>
                    <td className="py-3 px-3 text-center text-xs" style={{ color: isOverdue ? 'var(--red)' : 'var(--text-muted)' }}>
                      {user.nextDueDate || '—'}
                      {isOverdue && ' ⚠'}
                    </td>
                    <td className="py-3 px-3 text-right text-xs font-medium" style={{ color: 'var(--green)' }}>{formatCurrency(user.amountPaid)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.subscriptionStatus === 'active' ? 'badge-green' :
                        user.subscriptionStatus === 'expired' ? 'badge-red' : ''
                      }`} style={{
                        background: user.subscriptionStatus === 'active' ? 'var(--green-bg)' :
                                    user.subscriptionStatus === 'expired' ? 'var(--red-bg)' : 'rgba(100,116,139,0.12)',
                        color: user.subscriptionStatus === 'active' ? 'var(--green)' :
                               user.subscriptionStatus === 'expired' ? 'var(--red)' : 'var(--text-muted)',
                      }}>{user.subscriptionStatus}</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => openBilling(user)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
                        <CreditCard size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resettingPass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setResettingPass(null)}>
          <div className="glass w-full max-w-sm rounded-2xl p-5 animate-slide-up">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Reset Password — {resettingPass}</h3>
            <input className="form-input mb-3" type="text" placeholder="New password (min 4 chars)"
              value={newPass} onChange={e => setNewPass(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setResettingPass(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={() => handleResetPassword(resettingPass)} className="btn-primary flex-1 text-sm">Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Billing Modal */}
      {editingBilling && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setEditingBilling(null)}>
          <div className="glass w-full max-w-md rounded-2xl p-5 animate-slide-up">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Billing — {editingBilling}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Start Date</label>
                <input className="form-input" type="date" value={billingForm.startDate}
                  onChange={e => setBillingForm({ ...billingForm, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Last Payment Date</label>
                <input className="form-input" type="date" value={billingForm.lastPaymentDate}
                  onChange={e => setBillingForm({ ...billingForm, lastPaymentDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Next Due Date</label>
                <input className="form-input" type="date" value={billingForm.nextDueDate}
                  onChange={e => setBillingForm({ ...billingForm, nextDueDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Amount Paid (TZS)</label>
                <input className="form-input" type="number" min="0" value={billingForm.amountPaid}
                  onChange={e => setBillingForm({ ...billingForm, amountPaid: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Status</label>
                <select className="form-input" value={billingForm.subscriptionStatus}
                  onChange={e => setBillingForm({ ...billingForm, subscriptionStatus: e.target.value })}
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditingBilling(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={saveBilling} className="btn-primary flex-1 text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
