import React from 'react';

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold text-slate-100">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1 break-words">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
