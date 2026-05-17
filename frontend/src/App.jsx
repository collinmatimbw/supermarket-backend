import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Menu } from 'lucide-react';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Predictions from './pages/Predictions';

function ProtectedRoute({ children }) {
  const auth = localStorage.getItem('skyc_auth');
  if (!auth) return <Navigate to="/login" replace />;
  return children;
}

function Layout({ children }) {
  const [mobileSidebar, setMobileSidebar] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileSidebar} onToggleMobile={() => setMobileSidebar(!mobileSidebar)} />
      <main className="flex-1 overflow-auto relative z-10">
        <div className="fixed top-0 left-0 right-0 h-px z-20"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(110,231,183,0.3), rgba(56,189,248,0.3), transparent)' }} />
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
  const auth = localStorage.getItem('skyc_auth');

  return (
    <LanguageProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
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
            <Route path="/login" element={auth ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><Layout><Products /></Layout></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute><Layout><Sales /></Layout></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Layout><Customers /></Layout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
            <Route path="/predictions" element={<ProtectedRoute><Layout><Predictions /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </LanguageProvider>
  );
}
