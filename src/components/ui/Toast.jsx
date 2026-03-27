import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: { accent: '#17C653', bg: '#FFFFFF' },
  error: { accent: '#F8285A', bg: '#FFFFFF' },
  warning: { accent: '#F6C000', bg: '#FFFFFF' },
  info: { accent: '#1B84FF', bg: '#FFFFFF' },
};

export default function Toast({ toasts = [] }) {
  const { removeToast } = useAppStore();
  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 'min(480px, calc(100vw - 24px))',
      }}
    >
      {toasts.map(t => {
        const type = t.type || 'success';
        const c = COLORS[type] || COLORS.info;
        const Icon = ICONS[type] || Info;
        const ttl = Number(t.duration || 3200);
        const title =
          type === 'success' ? 'Success' :
          type === 'error' ? 'Error' :
          type === 'warning' ? 'Warning' : 'Info';
        return (
          <div
            key={t.id}
            style={{
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '11px 14px 12px 14px',
              background: c.bg,
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
              minWidth: 320,
              width: '100%',
              animation: 'toastIn 200ms ease',
            }}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: c.accent }} />
            <Icon size={16} style={{ color: c.accent, flexShrink: 0, marginTop: 1, marginLeft: 4 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#071437' }}>{title}</div>
              <div style={{ fontSize: 12, color: '#4B5675', marginTop: 2, lineHeight: 1.4 }}>{t.msg}</div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#99A1B7',
                cursor: 'pointer',
                padding: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                height: 2,
                background: c.accent,
                width: '100%',
                animation: `toastProgress ${ttl}ms linear forwards`,
              }}
            />
          </div>
        );
      })}
      <style>{`@keyframes toastIn{from{transform:translateY(-16px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes toastProgress{from{width:100%}to{width:0}}`}</style>
    </div>
  );
}
