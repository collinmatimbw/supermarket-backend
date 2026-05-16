import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Predictions from './pages/Predictions';

function Layout({ children }) {
  const [mobileSidebar, setMobileSidebar] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileSidebar} onToggleMobile={() => setMobileSidebar(!mobileSidebar)} />
      <main className="flex-1 overflow-auto relative z-10">
        {/* Top gradient accent */}
        <div className="fixed top-0 left-0 right-0 h-px z-20"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(110,231,183,0.3), rgba(56,189,248,0.3), transparent)' }} />
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-white/5">
          <button
            onClick={() => setMobileSidebar(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
          >
            <Menu size={20} />
          </button>
          <p className="font-bold text-sm text-slate-100">SKYC CRM</p>
        </div>
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontSize: '13.5px',
            fontFamily: 'Sora, sans-serif',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
          success: { iconTheme: { primary: '#6ee7b7', secondary: '#0f172a' } },
          error: { iconTheme: { primary: '#f87171', secondary: '#0f172a' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/products" element={<Layout><Products /></Layout>} />
        <Route path="/sales" element={<Layout><Sales /></Layout>} />
        <Route path="/customers" element={<Layout><Customers /></Layout>} />
        <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
        <Route path="/predictions" element={<Layout><Predictions /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
