import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: { bg: '#E8FFF3', border: '#50CD89', color: '#17C653', icon: '#17C653' },
  error:   { bg: '#FFE2E5', border: '#FFB8C6', color: '#B42318', icon: '#F8285A' },
  warning: { bg: '#FFF8DD', border: '#F6C000', color: '#7A4E00', icon: '#7A4E00' },
  info:    { bg: '#EEF6FF', border: '#B5D8FF', color: '#1B84FF', icon: '#1B84FF' },
};

export default function Toast({ toasts = [] }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => {
        const type = t.type || 'success';
        const c = COLORS[type] || COLORS.info;
        const Icon = ICONS[type] || Info;
        return (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
            background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxWidth: 340, minWidth: 240,
            animation: 'slideIn 0.2s ease',
          }}>
            <Icon size={16} style={{ color: c.icon, flexShrink: 0, marginTop: 1 }} />
            <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: c.color, lineHeight: 1.4 }}>{t.msg}</span>
          </div>
        );
      })}
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
}
