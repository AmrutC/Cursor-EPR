import React from 'react';

// Every badge: dark text on tinted background — readable on both white cards and gray backgrounds
const STYLES = {
  // Unit status
  'Available':          { bg: '#E8FFF3', text: '#17C653', border: '#50CD89' },
  'Blocked':            { bg: '#FCFCFC', text: '#252F4A', border: '#DBDFE9' },
  'Booked':             { bg: '#E1F0FF', text: '#1B84FF', border: '#B5D8FF' },
  'Agreement Done':     { bg: '#FFF8DD', text: '#7A4E00', border: '#F6C000' },
  'Registered':         { bg: '#F1E8FF', text: '#7239EA', border: '#D4B9FF' },
  'Possession Given':   { bg: '#E4FFF8', text: '#0E9F8A', border: '#50CD89' },
  'Cancelled':          { bg: '#FFE2E5', text: '#7F1D1D', border: '#FFB8C6' },

  // Payment / milestone
  'Paid':               { bg: '#E8FFF3', text: '#17C653', border: '#50CD89' },
  'Part Paid':          { bg: '#E1F0FF', text: '#1B84FF', border: '#B5D8FF' },
  'Pending':            { bg: '#FCFCFC', text: '#252F4A', border: '#DBDFE9' },
  'Overdue':            { bg: '#FFE2E5', text: '#7F1D1D', border: '#FFB8C6' },
  'Demand Issued':      { bg: '#FFF8DD', text: '#7A4E00', border: '#F6C000' },
  'Unpaid':             { bg: '#FFE2E5', text: '#7F1D1D', border: '#FFB8C6' },

  // Project status
  'Under Construction': { bg: '#FFF8DD', text: '#7A4E00', border: '#F6C000' },
  'Planning':           { bg: '#E1F0FF', text: '#1B84FF', border: '#B5D8FF' },
  'Completed':          { bg: '#E8FFF3', text: '#17C653', border: '#50CD89' },
  'On Hold':            { bg: '#FCFCFC', text: '#252F4A', border: '#DBDFE9' },

  // People / accounts
  'Active':             { bg: '#E8FFF3', text: '#17C653', border: '#50CD89' },
  'Inactive':           { bg: '#FFE2E5', text: '#7F1D1D', border: '#FFB8C6' },
  'Contract':           { bg: '#F1E8FF', text: '#7239EA', border: '#D4B9FF' },

  // RERA
  'Yes':                { bg: '#E8FFF3', text: '#17C653', border: '#50CD89' },
  'No':                 { bg: '#FCFCFC', text: '#252F4A', border: '#DBDFE9' },
  'Exempt':             { bg: '#FFF8DD', text: '#7A4E00', border: '#F6C000' },

  // KYC
  'Received':           { bg: '#E8FFF3', text: '#17C653', border: '#50CD89' },
  'Verified':           { bg: '#F1E8FF', text: '#7239EA', border: '#D4B9FF' },

  // Bank transactions
  'Receipt':            { bg: '#E8FFF3', text: '#17C653', border: '#50CD89' },
  'Payment':            { bg: '#FFE2E5', text: '#7F1D1D', border: '#FFB8C6' },

  // Lead status
  'New':                { bg: '#E1F0FF', text: '#1B84FF', border: '#B5D8FF' },
  'Contacted':          { bg: '#FFF8DD', text: '#7A4E00', border: '#F6C000' },
  'Converted':          { bg: '#E8FFF3', text: '#17C653', border: '#50CD89' },
  'Lost':               { bg: '#FFE2E5', text: '#7F1D1D', border: '#FFB8C6' },
  'Negotiation':        { bg: '#F1E8FF', text: '#7239EA', border: '#D4B9FF' },
  'Site Visit Done':    { bg: '#E4FFF8', text: '#0E9F8A', border: '#50CD89' },

  // Credit / Debit
  'Credit':             { bg: '#E8FFF3', text: '#17C653', border: '#50CD89' },
  'Debit':              { bg: '#FFE2E5', text: '#7F1D1D', border: '#FFB8C6' },

  // Brokerage
  'Partially Paid':     { bg: '#E1F0FF', text: '#1B84FF', border: '#B5D8FF' },

  // Approvals
  'Applied':            { bg: '#FFF8DD', text: '#7A4E00', border: '#F6C000' },
  'Expired':            { bg: '#FFE2E5', text: '#7F1D1D', border: '#FFB8C6' },
};

const FALLBACK = { bg: '#FCFCFC', text: '#252F4A', border: '#DBDFE9' };

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
