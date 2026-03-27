import React from 'react';

const COLOR_MAP = {
  navy:   { value: '#071437', bg: '#EAF0F8' },
  green:  { value: '#17C653', bg: '#E8FFF3' },
  red:    { value: '#F8285A', bg: '#FFE2E5' },
  amber:  { value: '#B45309', bg: '#FFF8DD' },
  blue:   { value: '#1B84FF', bg: '#EEF6FF' },
  purple: { value: '#7239EA', bg: '#F5F0FF' },
  teal:   { value: '#0E9F8A', bg: '#DFFFF8' },
  gray:   { value: '#4B5675', bg: '#F9FAFB' },
  gold:   { value: '#B45309', bg: '#FFF8DD' },
};

export default function StatCard({ label, value, sub, color = 'navy', icon: Icon, trend }) {
  const c = COLOR_MAP[color] || COLOR_MAP.navy;
  const trendText = trend?.text || sub;
  const trendTone = trend?.tone || (String(trendText || '').includes('↓') ? 'down' : String(trendText || '').includes('↑') ? 'up' : 'neutral');
  const trendColor = trendTone === 'up' ? '#17C653' : trendTone === 'down' ? '#F8285A' : '#99A1B7';

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '22px 24px',
        boxShadow: '0 0 20px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 28px rgba(0,0,0,0.10)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 0 20px rgba(0,0,0,0.06)';
      }}
    >
      {Icon && (
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: c.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={22} style={{ color: c.value }} />
        </div>
      )}

      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#99A1B7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#071437', lineHeight: 1, marginTop: 4 }}>
          {value}
        </div>
        {trendText ? (
          <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: trendColor }}>
            {trendText}
          </div>
        ) : null}
      </div>
    </div>
  );
}
