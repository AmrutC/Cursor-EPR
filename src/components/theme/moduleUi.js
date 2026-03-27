import React from 'react';
import { X } from 'lucide-react';

export const PAGE_HEADER_STYLE = {
  marginBottom: 24,
};

export const PAGE_TITLE_STYLE = {
  fontSize: 20,
  fontWeight: 700,
  color: 'var(--c-dark)',
  lineHeight: 1.2,
};

export const PAGE_SUBTITLE_STYLE = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--t-muted)',
  marginTop: 4,
};

export function moduleBtnStyle(color = 'var(--c-primary)', small = false, disabled = false, style = {}) {
  return {
    background: disabled ? 'var(--border)' : color,
    color: disabled ? 'var(--t-muted)' : '#fff',
    border: '1px solid transparent',
    borderRadius: 8,
    padding: small ? '7px 14px' : '9px 18px',
    fontSize: small ? 11 : 13,
    fontWeight: 600,
    cursor: disabled ? 'default' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'all 120ms ease',
    ...style,
  };
}

export const TABLE_WRAPPER_STYLE = {
  background: 'var(--bg-card)',
  borderRadius: 16,
  boxShadow: '0 0 20px rgba(0,0,0,0.06)',
  overflow: 'hidden',
};

export const TABLE_HEAD_CELL_STYLE = {
  padding: '10px 16px',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--t-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  textAlign: 'left',
  borderBottom: '2px solid var(--border)',
  background: 'var(--bg-subtle)',
  whiteSpace: 'nowrap',
};

export function tableBodyCellStyle(style = {}) {
  return {
    padding: '12px 16px',
    fontSize: 12.5,
    color: 'var(--t-primary)',
    borderBottom: '1px solid var(--border)',
    ...style,
  };
}

export function modalOverlayStyle() {
  return {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.25)',
    backdropFilter: 'blur(4px)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  };
}

export function modalCardStyle(wide = false) {
  return {
    background: '#fff',
    borderRadius: 16,
    width: wide ? 820 : 520,
    maxWidth: '95vw',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    animation: 'modalIn 180ms ease',
  };
}

export const MODAL_HEADER_STYLE = {
  padding: '18px 22px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'sticky',
  top: 0,
  background: '#fff',
  zIndex: 1,
};

export const MODAL_TITLE_STYLE = {
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--c-dark)',
};

export const MODAL_BODY_STYLE = {
  padding: '20px 22px',
};

export function formLabelStyle() {
  return {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--t-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    display: 'block',
    marginBottom: 5,
  };
}

export function fieldStyle(error = false) {
  return {
    width: '100%',
    height: 40,
    padding: '0 12px',
    border: `1px solid ${error ? 'var(--c-danger)' : 'var(--border-md)'}`,
    borderRadius: 8,
    fontSize: 13,
    color: 'var(--c-dark)',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  };
}

export function fieldTextareaStyle(error = false) {
  return {
    ...fieldStyle(error),
    minHeight: 80,
    height: 'auto',
    padding: '10px 12px',
    resize: 'vertical',
  };
}

export function onFieldFocus(e) {
  e.target.style.borderColor = 'var(--c-primary)';
  e.target.style.boxShadow = '0 0 0 3px rgba(27,132,255,0.12)';
}

export function onFieldBlur(e, error = false) {
  e.target.style.borderColor = error ? 'var(--c-danger)' : 'var(--border-md)';
  e.target.style.boxShadow = error ? '0 0 0 3px rgba(248,40,90,0.10)' : 'none';
}

export function ModuleModalOverlay({ children, onClose, title, wide }) {
  return (
    <div style={modalOverlayStyle()} onClick={onClose}>
      <div style={modalCardStyle(wide)} onClick={e => e.stopPropagation()}>
        <div style={MODAL_HEADER_STYLE}>
          <span style={MODAL_TITLE_STYLE}>{title}</span>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: 'var(--t-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--c-danger-light)';
              e.currentTarget.style.color = 'var(--c-danger)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--t-muted)';
            }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={MODAL_BODY_STYLE}>{children}</div>
      </div>
    </div>
  );
}

export function ModuleTableTh({ children }) {
  return <th style={TABLE_HEAD_CELL_STYLE}>{children}</th>;
}

export function ModuleTableTd({ children, style = {} }) {
  return <td style={tableBodyCellStyle(style)}>{children}</td>;
}

export function ModuleBadge({ label, color = 'var(--c-primary)' }) {
  return (
    <span
      style={{
        background: `${color}1A`,
        color,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.2px',
        padding: '4px 10px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
