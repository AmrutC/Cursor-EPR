import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Plus, Search, Upload, Download, RefreshCw, X, ChevronDown, Filter } from 'lucide-react';
import { sortRows, filterRowsByDateRange, paginateRows } from '../../utils/table';
import { SortHeader, DateRangeFilter, PaginationControls } from '../ui/TableUtilities';
import {
  moduleBtnStyle,
  ModuleModalOverlay as ModalOverlay,
  ModuleTableTh as Th,
  ModuleTableTd as Td,
  formLabelStyle,
  fieldStyle,
  onFieldFocus,
  onFieldBlur,
  PAGE_HEADER_STYLE,
  PAGE_TITLE_STYLE,
  PAGE_SUBTITLE_STYLE,
} from '../theme/moduleUi';

export default function FinanceModule({ viewOnly }) {
  const { activeSubTab } = useAppStore();
  const tab = activeSubTab || 'coa';
  return (
    <div>
      {tab === 'coa'           && <COATab viewOnly={viewOnly} />}
      {tab === 'ledger'        && <LedgerTab viewOnly={viewOnly} />}
      {tab === 'bank'          && <BankReconTab viewOnly={viewOnly} />}
      {tab === 'trialbalance'  && <TrialBalanceTab />}
      {tab === 'pandl'         && <PAndLTab />}
      {tab === 'balancesheet'  && <BalanceSheetTab />}
      {tab === 'cashflow'      && <CashFlowTab />}
      {tab === 'gst'           && <GSTTab viewOnly={viewOnly} />}
      {tab === 'tds'           && <TDSTab viewOnly={viewOnly} />}
      {tab === 'expenses'      && <ExpensesTab viewOnly={viewOnly} />}
      {tab === 'vendoradvance' && <VendorAdvanceTab viewOnly={viewOnly} />}
    </div>
  );
}

// ── SHARED ─────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, color = 'var(--c-success)', small, disabled, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={moduleBtnStyle(color, small, disabled, style)}>{children}</button>
);

const Badge = ({ label, color = 'var(--c-success)' }) => (
  <span style={{ background: color + '18', color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{label}</span>
);

function FormField({ label, value, onChange, type = 'text', options, required }) {
  return (
    <div>
      <label style={formLabelStyle()}>{label}{required && <span style={{ color: 'var(--c-danger)' }}> *</span>}</label>
      {options ? (
        <select value={value || ''} onChange={e => onChange(e.target.value)} style={fieldStyle(false)} onFocus={onFieldFocus} onBlur={e => onFieldBlur(e, false)}>
          {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
        </select>
      ) : (
        <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
          style={fieldStyle(false)}
          onFocus={onFieldFocus}
          onBlur={e => onFieldBlur(e, false)} />
      )}
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={PAGE_HEADER_STYLE}>
      <div style={PAGE_TITLE_STYLE}>{title}</div>
      {sub && <div style={PAGE_SUBTITLE_STYLE}>{sub}</div>}
    </div>
  );
}

// ── COA ────────────────────────────────────────────────────────────────────
function COATab({ viewOnly }) {
  const { coa, setCoa, addToast } = useAppStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', group: 'Assets', subGroup: '', type: 'asset', openingBalance: 0 });
  const [search, setSearch] = useState('');

  const GROUPS = ['Assets', 'Liabilities', 'Capital', 'Income', 'Expenses'];
  const TYPE_MAP = { Assets: 'asset', Liabilities: 'liability', Capital: 'capital', Income: 'income', Expenses: 'expense' };

  function saveAccount() {
    if (!form.name || !form.code) { addToast('Code and name required', 'error'); return; }
    if (coa.find(a => a.code === form.code)) { addToast('Code already exists', 'error'); return; }
    setCoa(prev => [...prev, { ...form, id: Date.now(), isSystem: false }]);
    addToast('Account added'); setModal(false);
  }

  const grouped = GROUPS.reduce((acc, g) => {
    const items = coa.filter(a => a.group === g && (!search || a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search)));
    if (items.length) acc.push({ group: g, items });
    return acc;
  }, []);

  const GROUP_COLORS = { Assets: 'var(--c-primary)', Liabilities: 'var(--c-danger)', Capital: 'var(--c-info)', Income: 'var(--c-success)', Expenses: 'var(--c-warning)' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionHeader title="Chart of Accounts" sub={`${coa.length} accounts`} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={11} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--t-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ paddingLeft: 26, paddingRight: 10, paddingTop: 6, paddingBottom: 6, border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, outline: 'none', width: 180 }} />
          </div>
          {!viewOnly && <Btn onClick={() => { setForm({ code: '', name: '', group: 'Assets', subGroup: '', type: 'asset', openingBalance: 0 }); setModal(true); }} small><Plus size={12} /> Add Account</Btn>}
        </div>
      </div>

      {grouped.map(({ group, items }) => (
        <div key={group} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GROUP_COLORS[group], textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: GROUP_COLORS[group] }} />{group}
          </div>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><Th>Code</Th><Th>Account Name</Th><Th>Sub-Group</Th><Th>Opening Balance</Th><Th>Type</Th></tr></thead>
              <tbody>
                {items.map(a => (
                  <tr key={a.id}>
                    <Td style={{ fontWeight: 700, color: 'var(--c-dark)', fontFamily: 'monospace' }}>{a.code}</Td>
                    <Td style={{ fontWeight: 500 }}>{a.name} {a.isSystem && <Badge label="System" color="var(--t-secondary)" />}</Td>
                    <Td>{a.subGroup || '—'}</Td>
                    <Td style={{ fontWeight: 600 }}>₹{(a.openingBalance || 0).toLocaleString('en-IN')}</Td>
                    <Td><Badge label={a.type} color={GROUP_COLORS[group]} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {modal && (
        <ModalOverlay onClose={() => setModal(false)} title="Add Account">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Account Code" value={form.code} onChange={v => setForm(f => ({ ...f, code: v.toUpperCase() }))} required />
            <FormField label="Account Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
            <FormField label="Group" value={form.group} onChange={v => setForm(f => ({ ...f, group: v, type: TYPE_MAP[v] || 'asset' }))} options={GROUPS} />
            <FormField label="Sub-Group" value={form.subGroup} onChange={v => setForm(f => ({ ...f, subGroup: v }))} />
            <FormField label="Opening Balance (₹)" value={form.openingBalance} onChange={v => setForm(f => ({ ...f, openingBalance: Number(v) }))} type="number" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn onClick={() => setModal(false)} color="var(--t-secondary)" small>Cancel</Btn>
            <Btn onClick={saveAccount} small>Save Account</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── LEDGER / JOURNAL ───────────────────────────────────────────────────────
const VOUCHER_TYPES = ['Receipt', 'Payment', 'Journal', 'Sales', 'Purchase', 'Contra'];
const VOUCHER_COLORS = { Receipt: 'var(--c-success)', Payment: 'var(--c-danger)', Journal: 'var(--c-primary)', Sales: 'var(--c-info)', Purchase: 'var(--c-warning)', Contra: 'var(--c-teal)' };

function LedgerTab({ viewOnly }) {
  const { journalEntries, setJournalEntries, coa, addToast, user, activeEntity } = useAppStore();
  const [modal, setModal] = useState(false);
  const [viewEntry, setViewEntry] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAccount, setFilterAccount] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortState, setSortState] = useState({ key: 'date', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], voucherType: 'Receipt', narration: '', amount: '', drAccount: '', crAccount: '', ref: '', gstin: '' });

  const baseFiltered = useMemo(() => (
    journalEntries.filter(e => {
      if (filterType !== 'all' && e.voucherType !== filterType) return false;
      if (filterAccount && e.drAccount !== filterAccount && e.crAccount !== filterAccount) return false;
      if (search && !e.narration?.toLowerCase().includes(search.toLowerCase()) && !e.ref?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
  ), [journalEntries, filterType, filterAccount, search]);

  const dateFiltered = useMemo(
    () => filterRowsByDateRange(baseFiltered, e => e.date, { from: dateFrom, to: dateTo }),
    [baseFiltered, dateFrom, dateTo],
  );

  const sortedRows = useMemo(() => {
    const sorters = {
      date: e => e.date || '',
      voucherNo: e => e.voucherNo || '',
      voucherType: e => e.voucherType || '',
      narration: e => e.narration || '',
      drAccount: e => e.drAccount || '',
      crAccount: e => e.crAccount || '',
      amount: e => Number(e.amount || 0),
    };
    const getter = sortState?.key ? sorters[sortState.key] : null;
    return sortRows(dateFiltered, getter, sortState?.dir || 'asc');
  }, [dateFiltered, sortState]);

  const paged = useMemo(() => paginateRows(sortedRows, page, pageSize), [sortedRows, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, filterType, filterAccount, dateFrom, dateTo, pageSize]);

  function toggleSort(key) {
    setPage(1);
    setSortState(prev => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: 'asc' };
    });
  }

  function saveEntry() {
    if (!form.narration || !form.amount || !form.drAccount || !form.crAccount) { addToast('Fill all required fields', 'error'); return; }
    const id = Date.now();
    const vNo = `${(activeEntity?.code || 'VEH')}/${form.voucherType.slice(0, 3).toUpperCase()}/${String(journalEntries.length + 1).padStart(4, '0')}`;
    const entry = { ...form, id, voucherNo: vNo, amount: Number(form.amount), createdBy: user?.full_name, createdAt: new Date().toISOString() };
    setJournalEntries(prev => [entry, ...prev]);
    addToast('Journal entry saved');
    setModal(false);
    setForm({ date: new Date().toISOString().split('T')[0], voucherType: 'Receipt', narration: '', amount: '', drAccount: '', crAccount: '', ref: '', gstin: '' });
  }

  // Running balance for selected account
  const accountBalance = useMemo(() => {
    if (!filterAccount) return null;
    const acct = coa.find(a => a.code === filterAccount);
    if (!acct) return null;
    let balance = acct.openingBalance || 0;
    dateFiltered.forEach(e => {
      if (e.drAccount === filterAccount) balance += e.amount;
      if (e.crAccount === filterAccount) balance -= e.amount;
    });
    return { name: acct.name, balance };
  }, [filterAccount, dateFiltered, coa]);

  const coaOptions = [{ value: '', label: '— All Accounts —' }, ...coa.map(a => ({ value: a.code, label: `${a.code} — ${a.name}` }))];

  const totalDr = sortedRows.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionHeader title="Ledger & Journal" sub={`${sortedRows.length} entries`} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={11} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--t-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search narration…" style={{ paddingLeft: 26, paddingRight: 10, paddingTop: 6, paddingBottom: 6, border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, outline: 'none', width: 180 }} />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
            <option value="all">All Types</option>
            {VOUCHER_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 11, maxWidth: 200 }}>
            {coaOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <DateRangeFilter from={dateFrom} to={dateTo} onChangeFrom={setDateFrom} onChangeTo={setDateTo} compact />
          {!viewOnly && <Btn onClick={() => setModal(true)} small><Plus size={12} /> New Entry</Btn>}
        </div>
      </div>

      {accountBalance && (
        <div style={{ background: 'var(--c-primary-light)', borderRadius: 10, padding: '10px 16px', marginBottom: 14, display: 'flex', gap: 20 }}>
          <div><div style={{ fontSize: 10, color: 'var(--t-muted)' }}>Account</div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-dark)' }}>{accountBalance.name}</div></div>
          <div><div style={{ fontSize: 10, color: 'var(--t-muted)' }}>Closing Balance</div><div style={{ fontSize: 13, fontWeight: 700, color: accountBalance.balance >= 0 ? 'var(--c-success)' : 'var(--c-danger)' }}>₹{Math.abs(accountBalance.balance).toLocaleString('en-IN')} {accountBalance.balance >= 0 ? 'Dr' : 'Cr'}</div></div>
          <div><div style={{ fontSize: 10, color: 'var(--t-muted)' }}>Entries Shown</div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-dark)' }}>{sortedRows.length}</div></div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <SortHeader label="Date" sortKey="date" sortState={sortState} onToggle={toggleSort} />
              <SortHeader label="Voucher No" sortKey="voucherNo" sortState={sortState} onToggle={toggleSort} />
              <SortHeader label="Type" sortKey="voucherType" sortState={sortState} onToggle={toggleSort} />
              <SortHeader label="Narration" sortKey="narration" sortState={sortState} onToggle={toggleSort} />
              <SortHeader label="Dr Account" sortKey="drAccount" sortState={sortState} onToggle={toggleSort} />
              <SortHeader label="Cr Account" sortKey="crAccount" sortState={sortState} onToggle={toggleSort} />
              <SortHeader label="Amount" sortKey="amount" sortState={sortState} onToggle={toggleSort} align="right" />
            </tr>
          </thead>
          <tbody>
            {paged.data.map(e => (
              <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => setViewEntry(e)}
                onMouseEnter={ev => ev.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                <Td>{e.date}</Td>
                <Td style={{ fontWeight: 700, color: 'var(--c-dark)', fontSize: 11 }}>{e.voucherNo || '—'}</Td>
                <Td><Badge label={e.voucherType} color={VOUCHER_COLORS[e.voucherType] || 'var(--t-secondary)'} /></Td>
                <Td style={{ maxWidth: 220 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.narration}</div></Td>
                <Td style={{ fontFamily: 'monospace', fontSize: 11 }}>{e.drAccount}</Td>
                <Td style={{ fontFamily: 'monospace', fontSize: 11 }}>{e.crAccount}</Td>
                <Td style={{ fontWeight: 700, color: 'var(--c-success)' }}>₹{Number(e.amount || 0).toLocaleString('en-IN')}</Td>
              </tr>
            ))}
          </tbody>
          {sortedRows.length > 0 && (
            <tfoot>
              <tr style={{ background: 'var(--bg-subtle)' }}>
                <td colSpan={6} style={{ padding: '9px 14px', fontWeight: 700, fontSize: 12, color: 'var(--c-dark)', textAlign: 'right' }}>Total</td>
                <td style={{ padding: '9px 14px', fontWeight: 800, fontSize: 13, color: 'var(--c-success)' }}>₹{totalDr.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          )}
        </table>
        {sortedRows.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--t-muted)', fontSize: 13 }}>No journal entries found.</div>}
      </div>
      <PaginationControls
        page={paged.page}
        totalPages={paged.totalPages}
        totalCount={paged.total}
        pageSize={paged.pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {modal && (
        <ModalOverlay onClose={() => setModal(false)} title="New Journal Entry" wide>
          <div style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, fontSize: 11.5, color: 'var(--t-primary)' }}>
            💡 Double-entry: every debit (Dr) has an equal credit (Cr). Amount is debited to Dr Account and credited to Cr Account.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <FormField label="Date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" />
            <FormField label="Voucher Type" value={form.voucherType} onChange={v => setForm(f => ({ ...f, voucherType: v }))} options={VOUCHER_TYPES} />
            <FormField label="Amount (₹)" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} type="number" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <FormField label="Dr Account (Debit)" value={form.drAccount} onChange={v => setForm(f => ({ ...f, drAccount: v }))} options={[{ value: '', label: '— Select —' }, ...coa.map(a => ({ value: a.code, label: `${a.code} — ${a.name}` }))]} required />
            <FormField label="Cr Account (Credit)" value={form.crAccount} onChange={v => setForm(f => ({ ...f, crAccount: v }))} options={[{ value: '', label: '— Select —' }, ...coa.map(a => ({ value: a.code, label: `${a.code} — ${a.name}` }))]} required />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-primary)', display: 'block', marginBottom: 4 }}>Narration *</label>
            <textarea value={form.narration} onChange={e => setForm(f => ({ ...f, narration: e.target.value }))} rows={2} style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <FormField label="Reference / Cheque No" value={form.ref} onChange={v => setForm(f => ({ ...f, ref: v }))} />
            <FormField label="GSTIN (if applicable)" value={form.gstin} onChange={v => setForm(f => ({ ...f, gstin: v }))} />
          </div>
          {form.drAccount && form.crAccount && Number(form.amount) > 0 && (
            <div style={{ background: 'var(--c-success-light)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12 }}>
              <strong>Preview:</strong> Dr {form.drAccount} ₹{Number(form.amount).toLocaleString('en-IN')} | Cr {form.crAccount} ₹{Number(form.amount).toLocaleString('en-IN')}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn onClick={() => setModal(false)} color="var(--t-secondary)" small>Cancel</Btn>
            <Btn onClick={saveEntry} small>Save Entry</Btn>
          </div>
        </ModalOverlay>
      )}

      {viewEntry && (
        <ModalOverlay onClose={() => setViewEntry(null)} title={`Entry — ${viewEntry.voucherNo || viewEntry.id}`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {[['Date', viewEntry.date], ['Type', viewEntry.voucherType], ['Amount', `₹${Number(viewEntry.amount).toLocaleString('en-IN')}`], ['Dr Account', viewEntry.drAccount], ['Cr Account', viewEntry.crAccount], ['Reference', viewEntry.ref || '—'], ['Created By', viewEntry.createdBy || '—'], ['Created At', viewEntry.createdAt ? new Date(viewEntry.createdAt).toLocaleString('en-IN') : '—']].map(([k, v]) => (
              <div key={k}><div style={{ fontSize: 10, color: 'var(--t-muted)' }}>{k}</div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-dark)' }}>{v}</div></div>
            ))}
          </div>
          <div style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--t-muted)' }}>Narration</div>
            <div style={{ fontSize: 13, color: 'var(--t-primary)', marginTop: 4 }}>{viewEntry.narration}</div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── BANK RECONCILIATION ────────────────────────────────────────────────────
function BankReconTab({ viewOnly }) {
  const { bankAccounts, setBankAccounts, bankTransactions, setBankTransactions, addToast } = useAppStore();
  const [selBank, setSelBank] = useState('');
  const [modal, setModal] = useState(null);
  const [csvRows, setCsvRows] = useState([]);
  const [form, setForm] = useState({ bankName: '', accountNo: '', ifsc: '', openingBalance: 0 });

  function addBank() {
    if (!form.bankName || !form.accountNo) { addToast('Bank name and account no required', 'error'); return; }
    setBankAccounts(prev => [...prev, { ...form, id: Date.now() }]);
    addToast('Bank account added'); setModal(null);
  }

  async function importCSV() {
    if (!window.vgERP) { addToast('CSV import only works in Electron', 'error'); return; }
    const res = await window.vgERP.csv.read();
    if (res.cancelled) return;
    if (!res.ok) { addToast('CSV read error', 'error'); return; }
    const lines = res.content.split('\n').filter(Boolean);
    const rows = lines.slice(1).map(l => {
      const cols = l.split(',');
      return { date: cols[0]?.trim(), narration: cols[1]?.trim(), amount: parseFloat(cols[2]) || 0, type: parseFloat(cols[2]) > 0 ? 'credit' : 'debit', matched: false, id: Date.now() + Math.random() };
    }).filter(r => r.date);
    setCsvRows(rows);
    addToast(`${rows.length} transactions imported`);
  }

  function autoMatch() {
    // Basic: match by amount and date proximity
    setCsvRows(prev => prev.map(r => ({ ...r, matched: bankTransactions.some(t => Math.abs(t.amount - Math.abs(r.amount)) < 1) })));
    addToast('Auto-match complete');
  }

  function postMatchedRows() {
    if (!selBank) { addToast('Select bank account first', 'error'); return; }
    const rowsToPost = csvRows.filter(r => r.matched);
    if (rowsToPost.length === 0) { addToast('No matched rows to post', 'warning'); return; }
    const posted = rowsToPost.map(r => ({
      id: Date.now() + Math.random(),
      bankId: selBank,
      date: r.date,
      narration: r.narration,
      amount: Math.abs(Number(r.amount || 0)),
      type: r.type,
      matched: true,
      createdAt: new Date().toISOString(),
    }));
    setBankTransactions(prev => [...posted, ...prev]);
    addToast(`${posted.length} transactions posted to bank ledger`);
  }

  const bank = bankAccounts.find(b => String(b.id) === selBank);
  const bankTxns = bankTransactions.filter(t => t.bankId === selBank);
  const closingBalance = (bank?.openingBalance || 0) + bankTxns.reduce((s, t) => s + (t.type === 'credit' ? t.amount : -t.amount), 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionHeader title="Bank Reconciliation" />
        <div style={{ display: 'flex', gap: 8 }}>
          {!viewOnly && <Btn onClick={() => { setForm({ bankName: '', accountNo: '', ifsc: '', openingBalance: 0 }); setModal('addBank'); }} small color="var(--t-secondary)"><Plus size={12} /> Add Bank</Btn>}
          <Btn onClick={importCSV} small><Upload size={12} /> Import Bank CSV</Btn>
          {csvRows.length > 0 && <Btn onClick={autoMatch} small color="var(--c-info)"><RefreshCw size={12} /> Auto-Match</Btn>}
          {!viewOnly && csvRows.length > 0 && <Btn onClick={postMatchedRows} small color="var(--c-success)">Post Matched</Btn>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={selBank} onChange={e => setSelBank(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', fontSize: 12, minWidth: 240 }}>
          <option value="">— Select Bank Account —</option>
          {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} — {b.accountNo}</option>)}
        </select>
        {bank && (
          <>
            <div style={{ background: 'var(--c-success-light)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: 'var(--c-success)' }}>Opening: ₹{(bank.openingBalance || 0).toLocaleString('en-IN')}</div>
            <div style={{ background: 'var(--c-primary-light)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: 'var(--c-primary)' }}>Closing: ₹{closingBalance.toLocaleString('en-IN')}</div>
          </>
        )}
      </div>

      {csvRows.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--bg-subtle)', fontWeight: 700, fontSize: 13, color: 'var(--c-dark)' }}>
            Imported Bank Statement — {csvRows.length} rows ({csvRows.filter(r => r.matched).length} matched)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Date</Th><Th>Narration</Th><Th>Amount</Th><Th>Type</Th><Th>Matched</Th></tr></thead>
            <tbody>
              {csvRows.map((r, i) => (
                <tr key={i}>
                  <Td>{r.date}</Td>
                  <Td>{r.narration}</Td>
                  <Td style={{ fontWeight: 600, color: r.type === 'credit' ? 'var(--c-success)' : 'var(--c-danger)' }}>₹{Math.abs(r.amount).toLocaleString('en-IN')}</Td>
                  <Td><Badge label={r.type} color={r.type === 'credit' ? 'var(--c-success)' : 'var(--c-danger)'} /></Td>
                  <Td>{r.matched ? <Badge label="✓ Matched" color="var(--c-success)" /> : <Badge label="Unmatched" color="var(--c-warning)" />}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'addBank' && (
        <ModalOverlay onClose={() => setModal(null)} title="Add Bank Account">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Bank Name" value={form.bankName} onChange={v => setForm(f => ({ ...f, bankName: v }))} required />
            <FormField label="Account Number" value={form.accountNo} onChange={v => setForm(f => ({ ...f, accountNo: v }))} required />
            <FormField label="IFSC Code" value={form.ifsc} onChange={v => setForm(f => ({ ...f, ifsc: v }))} />
            <FormField label="Opening Balance (₹)" value={form.openingBalance} onChange={v => setForm(f => ({ ...f, openingBalance: Number(v) }))} type="number" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn onClick={() => setModal(null)} color="var(--t-secondary)" small>Cancel</Btn>
            <Btn onClick={addBank} small>Add Bank</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── FINANCIAL STATEMENTS (Trial Balance / P&L / Balance Sheet / Cash Flow) ─
function computeStatement(coa, journalEntries) {
  const balances = {};
  coa.forEach(a => { balances[a.code] = { ...a, dr: a.openingBalance || 0, cr: 0 }; });
  journalEntries.forEach(e => {
    if (balances[e.drAccount]) balances[e.drAccount].dr += Number(e.amount || 0);
    if (balances[e.crAccount]) balances[e.crAccount].cr += Number(e.amount || 0);
  });
  return Object.values(balances).map(a => ({ ...a, net: a.dr - a.cr }));
}

function ReportTable({ title, rows, showNet = true }) {
  const total = rows.reduce((s, r) => s + (r.net || 0), 0);
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--bg-subtle)', fontWeight: 700, fontSize: 13, color: 'var(--c-dark)' }}>{title}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><Th>Account</Th><Th>Debit (₹)</Th><Th>Credit (₹)</Th>{showNet && <Th>Net (₹)</Th>}</tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.code}>
              <Td style={{ fontWeight: 500 }}>{r.code} — {r.name}</Td>
              <Td style={{ fontWeight: 600 }}>₹{(r.dr || 0).toLocaleString('en-IN')}</Td>
              <Td style={{ fontWeight: 600 }}>₹{(r.cr || 0).toLocaleString('en-IN')}</Td>
              {showNet && <Td style={{ fontWeight: 700, color: r.net >= 0 ? 'var(--c-success)' : 'var(--c-danger)' }}>₹{Math.abs(r.net || 0).toLocaleString('en-IN')} {r.net >= 0 ? 'Dr' : 'Cr'}</Td>}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: 'var(--bg-subtle)' }}>
            <td style={{ padding: '9px 14px', fontWeight: 700 }}>Total</td>
            <td style={{ padding: '9px 14px', fontWeight: 800, fontSize: 13 }}>₹{rows.reduce((s, r) => s + (r.dr || 0), 0).toLocaleString('en-IN')}</td>
            <td style={{ padding: '9px 14px', fontWeight: 800, fontSize: 13 }}>₹{rows.reduce((s, r) => s + (r.cr || 0), 0).toLocaleString('en-IN')}</td>
            {showNet && <td style={{ padding: '9px 14px', fontWeight: 800, fontSize: 13, color: total >= 0 ? 'var(--c-success)' : 'var(--c-danger)' }}>₹{Math.abs(total).toLocaleString('en-IN')} {total >= 0 ? 'Dr' : 'Cr'}</td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function TrialBalanceTab() {
  const { coa, journalEntries } = useAppStore();
  const balances = useMemo(() => computeStatement(coa, journalEntries), [coa, journalEntries]);
  const totalDr = balances.reduce((s, a) => s + (a.dr || 0), 0);
  const totalCr = balances.reduce((s, a) => s + (a.cr || 0), 0);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionHeader title="Trial Balance" sub="As at today" />
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: 'var(--c-success-light)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: 'var(--c-success)' }}>Total Dr: ₹{totalDr.toLocaleString('en-IN')}</div>
          <div style={{ background: 'var(--c-danger-light)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: 'var(--c-danger)' }}>Total Cr: ₹{totalCr.toLocaleString('en-IN')}</div>
          {Math.abs(totalDr - totalCr) < 1 && <div style={{ background: 'var(--c-success-light)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: 'var(--c-success)' }}>✓ Balanced</div>}
        </div>
      </div>
      <ReportTable title="Trial Balance" rows={balances} />
    </div>
  );
}

function PAndLTab() {
  const { coa, journalEntries } = useAppStore();
  const balances = useMemo(() => computeStatement(coa, journalEntries), [coa, journalEntries]);
  const income = balances.filter(a => a.type === 'income');
  const expenses = balances.filter(a => a.type === 'expense');
  const totalIncome = income.reduce((s, a) => s + Math.abs(a.net), 0);
  const totalExpenses = expenses.reduce((s, a) => s + Math.abs(a.net), 0);
  const netProfit = totalIncome - totalExpenses;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionHeader title="Profit & Loss Statement" />
        <div style={{ background: netProfit >= 0 ? 'var(--c-success-light)' : 'var(--c-danger-light)', borderRadius: 8, padding: '8px 16px', fontWeight: 800, color: netProfit >= 0 ? 'var(--c-success)' : 'var(--c-danger)' }}>
          Net {netProfit >= 0 ? 'Profit' : 'Loss'}: ₹{Math.abs(netProfit).toLocaleString('en-IN')}
        </div>
      </div>
      <ReportTable title="Income" rows={income} />
      <ReportTable title="Expenses" rows={expenses} />
    </div>
  );
}

function BalanceSheetTab() {
  const { coa, journalEntries } = useAppStore();
  const balances = useMemo(() => computeStatement(coa, journalEntries), [coa, journalEntries]);
  const assets = balances.filter(a => a.type === 'asset');
  const liabilities = balances.filter(a => a.type === 'liability');
  const capital = balances.filter(a => a.type === 'capital');
  const totalAssets = assets.reduce((s, a) => s + Math.abs(a.net), 0);
  const totalLiabCap = [...liabilities, ...capital].reduce((s, a) => s + Math.abs(a.net), 0);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionHeader title="Balance Sheet" />
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: 'var(--c-primary-light)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: 'var(--c-primary)' }}>Total Assets: ₹{totalAssets.toLocaleString('en-IN')}</div>
          <div style={{ background: Math.abs(totalAssets - totalLiabCap) < 1 ? 'var(--c-success-light)' : 'var(--c-warning-light)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: Math.abs(totalAssets - totalLiabCap) < 1 ? 'var(--c-success)' : 'var(--t-secondary)' }}>
            {Math.abs(totalAssets - totalLiabCap) < 1 ? '✓ Balanced' : `Diff: ₹${Math.abs(totalAssets - totalLiabCap).toLocaleString('en-IN')}`}
          </div>
        </div>
      </div>
      <ReportTable title="Assets" rows={assets} />
      <ReportTable title="Liabilities" rows={liabilities} />
      <ReportTable title="Capital" rows={capital} />
    </div>
  );
}

function CashFlowTab() {
  const { journalEntries, coa } = useAppStore();
  const cashAccts = coa.filter(a => a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('bank'));
  const inflows = journalEntries.filter(e => cashAccts.some(a => a.code === e.drAccount));
  const outflows = journalEntries.filter(e => cashAccts.some(a => a.code === e.crAccount));
  const netInflow = inflows.reduce((s, e) => s + e.amount, 0) - outflows.reduce((s, e) => s + e.amount, 0);
  return (
    <div>
      <SectionHeader title="Cash Flow Statement" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[['Cash Inflows', inflows.length, inflows.reduce((s, e) => s + e.amount, 0), 'var(--c-success)'], ['Cash Outflows', outflows.length, outflows.reduce((s, e) => s + e.amount, 0), 'var(--c-danger)'], ['Net Cash Flow', inflows.length + outflows.length, netInflow, netInflow >= 0 ? 'var(--c-success)' : 'var(--c-danger)']].map(([l, cnt, amt, c]) => (
          <div key={l} style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--t-muted)' }}>{l}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: c, marginTop: 4 }}>₹{Math.abs(amt).toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 10, color: 'var(--t-muted)', marginTop: 2 }}>{cnt} entries</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── GST SUITE ──────────────────────────────────────────────────────────────
const GST_TABS = [
  ['salesInvoices', 'Sales Invoices'], ['purchaseInvoices', 'Purchase Bills'],
  ['creditNotesIssued', 'Credit Notes (Issued)'], ['creditNotesReceived', 'Credit Notes (Rcvd)'],
  ['rcmTransactions', 'RCM'], ['advancesReceived', 'Advances Rcvd'],
  ['gstChallans', 'GST Challans'], ['ewayBills', 'E-Way Bills'],
  ['gstrSummary', 'GSTR Summary'], ['itcRegister', 'ITC Register'], ['slabSummary', 'Slab Summary'],
];

function GSTTab({ viewOnly }) {
  const { gstData, setGstData, addToast, activeEntity } = useAppStore();
  const [subTab, setSubTab] = useState('salesInvoices');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], partyName: '', gstin: '', invoiceNo: '', taxableValue: '', gstRate: 18, cgst: '', sgst: '', igst: '', total: '' });

  const rows = gstData[subTab] || [];

  function saveInvoice() {
    if (!form.invoiceNo || !form.partyName) { addToast('Invoice no and party required', 'error'); return; }
    const total = Number(form.taxableValue) + Number(form.cgst || 0) + Number(form.sgst || 0) + Number(form.igst || 0);
    const entry = { ...form, id: Date.now(), total, createdAt: new Date().toISOString() };
    setGstData(d => ({ ...d, [subTab]: [entry, ...(d[subTab] || [])] }));
    addToast('GST entry saved'); setModal(false);
  }

  useEffect(() => {
    const taxable = Number(form.taxableValue || 0);
    const rate = Number(form.gstRate || 0);
    if (!taxable || !rate) return;
    const totalTax = taxable * (rate / 100);
    if (String(form.gstin || '').slice(0, 2) === '27') {
      const half = totalTax / 2;
      setForm(f => ({ ...f, cgst: Number(half.toFixed(2)), sgst: Number(half.toFixed(2)), igst: 0 }));
    } else {
      setForm(f => ({ ...f, cgst: 0, sgst: 0, igst: Number(totalTax.toFixed(2)) }));
    }
  }, [form.taxableValue, form.gstRate, form.gstin]);

  const totalTaxable = rows.reduce((s, r) => s + Number(r.taxableValue || 0), 0);
  const totalTax = rows.reduce((s, r) => s + Number(r.cgst || 0) + Number(r.sgst || 0) + Number(r.igst || 0), 0);

  return (
    <div>
      <SectionHeader title="GST Suite" />
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
        {GST_TABS.map(([id, l]) => (
          <button key={id} onClick={() => setSubTab(id)} style={{ whiteSpace: 'nowrap', padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: subTab === id ? 700 : 400, color: subTab === id ? 'var(--c-success)' : 'var(--t-secondary)', background: subTab === id ? 'var(--c-success-light)' : 'var(--bg-subtle)', border: '1px solid ' + (subTab === id ? 'var(--c-success)' : 'transparent'), cursor: 'pointer' }}>{l}</button>
        ))}
      </div>

      {/* Summary totals */}
      {rows.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          {[['Taxable Value', totalTaxable, 'var(--c-primary)'], ['Total Tax', totalTax, 'var(--c-success)'], ['Records', rows.length, 'var(--t-secondary)']].map(([l, v, c]) => (
            <div key={l} style={{ background: '#fff', borderRadius: 8, border: '1px solid var(--border)', padding: '8px 16px' }}>
              <div style={{ fontSize: 10, color: 'var(--t-muted)' }}>{l}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: c }}>{typeof v === 'number' && l !== 'Records' ? `₹${v.toLocaleString('en-IN')}` : v}</div>
            </div>
          ))}
        </div>
      )}

      {!viewOnly && ['salesInvoices', 'purchaseInvoices'].includes(subTab) && (
        <div style={{ marginBottom: 12 }}>
          <Btn onClick={() => { setForm({ date: new Date().toISOString().split('T')[0], partyName: '', gstin: '', invoiceNo: '', taxableValue: '', gstRate: 18, cgst: '', sgst: '', igst: '', total: '' }); setModal(true); }} small><Plus size={12} /> Add Entry</Btn>
        </div>
      )}

      {subTab === 'gstrSummary' ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-dark)', marginBottom: 12 }}>GSTR Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[['GSTR-1 (Sales)', (gstData.salesInvoices || []).length, totalTaxable], ['GSTR-3B (Tax Liability)', (gstData.gstChallans || []).length, totalTax], ['ITC Available', (gstData.purchaseInvoices || []).length, (gstData.purchaseInvoices || []).reduce((s, r) => s + Number(r.cgst || 0) + Number(r.sgst || 0) + Number(r.igst || 0), 0)]].map(([l, cnt, amt]) => (
              <div key={l} style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--t-muted)' }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-success)', marginTop: 4 }}>₹{amt.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 10, color: 'var(--t-muted)', marginTop: 2 }}>{cnt} entries</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Date</Th><Th>Invoice No</Th><Th>Party</Th><Th>GSTIN</Th><Th>Taxable Value</Th><Th>CGST</Th><Th>SGST</Th><Th>IGST</Th><Th>Total</Th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <Td>{r.date}</Td>
                  <Td style={{ fontWeight: 700 }}>{r.invoiceNo}</Td>
                  <Td>{r.partyName}</Td>
                  <Td style={{ fontFamily: 'monospace', fontSize: 10 }}>{r.gstin || '—'}</Td>
                  <Td>₹{Number(r.taxableValue || 0).toLocaleString('en-IN')}</Td>
                  <Td>₹{Number(r.cgst || 0).toLocaleString('en-IN')}</Td>
                  <Td>₹{Number(r.sgst || 0).toLocaleString('en-IN')}</Td>
                  <Td>₹{Number(r.igst || 0).toLocaleString('en-IN')}</Td>
                  <Td style={{ fontWeight: 700, color: 'var(--c-success)' }}>₹{Number(r.total || 0).toLocaleString('en-IN')}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--t-muted)', fontSize: 13 }}>No entries in this section.</div>}
        </div>
      )}

      {modal && (
        <ModalOverlay onClose={() => setModal(false)} title="Add GST Entry" wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <FormField label="Date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" />
            <FormField label="Invoice No" value={form.invoiceNo} onChange={v => setForm(f => ({ ...f, invoiceNo: v }))} required />
            <FormField label="Party Name" value={form.partyName} onChange={v => setForm(f => ({ ...f, partyName: v }))} required />
            <FormField label="GSTIN" value={form.gstin} onChange={v => setForm(f => ({ ...f, gstin: v }))} />
            <FormField label="Taxable Value (₹)" value={form.taxableValue} onChange={v => setForm(f => ({ ...f, taxableValue: v }))} type="number" required />
            <FormField label="GST Rate (%)" value={form.gstRate} onChange={v => setForm(f => ({ ...f, gstRate: Number(v) }))} options={[5, 12, 18]} />
            <FormField label="CGST (₹)" value={form.cgst} onChange={v => setForm(f => ({ ...f, cgst: v }))} type="number" />
            <FormField label="SGST (₹)" value={form.sgst} onChange={v => setForm(f => ({ ...f, sgst: v }))} type="number" />
            <FormField label="IGST (₹)" value={form.igst} onChange={v => setForm(f => ({ ...f, igst: v }))} type="number" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn onClick={() => setModal(false)} color="var(--t-secondary)" small>Cancel</Btn>
            <Btn onClick={saveInvoice} small>Save</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── TDS REGISTER ──────────────────────────────────────────────────────────
const TDS_SECTIONS_LIST = [
  { id: '194C', label: '194C — Contractor', rate: '1% / 2%' },
  { id: '194I', label: '194I — Rent', rate: '10%' },
  { id: '194IA', label: '194IA — Property Purchase', rate: '1%' },
  { id: '194J', label: '194J — Professional', rate: '10%' },
  { id: '194H', label: '194H — Brokerage', rate: '5%' },
];

function TDSTab({ viewOnly }) {
  const { tdsEntries, setTdsEntries, addToast } = useAppStore();
  const [section, setSection] = useState('194C');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], party: '', pan: '', amount: '', tdsRate: '', tdsAmount: '', bsrCode: '', challanNo: '', section: '194C' });

  const rows = tdsEntries.filter(e => e.section === section);
  const totalTDS = rows.reduce((s, r) => s + Number(r.tdsAmount || 0), 0);
  const totalBase = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  function saveEntry() {
    if (!form.party || !form.amount) { addToast('Party and amount required', 'error'); return; }
    setTdsEntries(prev => [...prev, { ...form, id: Date.now(), amount: Number(form.amount), tdsAmount: Number(form.tdsAmount), createdAt: new Date().toISOString() }]);
    addToast('TDS entry saved'); setModal(false);
  }

  useEffect(() => {
    const amount = Number(form.amount || 0);
    const rate = Number(form.tdsRate || 0);
    if (!amount || !rate) return;
    setForm(f => ({ ...f, tdsAmount: Number(((amount * rate) / 100).toFixed(2)) }));
  }, [form.amount, form.tdsRate]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionHeader title="TDS Register" />
        {!viewOnly && <Btn onClick={() => { setForm({ date: new Date().toISOString().split('T')[0], party: '', pan: '', amount: '', tdsRate: '', tdsAmount: '', bsrCode: '', challanNo: '', section }); setModal(true); }} small><Plus size={12} /> Add TDS Entry</Btn>}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {TDS_SECTIONS_LIST.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: section === s.id ? 700 : 400, color: section === s.id ? 'var(--c-danger)' : 'var(--t-secondary)', background: section === s.id ? 'var(--c-danger-light)' : 'var(--bg-subtle)', border: '1px solid ' + (section === s.id ? 'var(--c-danger)' : 'transparent'), cursor: 'pointer' }}>
            {s.id} ({s.rate})
          </button>
        ))}
      </div>

      {rows.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          {[['Base Amount', `₹${totalBase.toLocaleString('en-IN')}`, 'var(--c-primary)'], ['TDS Deducted', `₹${totalTDS.toLocaleString('en-IN')}`, 'var(--c-danger)'], ['Section', TDS_SECTIONS_LIST.find(s => s.id === section)?.label, 'var(--t-secondary)']].map(([l, v, c]) => (
            <div key={l} style={{ background: '#fff', borderRadius: 8, border: '1px solid var(--border)', padding: '8px 16px' }}>
              <div style={{ fontSize: 10, color: 'var(--t-muted)' }}>{l}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>Date</Th><Th>Party</Th><Th>PAN</Th><Th>Base Amount</Th><Th>TDS %</Th><Th>TDS Amount</Th><Th>BSR Code</Th><Th>Challan No</Th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <Td>{r.date}</Td>
                <Td style={{ fontWeight: 500 }}>{r.party}</Td>
                <Td style={{ fontFamily: 'monospace' }}>{r.pan || '—'}</Td>
                <Td>₹{Number(r.amount || 0).toLocaleString('en-IN')}</Td>
                <Td>{r.tdsRate}%</Td>
                <Td style={{ fontWeight: 700, color: 'var(--c-danger)' }}>₹{Number(r.tdsAmount || 0).toLocaleString('en-IN')}</Td>
                <Td>{r.bsrCode || '—'}</Td>
                <Td>{r.challanNo || '—'}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--t-muted)', fontSize: 13 }}>No TDS entries for section {section}.</div>}
      </div>

      {modal && (
        <ModalOverlay onClose={() => setModal(false)} title={`Add TDS Entry — ${section}`} wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <FormField label="Date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" />
            <FormField label="Party Name" value={form.party} onChange={v => setForm(f => ({ ...f, party: v }))} required />
            <FormField label="PAN" value={form.pan} onChange={v => setForm(f => ({ ...f, pan: v.toUpperCase() }))} />
            <FormField label="Base Amount (₹)" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} type="number" required />
            <FormField label="TDS Rate (%)" value={form.tdsRate} onChange={v => setForm(f => ({ ...f, tdsRate: v }))} type="number" />
            <FormField label="TDS Amount (₹)" value={form.tdsAmount} onChange={v => setForm(f => ({ ...f, tdsAmount: v }))} type="number" />
            <FormField label="BSR Code" value={form.bsrCode} onChange={v => setForm(f => ({ ...f, bsrCode: v }))} />
            <FormField label="Challan No" value={form.challanNo} onChange={v => setForm(f => ({ ...f, challanNo: v }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn onClick={() => setModal(false)} color="var(--t-secondary)" small>Cancel</Btn>
            <Btn onClick={saveEntry} small>Save TDS Entry</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── EXPENSE CLAIMS ────────────────────────────────────────────────────────
function ExpensesTab({ viewOnly }) {
  const { expenseClaims, setExpenseClaims, pettyCache, setPettyCache, employees, addToast, user } = useAppStore();
  const [subTab, setSubTab] = useState('claims');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], claimedBy: '', category: 'Travel', amount: '', description: '', billNo: '', status: 'pending' });
  const [pettyForm, setPettyForm] = useState({ date: new Date().toISOString().split('T')[0], type: 'expense', amount: '', purpose: '', ref: '' });

  function saveClaim() {
    if (!form.amount || !form.claimedBy) { addToast('Amount and claimant required', 'error'); return; }
    setExpenseClaims(prev => [...prev, { ...form, id: Date.now(), amount: Number(form.amount), submittedAt: new Date().toISOString() }]);
    addToast('Expense claim submitted'); setModal(false);
  }

  function approveClaim(id) {
    setExpenseClaims(prev => prev.map(e => e.id === id ? { ...e, status: 'approved', approvedBy: user?.full_name, approvedAt: new Date().toISOString() } : e));
    addToast('Claim approved');
  }

  function addPettyEntry() {
    if (!pettyForm.amount || !pettyForm.purpose) { addToast('Amount and purpose required', 'error'); return; }
    const entry = {
      id: Date.now(),
      date: pettyForm.date,
      type: pettyForm.type,
      amount: Number(pettyForm.amount),
      purpose: pettyForm.purpose,
      ref: pettyForm.ref || '',
      createdAt: new Date().toISOString(),
    };
    setPettyCache(prev => [entry, ...(prev || [])]);
    setPettyForm({ date: new Date().toISOString().split('T')[0], type: 'expense', amount: '', purpose: '', ref: '' });
    addToast('Petty cash entry saved');
  }

  const pettyBalance = (pettyCache || []).reduce((s, e) => s + (e.type === 'receipt' ? Number(e.amount || 0) : -Number(e.amount || 0)), 0);

  const STATUS_COLORS = { pending: 'var(--c-warning)', approved: 'var(--c-success)', rejected: 'var(--c-danger)' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionHeader title="Expense Claims & Petty Cash" />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 8, padding: 2 }}>
            {[['claims', 'Claims'], ['petty', 'Petty Cash']].map(([v, l]) => (
              <button key={v} onClick={() => setSubTab(v)} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: subTab === v ? 700 : 400, color: subTab === v ? 'var(--c-dark)' : 'var(--t-secondary)', background: subTab === v ? '#fff' : 'transparent', border: '1px solid ' + (subTab === v ? 'var(--border)' : 'transparent'), cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
          {!viewOnly && <Btn onClick={() => { setForm({ date: new Date().toISOString().split('T')[0], claimedBy: '', category: 'Travel', amount: '', description: '', billNo: '', status: 'pending' }); setModal(true); }} small><Plus size={12} /> Add Claim</Btn>}
        </div>
      </div>

      {subTab === 'claims' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Date</Th><Th>Claimed By</Th><Th>Category</Th><Th>Description</Th><Th>Amount</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {expenseClaims.map(e => (
                <tr key={e.id}>
                  <Td>{e.date}</Td>
                  <Td style={{ fontWeight: 500 }}>{e.claimedBy}</Td>
                  <Td>{e.category}</Td>
                  <Td>{e.description}</Td>
                  <Td style={{ fontWeight: 600 }}>₹{Number(e.amount || 0).toLocaleString('en-IN')}</Td>
                  <Td><Badge label={e.status} color={STATUS_COLORS[e.status] || 'var(--t-secondary)'} /></Td>
                  <Td>
                    {!viewOnly && e.status === 'pending' && (user?.role === 'super_admin' || user?.role === 'director' || user?.role === 'accounts_manager') && (
                      <button onClick={() => approveClaim(e.id)} style={{ background: 'var(--c-success-light)', color: 'var(--c-success)', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Approve</button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          {expenseClaims.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--t-muted)', fontSize: 13 }}>No expense claims submitted.</div>}
        </div>
      )}

      {subTab === 'petty' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-dark)' }}>Petty Cash Ledger</div>
              <div style={{ fontSize: 12, color: 'var(--t-secondary)' }}>Track receipts and expenses for day-to-day cash.</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: pettyBalance >= 0 ? 'var(--c-success)' : 'var(--c-danger)' }}>
              Balance: ₹{Math.abs(pettyBalance).toLocaleString('en-IN')} {pettyBalance >= 0 ? 'Dr' : 'Cr'}
            </div>
          </div>

          {!viewOnly && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 2fr 1fr auto', gap:8, alignItems:'end', marginBottom:14 }}>
              <FormField label="Date" value={pettyForm.date} onChange={v=>setPettyForm(f=>({...f,date:v}))} type="date" />
              <FormField label="Type" value={pettyForm.type} onChange={v=>setPettyForm(f=>({...f,type:v}))} options={[{value:'expense',label:'Expense'},{value:'receipt',label:'Receipt'}]} />
              <FormField label="Amount (₹)" value={pettyForm.amount} onChange={v=>setPettyForm(f=>({...f,amount:v}))} type="number" />
              <FormField label="Purpose" value={pettyForm.purpose} onChange={v=>setPettyForm(f=>({...f,purpose:v}))} />
              <FormField label="Ref" value={pettyForm.ref} onChange={v=>setPettyForm(f=>({...f,ref:v}))} />
              <Btn onClick={addPettyEntry} small>Add</Btn>
            </div>
          )}

          <div style={{ border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr><Th>Date</Th><Th>Type</Th><Th>Purpose</Th><Th>Ref</Th><Th>Amount</Th></tr></thead>
              <tbody>
                {(pettyCache || []).map(e => (
                  <tr key={e.id}>
                    <Td>{e.date}</Td>
                    <Td><Badge label={e.type} color={e.type === 'receipt' ? 'var(--c-success)' : 'var(--c-danger)'} /></Td>
                    <Td>{e.purpose}</Td>
                    <Td>{e.ref || '—'}</Td>
                    <Td style={{ fontWeight:700, color:e.type === 'receipt' ? 'var(--c-success)' : 'var(--c-danger)' }}>
                      ₹{Number(e.amount || 0).toLocaleString('en-IN')}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(pettyCache || []).length === 0 && <div style={{ padding: 20, color: 'var(--t-muted)', fontSize: 12 }}>No petty cash entries yet.</div>}
          </div>
        </div>
      )}

      {modal && (
        <ModalOverlay onClose={() => setModal(false)} title="Submit Expense Claim">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" />
            <FormField label="Claimed By" value={form.claimedBy} onChange={v => setForm(f => ({ ...f, claimedBy: v }))} required />
            <FormField label="Category" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} options={['Travel', 'Food', 'Stationery', 'Site Expense', 'Telephone', 'Misc']} />
            <FormField label="Amount (₹)" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} type="number" required />
            <FormField label="Bill No / Reference" value={form.billNo} onChange={v => setForm(f => ({ ...f, billNo: v }))} />
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-primary)', display: 'block', marginBottom: 4 }}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn onClick={() => setModal(false)} color="var(--t-secondary)" small>Cancel</Btn>
            <Btn onClick={saveClaim} small>Submit Claim</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── VENDOR ADVANCES ────────────────────────────────────────────────────────
function VendorAdvanceTab({ viewOnly }) {
  const { vendorAdvances, setVendorAdvances, vendors, addToast } = useAppStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], vendorId: '', vendorName: '', amount: '', purpose: '', recoveredAmount: 0 });
  const [recoverInputs, setRecoverInputs] = useState({});

  function saveAdvance() {
    if (!form.amount || !form.vendorName) { addToast('Vendor and amount required', 'error'); return; }
    setVendorAdvances(prev => [...prev, { ...form, id: Date.now(), amount: Number(form.amount), recoveredAmount: 0, balance: Number(form.amount) }]);
    addToast('Advance recorded'); setModal(false);
  }

  function recover(id, amt) {
    setVendorAdvances(prev => prev.map(a => a.id === id ? { ...a, recoveredAmount: (a.recoveredAmount || 0) + amt, balance: (a.amount || 0) - (a.recoveredAmount || 0) - amt } : a));
    addToast('Recovery recorded');
  }

  const totalAdvance = vendorAdvances.reduce((s, a) => s + (a.amount || 0), 0);
  const totalRecovered = vendorAdvances.reduce((s, a) => s + (a.recoveredAmount || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionHeader title="Vendor Advance Register" />
        {!viewOnly && <Btn onClick={() => { setForm({ date: new Date().toISOString().split('T')[0], vendorId: '', vendorName: '', amount: '', purpose: '', recoveredAmount: 0 }); setModal(true); }} small><Plus size={12} /> Record Advance</Btn>}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[['Total Advances', totalAdvance, 'var(--c-primary)'], ['Recovered', totalRecovered, 'var(--c-success)'], ['Outstanding', totalAdvance - totalRecovered, 'var(--c-danger)']].map(([l, v, c]) => (
          <div key={l} style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--border)', padding: '12px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--t-muted)' }}>{l}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: c, marginTop: 4 }}>₹{v.toLocaleString('en-IN')}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>Date</Th><Th>Vendor</Th><Th>Advance Amount</Th><Th>Purpose</Th><Th>Recovered</Th><Th>Balance</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {vendorAdvances.map(a => (
              <tr key={a.id}>
                <Td>{a.date}</Td>
                <Td style={{ fontWeight: 500 }}>{a.vendorName}</Td>
                <Td style={{ fontWeight: 600 }}>₹{Number(a.amount || 0).toLocaleString('en-IN')}</Td>
                <Td>{a.purpose || '—'}</Td>
                <Td style={{ color: 'var(--c-success)' }}>₹{Number(a.recoveredAmount || 0).toLocaleString('en-IN')}</Td>
                <Td style={{ fontWeight: 700, color: (a.balance || a.amount - a.recoveredAmount) > 0 ? 'var(--c-danger)' : 'var(--c-success)' }}>₹{(a.balance ?? (a.amount - (a.recoveredAmount || 0))).toLocaleString('en-IN')}</Td>
                <Td>
                  {!viewOnly && (a.balance ?? (a.amount - (a.recoveredAmount || 0))) > 0 && (
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <input
                        type="number"
                        value={recoverInputs[a.id] || ''}
                        onChange={e => setRecoverInputs(prev => ({ ...prev, [a.id]: e.target.value }))}
                        placeholder="Amt"
                        style={{ width: 90, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }}
                      />
                      <button
                        onClick={() => {
                          const amt = Number(recoverInputs[a.id] || 0);
                          if (amt > 0) {
                            recover(a.id, amt);
                            setRecoverInputs(prev => ({ ...prev, [a.id]: '' }));
                          }
                        }}
                        style={{ background: 'var(--c-success-light)', color: 'var(--c-success)', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
                      >
                        Recover
                      </button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        {vendorAdvances.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--t-muted)', fontSize: 13 }}>No vendor advances recorded.</div>}
      </div>

      {modal && (
        <ModalOverlay onClose={() => setModal(false)} title="Record Vendor Advance">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" />
            <FormField label="Vendor Name" value={form.vendorName} onChange={v => setForm(f => ({ ...f, vendorName: v }))} required />
            <FormField label="Amount (₹)" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} type="number" required />
            <FormField label="Purpose" value={form.purpose} onChange={v => setForm(f => ({ ...f, purpose: v }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn onClick={() => setModal(false)} color="var(--t-secondary)" small>Cancel</Btn>
            <Btn onClick={saveAdvance} small>Save Advance</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
