import React from 'react';

function sortArrow(active, dir) {
  if (!active) return '↕';
  return dir === 'asc' ? '↑' : '↓';
}

export function SortHeader({ label, sortKey, sortState, onToggle, align = 'left' }) {
  const active = sortState?.key === sortKey;
  const dir = sortState?.dir || 'asc';
  return (
    <th
      onClick={() => onToggle?.(sortKey)}
      style={{
        padding: '10px 16px',
        fontSize: 11,
        fontWeight: 700,
        color: active ? '#1B84FF' : '#99A1B7',
        textAlign: align,
        borderBottom: '2px solid #F1F1F4',
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
          border: '1px solid #DBDFE9',
          borderRadius: 8,
          height: 36,
          padding: '0 10px',
          fontSize: 12.5,
          width: size,
        }}
      />
      <span style={{ fontSize: 11, color: '#78829D' }}>to</span>
      <input
        type="date"
        value={to || ''}
        onChange={e => onChangeTo?.(e.target.value)}
        style={{
          border: '1px solid #DBDFE9',
          borderRadius: 8,
          height: 36,
          padding: '0 10px',
          fontSize: 12.5,
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
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(totalCount, page * pageSize);
  const pageList = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pageList.push(i);
    } else if (pageList[pageList.length - 1] !== '...') {
      pageList.push('...');
    }
  }
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        marginTop: 0,
        padding: '12px 20px',
        borderTop: '1px solid #F1F1F4',
      }}
    >
      <div style={{ fontSize: 12, color: '#99A1B7' }}>
        Showing {start}–{end} of {totalCount} records
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4B5675' }}>
          Rows
          <select
            value={pageSize}
            onChange={e => onPageSizeChange?.(Number(e.target.value))}
            style={{ border: '1px solid #F1F1F4', borderRadius: 8, padding: '5px 8px', fontSize: 11 }}
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
            borderRadius: 8,
            width: 32,
            height: 32,
            fontSize: 12,
            cursor: page <= 1 ? 'default' : 'pointer',
          }}
        >
          ←
        </button>
        {pageList.map((p, idx) => (
          <button
            key={`${p}-${idx}`}
            onClick={() => (p === '...' ? null : onPageChange?.(p))}
            disabled={p === '...'}
            style={{
              border: '1px solid #F1F1F4',
              background: p === page ? '#1B84FF' : '#fff',
              color: p === page ? '#fff' : '#4B5675',
              borderColor: p === page ? '#1B84FF' : '#F1F1F4',
              borderRadius: 8,
              width: 32,
              height: 32,
              fontSize: 12,
              fontWeight: 600,
              cursor: p === '...' ? 'default' : 'pointer',
            }}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          style={{
            border: '1px solid #F1F1F4',
            background: page >= totalPages ? '#F9F9FB' : '#fff',
            color: page >= totalPages ? '#A1A5B7' : '#252F4A',
            borderRadius: 8,
            width: 32,
            height: 32,
            fontSize: 12,
            cursor: page >= totalPages ? 'default' : 'pointer',
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
