import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  BarChart3, Settings, ChevronLeft, ChevronRight,
  Store, X, Brain, Globe, Sun, Moon, LogOut, Shield
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar({ mobileOpen, onToggleMobile }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // Get logged in user info
  const auth = JSON.parse(localStorage.getItem('skyc_auth') || '{}');
  const currentUser = auth.username;
  const isAdmin = currentUser === 'sky'; // Only "sky" can manage users

  const navItems = [
    { path: '/', label: t('dashboard'), icon: LayoutDashboard },
    { path: '/products', label: t('products'), icon: Package },
    { path: '/sales', label: t('sales'), icon: ShoppingCart },
    { path: '/customers', label: t('customers'), icon: Users },
    { path: '/analytics', label: t('analytics'), icon: BarChart3 },
    { path: '/predictions', label: t('predictions'), icon: Brain },
    { path: '/settings', label: t('settings'), icon: Settings },
    ...(isAdmin ? [{ path: '/manage-users', label: 'Manage Users', icon: Shield }] : []),
  ];

  const handleSignOut = () => {
    localStorage.removeItem('skyc_auth');
    window.location.href = '/login';
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
          <img src="/mylogo.png" alt="SKYC CRM" className="w-full h-full object-cover" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-slate-100 leading-none">SKYC CRM</p>
            <p className="text-xs text-slate-500 mt-0.5">Supermarket Suite</p>
          </div>
        )}
        <button onClick={onToggleMobile} className="lg:hidden ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all">
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                active
                  ? 'nav-active'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
              title={collapsed ? label : undefined}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded-lg bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Controls */}
      {!collapsed && (
        <div className="mx-3 mb-3 space-y-2">
          {/* Language Toggle */}
          <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Globe size={13} className="text-slate-400 flex-shrink-0" />
            <button
              onClick={() => setLang('en')}
              className={`flex-1 text-xs font-medium py-1 rounded transition-all ${lang === 'en' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('sw')}
              className={`flex-1 text-xs font-medium py-1 rounded transition-all ${lang === 'sw' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              SW
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
            <span>{theme === 'dark' ? t('darkMode') : t('lightMode')}</span>
          </button>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-400/5 transition-all"
            style={{ border: '1px solid rgba(239,68,68,0.1)' }}
          >
            <LogOut size={13} />
            <span>{t('signOut')}</span>
          </button>
        </div>
      )}

      {/* Status */}
      {!collapsed && (
        <div className="mx-3 mb-4 p-3 rounded-xl" style={{ background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.12)' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="text-xs text-emerald-400 font-medium">{t('systemOnline')}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t('excelStorageActive')}</p>
        </div>
      )}

      {/* Collapse toggle - desktop only */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-2 mb-4 p-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all items-center justify-center hidden lg:flex"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </>
  );

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onToggleMobile} />
      )}

      <aside
        className="hidden lg:flex flex-col transition-all duration-300 ease-in-out relative z-10"
        style={{
          width: collapsed ? 72 : 240,
          minHeight: '100vh',
          borderRadius: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: 'var(--bg-secondary)',
        }}
      >
        {sidebarContent}
      </aside>

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: 280,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
