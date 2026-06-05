import React, { useState, useEffect } from 'react';
import { Trash2, Users, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import { useLanguage } from '../context/LanguageContext';

const ROLES = ['user', 'manager', 'admin'];

export default function ManageUsers() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (err) {
      toast.error(t('loadingUsers'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleDelete = async (email) => {
    if (!window.confirm(`${t('deleteUserConfirm')} "${email}"? ${t('andAllTheirData')}`)) return;
    try {
      await api.delete(`/users/${email}`);
      toast.success(`${t('userToast')} "${email}" ${t('deleted')}`);
      loadUsers();
    } catch (err) { toast.error(err.message); }
  };

  const handleRoleChange = async (email, role) => {
    try {
      await api.put(`/users/${email}/role`, { role });
      toast.success(`${t('userToast')} ${t('roleUpdated')}`);
      loadUsers();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={t('manageUsersTitle')} subtitle={t('viewAndDelete')} />

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('email')}</th>
                <th className="text-left py-3 px-4 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('role')}</th>
                <th className="text-left py-3 px-4 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('joined')}</th>
                <th className="text-center py-3 px-4 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('products')}</th>
                <th className="text-center py-3 px-4 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('sales')}</th>
                <th className="text-center py-3 px-4 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('customers')}</th>
                <th className="text-center py-3 px-4 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('suppliers')}</th>
                <th className="text-right py-3 px-4 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.email} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {user.role === 'admin' && <Shield size={12} style={{ color: 'var(--green)' }} />}
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{user.email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <select value={user.role} onChange={e => handleRoleChange(user.email, e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg border font-medium"
                      style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-muted)' }}>{user.createdAt?.split('T')[0] || '—'}</td>
                  <td className="py-3 px-4 text-center"><span className="badge-green text-xs px-2 py-0.5 rounded-full">{user.products}</span></td>
                  <td className="py-3 px-4 text-center"><span className="badge-green text-xs px-2 py-0.5 rounded-full">{user.sales}</span></td>
                  <td className="py-3 px-4 text-center"><span className="badge-green text-xs px-2 py-0.5 rounded-full">{user.customers}</span></td>
                  <td className="py-3 px-4 text-center"><span className="badge-green text-xs px-2 py-0.5 rounded-full">{user.suppliers}</span></td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleDelete(user.email)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--red)' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
