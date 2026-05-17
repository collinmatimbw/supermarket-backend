import React, { useState } from 'react';
import { Lock, User, AlertCircle, Globe, Sun, Moon } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('skyc_auth', JSON.stringify(res.data.data));
      window.location.reload();
    } catch (err) {
      setError(err.message || t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      {/* Top controls */}
      <div className="fixed top-4 right-4 flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          <button onClick={() => setLang('en')} className={`px-2 py-1 rounded text-xs font-medium transition-all ${lang === 'en' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>EN</button>
          <button onClick={() => setLang('sw')} className={`px-2 py-1 rounded text-xs font-medium transition-all ${lang === 'sw' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>SW</button>
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 transition-all" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/mylogo.png" alt="SKYC CRM" className="w-16 h-16 mx-auto mb-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>SKYC CRM</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t('signIn')}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>{t('username')}</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                className="form-input pl-9"
                placeholder={t('enterUsername')}
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>{t('password')}</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                className="form-input pl-9"
                type="password"
                placeholder={t('enterPassword')}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            {loading ? t('signingIn') : t('signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
