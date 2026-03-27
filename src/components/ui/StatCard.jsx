import React from 'react';

const COLOR_MAP = {
  navy:   { value: '#071437', bg: '#EAF0F8', border: '#C5D5E8' },
  green:  { value: '#17C653', bg: '#E8FFF3', border: '#50CD89' },
  red:    { value: '#7F1D1D', bg: '#FFE2E5', border: '#FFB8C6' },
  amber:  { value: '#7A4E00', bg: '#FFF8DD', border: '#F6C000' },
  blue:   { value: '#1B84FF', bg: '#E1F0FF', border: '#B5D8FF' },
  purple: { value: '#7239EA', bg: '#F1E8FF', border: '#D4B9FF' },
  teal:   { value: '#0E9F8A', bg: '#E4FFF8', border: '#50CD89' },
  gray:   { value: '#252F4A', bg: '#FCFCFC', border: '#DBDFE9' },
  gold:   { value: '#7A4E00', bg: '#FFF8DD', border: '#F6C000' },
};

export default function StatCard({ label, value, sub, color = 'navy', icon: Icon }) {
  const c = COLOR_MAP[color] || COLOR_MAP.navy;

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #F1F1F4',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          // Dark enough to read on white background
          color: '#4B5675',
        }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 26, height: 26,
            borderRadius: 7,
            background: c.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={13} style={{ color: c.value }} />
          </div>
        )}
      </div>

      {/* Value — large, bold, high contrast */}
      <div style={{
        fontSize: 19,
        fontWeight: 800,
        fontFamily: "'JetBrains Mono', Consolas, monospace",
        color: c.value,
        lineHeight: 1.2,
        letterSpacing: '-0.5px',
      }}>
        {value}
      </div>

      {/* Sub label */}
      {sub && (
        <div style={{
          fontSize: 11,
          color: '#4B5675',  // readable gray, not too light
          marginTop: 1,
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}
