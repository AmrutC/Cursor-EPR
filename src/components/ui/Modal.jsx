import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clx } from '../../utils';

export default function Modal({ open, onClose, title, children, width = 'max-w-xl', footer }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose?.(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className={clx('relative bg-white rounded-2xl w-full flex flex-col max-h-[90vh]', width)}
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)', animation: 'modalIn 180ms ease' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b flex-shrink-0 sticky top-0 bg-white z-[1]"
          style={{ padding: '18px 22px', borderColor: '#F1F1F4' }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#071437' }}>{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md"
            style={{ color: '#99A1B7' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#FFE2E5';
              e.currentTarget.style.color = '#F8285A';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#99A1B7';
            }}
          >
            <X size={15}/>
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '20px 22px' }}>{children}</div>
        {/* Footer */}
        {footer && (
          <div
            className="border-t flex items-center justify-end gap-2 flex-shrink-0 sticky bottom-0 bg-white"
            style={{ padding: '14px 22px', borderColor: '#F1F1F4' }}
          >
            {footer}
          </div>
        )}
      </div>
      <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(-8px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </div>
  );
}
