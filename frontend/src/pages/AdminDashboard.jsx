import React from 'react';
import { Users, TrendingUp, BarChart3, Target, Activity } from 'lucide-react';
import PageHeader from '../components/PageHeader';

export default function AdminDashboard() {
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="Track your users' progress" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 -translate-y-6 translate-x-6" style={{ background: 'radial-gradient(circle, white, transparent)' }} />
          <Users size={20} className="mb-3 opacity-80" />
          <p className="text-3xl font-bold">--</p>
          <p className="text-sm opacity-80 mt-1">Total Users</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 -translate-y-6 translate-x-6" style={{ background: 'radial-gradient(circle, white, transparent)' }} />
          <Activity size={20} className="mb-3 opacity-80" />
          <p className="text-3xl font-bold">--</p>
          <p className="text-sm opacity-80 mt-1">Active Users</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 -translate-y-6 translate-x-6" style={{ background: 'radial-gradient(circle, white, transparent)' }} />
          <BarChart3 size={20} className="mb-3 opacity-80" />
          <p className="text-3xl font-bold">--</p>
          <p className="text-sm opacity-80 mt-1">Total Sales</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 -translate-y-6 translate-x-6" style={{ background: 'radial-gradient(circle, white, transparent)' }} />
          <Target size={20} className="mb-3 opacity-80" />
          <p className="text-3xl font-bold">--</p>
          <p className="text-sm opacity-80 mt-1">Avg Sales/User</p>
        </div>
      </div>

      {/* Message */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
        <TrendingUp size={48} className="text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-400 mb-2">Dashboard Coming Soon</h3>
        <p className="text-slate-500 text-sm">User progress tracking will appear here</p>
      </div>
    </div>
  );
}
