import React from 'react';
import { Inbox } from 'lucide-react';

export function Spinner({ size = 'md' }) {
  const s = { sm: 24, md: 36, lg: 48 }[size] || 36;
  const b = { sm: '2px', md: '3px', lg: '4px' }[size];
  return (
    <div style={{
      width: s, height: s,
      border: `${b} solid rgba(110,231,183,0.1)`,
      borderTopColor: '#6ee7b7',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
  );
}

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Spinner size="md" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = 'No data found', subtitle = '', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Icon size={28} className="text-slate-600" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-300 text-sm">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
