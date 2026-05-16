import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  BarChart3, Settings, ChevronLeft, ChevronRight,
  Store, Menu, X, Brain
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/sales', label: 'Sales', icon: ShoppingCart },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/predictions', label: 'Predictions', icon: Brain },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ mobileOpen, onToggleMobile }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (mobileOpen) onToggleMobile();
  }, [location.pathname]);

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
        {/* Mobile close button */}
        <button onClick={onToggleMobile} className="lg:hidden ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all">
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2">
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

      {/* Status */}
      {!collapsed && (
        <div className="mx-3 mb-4 p-3 rounded-xl" style={{ background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.12)' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="text-xs text-emerald-400 font-medium">System Online</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Excel storage active</p>
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
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onToggleMobile} />
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col transition-all duration-300 ease-in-out relative z-10"
        style={{
          width: collapsed ? 72 : 240,
          minHeight: '100vh',
          borderRadius: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(10,15,30,0.95)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: 280,
          background: 'rgba(10,15,30,0.98)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
