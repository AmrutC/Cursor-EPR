export function parseComparableValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  const str = String(value).trim();
  if (!str) return '';
  const asNumber = Number(str.replace(/,/g, ''));
  if (!Number.isNaN(asNumber) && /^[+-]?\d*\.?\d+$/.test(str.replace(/,/g, ''))) {
    return asNumber;
  }
  const asDate = Date.parse(str);
  if (!Number.isNaN(asDate)) return asDate;
  return str.toLowerCase();
}

export function sortRows(rows, sortBy, sortDir = 'asc') {
  if (!sortBy) return rows;
  const direction = sortDir === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = parseComparableValue(sortBy(a));
    const bv = parseComparableValue(sortBy(b));
    if (av === bv) return 0;
    if (av > bv) return 1 * direction;
    return -1 * direction;
  });
}

export function filterRowsByDateRange(rows, getDate, range = {}) {
  const { from, to } = range || {};
  if (!from && !to) return rows;
  const fromTs = from ? Date.parse(from) : null;
  const toTs = to ? Date.parse(to) : null;
  return rows.filter(row => {
    const raw = getDate(row);
    const ts = Date.parse(raw);
    if (Number.isNaN(ts)) return false;
    if (fromTs !== null && ts < fromTs) return false;
    if (toTs !== null && ts > toTs) return false;
    return true;
  });
}

export function paginateRows(rows, page = 1, pageSize = 10) {
  const safePageSize = Math.max(1, Number(pageSize) || 10);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (safePage - 1) * safePageSize;
  const data = rows.slice(start, start + safePageSize);
  return { data, total, totalPages, page: safePage, pageSize: safePageSize };
}
