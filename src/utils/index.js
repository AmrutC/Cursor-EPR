export function clx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function inr(value) {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function fmtDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-IN');
  } catch {
    return String(value);
  }
}

export const UNIT_STATUS_COLORS = {
  available: '#17C653',
  blocked: '#7A4E00',
  booked: '#1B84FF',
  registered: '#7239EA',
  sold: '#F8285A',
  cancelled: '#78829D',
  landowner: '#7F1D1D',
  default: '#78829D',
};
