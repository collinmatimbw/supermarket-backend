import React, { useState } from 'react';
import { Lock, User, AlertCircle } from 'lucide-react';
import api from '../utils/api';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('skyc_auth', JSON.stringify(res.data.data));
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#030712' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/mylogo.png" alt="SKYC CRM" className="w-16 h-16 mx-auto mb-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }} />
          <h1 className="text-2xl font-bold text-slate-100">SKYC CRM</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="glass p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Username</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="form-input pl-9"
                placeholder="Enter username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="form-input pl-9"
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
