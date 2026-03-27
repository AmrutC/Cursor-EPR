import React from 'react';

function sortArrow(active, dir) {
  if (!active) return '↕';
  return dir === 'asc' ? '↑' : '↓';
}

export function SortHeader({ label, sortKey, sortState, onToggle, align = 'left' }) {
  const active = sortState?.key === sortKey;
  const dir = sortState?.dir || 'asc';
  const right = align === 'right';
  return (
    <th
      onClick={() => onToggle?.(sortKey)}
      style={{
        padding: '9px 14px',
        fontSize: 11,
        fontWeight: 700,
        color: active ? '#1B84FF' : '#4B5675',
        textAlign: align,
        borderBottom: '1px solid #FCFCFC',
        background: '#FCFCFC',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        {label}
        <span style={{ fontSize: 11, color: active ? '#1B84FF' : '#A1A5B7' }}>{sortArrow(active, dir)}</span>
      </span>
    </th>
  );
}

export function DateRangeFilter({
  from,
  to,
  onChangeFrom,
  onChangeTo,
  compact = false,
}) {
  const size = compact ? 120 : 135;
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input
        type="date"
        value={from || ''}
        onChange={e => onChangeFrom?.(e.target.value)}
        style={{
          border: '1px solid #F1F1F4',
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: 11.5,
          width: size,
        }}
      />
      <span style={{ fontSize: 11, color: '#78829D' }}>to</span>
      <input
        type="date"
        value={to || ''}
        onChange={e => onChangeTo?.(e.target.value)}
        style={{
          border: '1px solid #F1F1F4',
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: 11.5,
          width: size,
        }}
      />
    </div>
  );
}

export function PaginationControls({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) {
  if (!totalCount) return null;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        marginTop: 10,
      }}
    >
      <div style={{ fontSize: 11, color: '#78829D' }}>
        {totalCount} records
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4B5675' }}>
          Rows
          <select
            value={pageSize}
            onChange={e => onPageSizeChange?.(Number(e.target.value))}
            style={{ border: '1px solid #F1F1F4', borderRadius: 6, padding: '4px 8px', fontSize: 11 }}
          >
            {pageSizeOptions.map(sz => (
              <option key={sz} value={sz}>
                {sz}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => onPageChange?.(Math.max(1, page - 1))}
          disabled={page <= 1}
          style={{
            border: '1px solid #F1F1F4',
            background: page <= 1 ? '#F9F9FB' : '#fff',
            color: page <= 1 ? '#A1A5B7' : '#252F4A',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11.5,
            cursor: page <= 1 ? 'default' : 'pointer',
          }}
        >
          Prev
        </button>
        <span style={{ fontSize: 11.5, color: '#4B5675' }}>
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          style={{
            border: '1px solid #F1F1F4',
            background: page >= totalPages ? '#F9F9FB' : '#fff',
            color: page >= totalPages ? '#A1A5B7' : '#252F4A',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11.5,
            cursor: page >= totalPages ? 'default' : 'pointer',
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
