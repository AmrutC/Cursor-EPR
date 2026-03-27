import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const WIDTH_MAP = {
  'max-w-xl': 700,
  'max-w-2xl': 900,
  'max-w-3xl': 1100,
};

export default function Modal({ open, onClose, title, children, width = 'max-w-xl', footer }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose?.(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  if (!open) return null;

  const maxWidth = WIDTH_MAP[width] || 700;

  return (
    <div className="vg-modal-backdrop">
      <div className="vg-modal-overlay" onClick={onClose} />
      <div className="vg-modal" style={{ maxWidth }}>
        <div className="vg-modal-head">
          <h2>{title}</h2>
          <button onClick={onClose} className="btn btn-icon btn-sm btn-light">
            <X size={14} />
          </button>
        </div>
        <div className="vg-modal-body">{children}</div>
        {footer && <div className="vg-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
