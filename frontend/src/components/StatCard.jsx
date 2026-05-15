import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'green', trend, loading }) {
  const colors = {
    green: { border: 'stat-card-green', icon: 'text-emerald-400', iconBg: 'rgba(110,231,183,0.1)', text: 'text-emerald-400' },
    blue:  { border: 'stat-card-blue',  icon: 'text-sky-400',     iconBg: 'rgba(56,189,248,0.1)',  text: 'text-sky-400'     },
    yellow:{ border: 'stat-card-yellow',icon: 'text-amber-400',   iconBg: 'rgba(251,191,36,0.1)',  text: 'text-amber-400'   },
    red:   { border: 'stat-card-red',   icon: 'text-red-400',     iconBg: 'rgba(248,113,113,0.1)', text: 'text-red-400'     },
    purple:{ border: '',               icon: 'text-violet-400',  iconBg: 'rgba(167,139,250,0.1)', text: 'text-violet-400'  },
  };
  const c = colors[color] || colors.green;

  return (
    <div className={`glass glass-hover p-5 animate-slide-up ${c.border}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">{title}</p>
          {loading ? (
            <div className="h-8 w-28 bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-slate-100 leading-none truncate">{value}</p>
          )}
          {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3`}
          style={{ background: c.iconBg }}>
          {Icon && <Icon size={18} className={c.icon} />}
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{Math.abs(trend)}% vs last week</span>
        </div>
      )}
    </div>
  );
}
