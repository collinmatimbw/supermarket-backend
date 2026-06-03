import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const SIZE_MAP = { sm: '400px', md: '540px', lg: '720px', xl: '900px' };

export default function Modal({ open, onClose, title, children, size, maxWidth }) {
  const width = maxWidth || SIZE_MAP[size] || SIZE_MAP.md;
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="glass w-full animate-slide-up mx-2 sm:mx-0"
        style={{ maxWidth: width, maxHeight: '90dvh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/6">
          <h2 className="font-bold text-slate-100 text-sm sm:text-base pr-2">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-all flex-shrink-0">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
