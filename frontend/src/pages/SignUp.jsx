import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Globe, Sun, Moon } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function SignUp({ onLoginClick }) {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.email || !form.password) {
      setError(t('emailPasswordRequired'));
      return;
    }

    if (!form.email.includes('@')) {
      setError(t('enterValidEmail'));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (form.password.length < 4) {
      setError(t('passwordMinLength'));
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/signup', { email: form.email, password: form.password });
      setSuccess(t('accountCreated'));
      setTimeout(() => onLoginClick(), 2000);
    } catch (err) {
      setError(err.message || t('failedCreateAccount'));
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('createAccount')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t('signUpToStart')}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <span className="text-red-400">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <span className="text-emerald-400">{success}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>{t('emailRequired')}</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                className="form-input pl-9 text-center"
                type="email"
                placeholder={t('yourEmail')}
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>{t('passwordRequired')}</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                className="form-input pl-9 text-center"
                type="password"
                placeholder={t('min4Chars')}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                minLength={4}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>{t('confirmPassword')}</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                className="form-input pl-9 text-center"
                type="password"
                placeholder={t('confirmPasswordPlaceholder')}
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            {loading ? t('creating') : t('signUp')}
          </button>
          
          <div className="text-center pt-2">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {t('haveAccount')}{' '}
              <button type="button" onClick={onLoginClick} className="text-emerald-400 hover:underline font-medium">
                {t('logIn')}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}