import React, { useEffect, useState } from 'react';
import { Users, AlertCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import api from '../utils/api';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/users')
      .then(r => {
        console.log('Users response:', r.data);
        setUsers(r.data.data || []);
        setError(null);
      })
      .catch(err => {
        console.error('Admin dashboard error:', err.message);
        setError(err.message);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Admin Dashboard" subtitle="User progress tracking" />
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Dashboard</h3>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <p className="text-slate-500 text-xs">Check browser console (F12) for details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Admin Dashboard" subtitle={`${users.length} registered users`} />
      
      {users.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <Users size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No Users Yet</h3>
          <p className="text-slate-500 text-sm">No one has signed up yet</p>
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">Registered Users ({users.length})</h3>
          <div className="space-y-3">
            {users.map((user, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div>
                  <p className="text-sm font-medium text-white">{user.email}</p>
                  <p className="text-xs text-slate-500">
                    {user.products || 0} products · {user.sales || 0} sales · {user.customers || 0} customers
                  </p>
                </div>
                <span className="text-xs text-slate-600">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
