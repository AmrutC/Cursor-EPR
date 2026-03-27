import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { Search, X, ArrowRight, Package, Users, BookOpen, DollarSign, Truck, UserCheck, LayoutDashboard } from 'lucide-react';

const RESULT_GROUPS = ['Modules', 'Bookings', 'Leads', 'Vendors', 'Employees', 'Ledger', 'Materials'];

function buildIndex(state) {
  const results = [];

  // Modules & sub-tabs
  const modules = [
    { id: 'dashboard', label: 'Dashboard', group: 'Modules', module: 'dashboard', subTab: null },
    { id: 'sales-crm', label: 'CRM & Leads', group: 'Modules', module: 'sales', subTab: 'crm' },
    { id: 'sales-bookings', label: 'Bookings', group: 'Modules', module: 'sales', subTab: 'bookings' },
    { id: 'sales-collections', label: 'Collections', group: 'Modules', module: 'sales', subTab: 'collections' },
    { id: 'sales-brokers', label: 'Brokers', group: 'Modules', module: 'sales', subTab: 'brokers' },
    { id: 'sales-documents', label: 'Documents', group: 'Modules', module: 'sales', subTab: 'documents' },
    { id: 'finance-coa', label: 'Chart of Accounts', group: 'Modules', module: 'finance', subTab: 'coa' },
    { id: 'finance-ledger', label: 'Ledger & Journal', group: 'Modules', module: 'finance', subTab: 'ledger' },
    { id: 'finance-bank', label: 'Bank Reconciliation', group: 'Modules', module: 'finance', subTab: 'bank' },
    { id: 'finance-gst', label: 'GST Suite', group: 'Modules', module: 'finance', subTab: 'gst' },
    { id: 'finance-tds', label: 'TDS Register', group: 'Modules', module: 'finance', subTab: 'tds' },
    { id: 'finance-pandl', label: 'P&L Statement', group: 'Modules', module: 'finance', subTab: 'pandl' },
    { id: 'construction-indent', label: 'Material Indent', group: 'Modules', module: 'construction', subTab: 'indent' },
    { id: 'construction-po', label: 'Purchase Orders', group: 'Modules', module: 'construction', subTab: 'procurement' },
    { id: 'construction-grn', label: 'GRN', group: 'Modules', module: 'construction', subTab: 'grn' },
    { id: 'construction-stock', label: 'Stock Ledger', group: 'Modules', module: 'construction', subTab: 'stock' },
    { id: 'hr-employees', label: 'Employees', group: 'Modules', module: 'hr', subTab: 'employees' },
    { id: 'hr-payroll', label: 'Payroll', group: 'Modules', module: 'hr', subTab: 'payroll' },
    { id: 'admin-entities', label: 'Entities & Users', group: 'Modules', module: 'admin', subTab: 'entities' },
    { id: 'admin-backup', label: 'Backup Manager', group: 'Modules', module: 'admin', subTab: 'backup' },
    { id: 'admin-tally', label: 'Tally Import', group: 'Modules', module: 'admin', subTab: 'tallyimport' },
  ];
  results.push(...modules);

  // Bookings
  (state.bookings || []).forEach(b => {
    results.push({
      id: `bkg-${b.id}`, label: `${b.bookingNo || b.id} — ${b.customerName}`, sub: b.unitNo,
      group: 'Bookings', module: 'sales', subTab: 'bookings',
    });
  });

  // CRM Leads
  (state.crmLeads || []).forEach(l => {
    results.push({
      id: `lead-${l.id}`, label: l.name, sub: l.phone || l.source,
      group: 'Leads', module: 'sales', subTab: 'crm',
    });
  });

  // Vendors
  (state.vendors || []).forEach(v => {
    results.push({
      id: `ven-${v.id}`, label: v.name, sub: v.gstin || v.category,
      group: 'Vendors', module: 'construction', subTab: 'procurement',
    });
  });

  // Employees
  (state.employees || []).forEach(e => {
    results.push({
      id: `emp-${e.id}`, label: e.name, sub: e.designation,
      group: 'Employees', module: 'hr', subTab: 'employees',
    });
  });

  // Ledger entries
  (state.journalEntries || []).slice(0, 200).forEach(e => {
    if (e.narration) results.push({
      id: `jrn-${e.id}`, label: e.narration, sub: `₹${(e.amount||0).toLocaleString('en-IN')} — ${e.date}`,
      group: 'Ledger', module: 'finance', subTab: 'ledger',
    });
  });

  // Materials
  const seen = new Set();
  (state.stockLedger || []).forEach(s => {
    if (s.material && !seen.has(s.material)) {
      seen.add(s.material);
      results.push({
        id: `mat-${s.material}`, label: s.material, sub: `Project: ${s.project || '—'}`,
        group: 'Materials', module: 'construction', subTab: 'stock',
      });
    }
  });

  return results;
}

const GROUP_ICONS = {
  Modules: LayoutDashboard,
  Bookings: BookOpen,
  Leads: UserCheck,
  Vendors: Truck,
  Employees: Users,
  Ledger: DollarSign,
  Materials: Package,
};

export default function GlobalSearch({ onClose }) {
  const state = useAppStore();
  const { setActiveModule } = state;
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const index = buildIndex(state);
  const q = query.toLowerCase().trim();
  const filtered = q
    ? index.filter(r => r.label.toLowerCase().includes(q) || (r.sub || '').toLowerCase().includes(q))
    : index.filter(r => r.group === 'Modules').slice(0, 10);

  const grouped = RESULT_GROUPS.reduce((acc, g) => {
    const items = filtered.filter(r => r.group === g);
    if (items.length) acc.push({ group: g, items });
    return acc;
  }, []);

  const flat = filtered;

  useEffect(() => { setCursor(0); }, [query]);

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, flat.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === 'Enter' && flat[cursor]) navigate(flat[cursor]);
    if (e.key === 'Escape') onClose();
  }

  function navigate(item) {
    setActiveModule(item.module, item.subTab);
    onClose();
  }

  let flatIdx = 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 14, width: 560, maxWidth: '90vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid #FCFCFC' }}>
          <Search size={16} style={{ color: '#78829D', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search modules, records, forms…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#071437', background: 'transparent' }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78829D', padding: 2 }}>
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 420, overflowY: 'auto', padding: '8px 0' }}>
          {grouped.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#78829D', fontSize: 13 }}>
              No results for "{query}"
            </div>
          ) : grouped.map(({ group, items }) => (
            <div key={group}>
              <div style={{ padding: '6px 16px 3px', fontSize: 10, fontWeight: 700, color: '#78829D', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{group}</div>
              {items.map(item => {
                const isCurrent = flatIdx === cursor;
                const myIdx = flatIdx++;
                const Icon = GROUP_ICONS[group] || LayoutDashboard;
                return (
                  <div key={item.id}
                    onClick={() => navigate(item)}
                    onMouseEnter={() => setCursor(myIdx)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 16px', cursor: 'pointer',
                      background: isCurrent ? '#EEF6FF' : 'transparent',
                    }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: isCurrent ? '#E1F0FF' : '#FCFCFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={13} style={{ color: isCurrent ? '#1B84FF' : '#4B5675' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#071437' }}>{item.label}</div>
                      {item.sub && <div style={{ fontSize: 11, color: '#78829D' }}>{item.sub}</div>}
                    </div>
                    <ArrowRight size={12} style={{ color: '#DBDFE9' }} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ padding: '8px 16px', borderTop: '1px solid #FCFCFC', display: 'flex', gap: 14, fontSize: 10, color: '#78829D' }}>
          <span>↑↓ Navigate</span><span>Enter Select</span><span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
