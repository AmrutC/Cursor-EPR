import React from 'react';

// Every badge: dark text on tinted background — readable on both white cards and gray backgrounds
const STYLES = {
  // Unit status
  'Available':          { bg: '#E8FFF3', text: '#17C653', border: '#A2E8BA' },
  'Blocked':            { bg: '#F9F9F9', text: '#252F4A', border: '#DBDFE9' },
  'Booked':             { bg: '#E1F0FF', text: '#1B84FF', border: '#A4CEFF' },
  'Agreement Done':     { bg: '#FFF8DD', text: '#9A6700', border: '#F6C000' },
  'Registered':         { bg: '#F1E8FF', text: '#5014D0', border: '#C4B5FD' },
  'Possession Given':   { bg: '#E4FFF8', text: '#0E9F8A', border: '#8EE8D2' },
  'Cancelled':          { bg: '#FFE2E5', text: '#A10035', border: '#FCA9BD' },

  // Payment / milestone
  'Paid':               { bg: '#E8FFF3', text: '#17C653', border: '#A2E8BA' },
  'Part Paid':          { bg: '#E1F0FF', text: '#1B84FF', border: '#A4CEFF' },
  'Pending':            { bg: '#F9F9F9', text: '#252F4A', border: '#DBDFE9' },
  'Overdue':            { bg: '#FFE2E5', text: '#A10035', border: '#FCA9BD' },
  'Demand Issued':      { bg: '#FFF8DD', text: '#9A6700', border: '#F6C000' },
  'Unpaid':             { bg: '#FFE2E5', text: '#A10035', border: '#FCA9BD' },

  // Project status
  'Under Construction': { bg: '#FFF8DD', text: '#9A6700', border: '#F6C000' },
  'Planning':           { bg: '#E1F0FF', text: '#1B84FF', border: '#A4CEFF' },
  'Completed':          { bg: '#E8FFF3', text: '#17C653', border: '#A2E8BA' },
  'On Hold':            { bg: '#F9F9F9', text: '#252F4A', border: '#DBDFE9' },

  // People / accounts
  'Active':             { bg: '#E8FFF3', text: '#17C653', border: '#A2E8BA' },
  'Inactive':           { bg: '#FFE2E5', text: '#A10035', border: '#FCA9BD' },
  'Contract':           { bg: '#F1E8FF', text: '#5014D0', border: '#C4B5FD' },

  // RERA
  'Yes':                { bg: '#E8FFF3', text: '#17C653', border: '#A2E8BA' },
  'No':                 { bg: '#F9F9F9', text: '#252F4A', border: '#DBDFE9' },
  'Exempt':             { bg: '#FFF8DD', text: '#9A6700', border: '#F6C000' },

  // KYC
  'Received':           { bg: '#E8FFF3', text: '#17C653', border: '#A2E8BA' },
  'Verified':           { bg: '#F1E8FF', text: '#5014D0', border: '#C4B5FD' },

  // Bank transactions
  'Receipt':            { bg: '#E8FFF3', text: '#17C653', border: '#A2E8BA' },
  'Payment':            { bg: '#FFE2E5', text: '#A10035', border: '#FCA9BD' },

  // Lead status
  'New':                { bg: '#E1F0FF', text: '#1B84FF', border: '#A4CEFF' },
  'Contacted':          { bg: '#FFF8DD', text: '#9A6700', border: '#F6C000' },
  'Converted':          { bg: '#E8FFF3', text: '#17C653', border: '#A2E8BA' },
  'Lost':               { bg: '#FFE2E5', text: '#A10035', border: '#FCA9BD' },
  'Negotiation':        { bg: '#F1E8FF', text: '#5014D0', border: '#C4B5FD' },
  'Site Visit Done':    { bg: '#E4FFF8', text: '#0E9F8A', border: '#8EE8D2' },

  // Credit / Debit
  'Credit':             { bg: '#E8FFF3', text: '#17C653', border: '#A2E8BA' },
  'Debit':              { bg: '#FFE2E5', text: '#A10035', border: '#FCA9BD' },

  // Brokerage
  'Partially Paid':     { bg: '#E1F0FF', text: '#1B84FF', border: '#A4CEFF' },

  // Approvals
  'Applied':            { bg: '#FFF8DD', text: '#9A6700', border: '#F6C000' },
  'Expired':            { bg: '#FFE2E5', text: '#A10035', border: '#FCA9BD' },
};

const FALLBACK = { bg: '#F9F9F9', text: '#252F4A', border: '#DBDFE9' };

export default function Badge({ value, size = 'sm' }) {
  const s = STYLES[value] || FALLBACK;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        borderRadius: 20,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        fontSize: size === 'sm' ? 11 : 12,
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        lineHeight: 1.4,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {value}
    </span>
  );
}
