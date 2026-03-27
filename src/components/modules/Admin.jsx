import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Plus, Search, Download, Upload, RefreshCw, X, Shield, Database, Bell, AlertCircle } from 'lucide-react';
import ConfirmDialog from '../ui/ConfirmDialog';
import PromptDialog from '../ui/PromptDialog';
import {
  moduleBtnStyle,
  ModuleModalOverlay as ThemeModalOverlay,
  ModuleTableTh as ThemeTh,
  ModuleTableTd as ThemeTd,
  formLabelStyle,
  fieldStyle,
  onFieldFocus,
  onFieldBlur,
} from '../theme/moduleUi.jsx';

export default function AdminModule({ viewOnly }) {
  const { activeSubTab, user } = useAppStore();
  const tab = activeSubTab || 'entities';

  if (user?.role !== 'super_admin' && user?.role !== 'director') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--c-dark)' }}>Admin Access Only</div>
          <div style={{ fontSize: 13, color: 'var(--t-secondary)', marginTop: 6 }}>Contact your Super Admin for access.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {tab === 'entities'      && <EntitiesUsersTab />}
      {tab === 'modulelocks'   && <ModuleLocksTab />}
      {tab === 'mis'           && <MISTab />}
      {tab === 'auditlog'      && <AuditLogTab />}
      {tab === 'backup'        && <BackupManagerTab />}
      {tab === 'tallyimport'   && <TallyImportTab />}
      {tab === 'notifications' && <NotificationCentreTab />}
    </div>
  );
}

// ── SHARED ─────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, color = 'var(--c-danger)', small, disabled, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={moduleBtnStyle(color, small, disabled, style)}>{children}</button>
);
const Badge = ({ label, color = 'var(--c-danger)' }) => <span style={{ background: color + '18', color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{label}</span>;
function ModalOverlay({ children, onClose, title, wide }) {
  return <ThemeModalOverlay onClose={onClose} title={title} wide={wide}>{children}</ThemeModalOverlay>;
}
function FormField({ label, value, onChange, type = 'text', options }) {
  return (
    <div>
      <label style={formLabelStyle()}>{label}</label>
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
function Th({ children }) { return <ThemeTh>{children}</ThemeTh>; }
function Td({ children, style = {} }) { return <ThemeTd style={style}>{children}</ThemeTd>; }

const ROLE_LABELS = { super_admin: 'Super Admin', director: 'Director', accounts_manager: 'Accounts Manager', sales_executive: 'Sales Executive', hr_manager: 'HR Manager', site_supervisor: 'Site Supervisor', broker: 'Broker', legal_doc_user: 'Legal / Doc User' };
const ALL_ROLES = Object.keys(ROLE_LABELS);

// ── ENTITIES & USERS ──────────────────────────────────────────────────────
function EntitiesUsersTab() {
  const { entities, users, setUsers, addEntity, updateEntity, addToast } = useAppStore();
  const [subTab, setSubTab] = useState('entities');
  const [modal, setModal] = useState(null);
  const [entityForm, setEntityForm] = useState({ code: '', name: '', gstin: '', pan: '', cin_llpin: '', email: '', phone: '', address: '', authorized_signatory: '', designation: 'Director', type: 'pvt_ltd' });
  const [userForm, setUserForm] = useState({ username: '', password: '', full_name: '', role: 'sales_executive', email: '', phone: '', entity_access: [], is_active: true });
  const [editEntity, setEditEntity] = useState(null);
  const [editUser, setEditUser] = useState(null);

  function saveEntity() {
    if (!entityForm.name || !entityForm.code) { addToast('Name and code required', 'error'); return; }
    if (editEntity) { updateEntity({ ...editEntity, ...entityForm }); addToast('Entity updated'); }
    else { addEntity(entityForm); addToast('Entity added'); }
    setModal(null);
  }

  function saveUser() {
    if (!userForm.username || !userForm.full_name) { addToast('Username and name required', 'error'); return; }
    if (editUser) {
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...userForm } : u));
      addToast('User updated');
    } else {
      if (users.find(u => u.username === userForm.username)) { addToast('Username already exists', 'error'); return; }
      setUsers(prev => [...prev, { ...userForm, id: Date.now(), createdAt: new Date().toISOString() }]);
      addToast('User created');
    }
    setModal(null);
  }

  function toggleEntityAccess(entityId) {
    setUserForm(f => {
      const access = f.entity_access.includes(entityId) ? f.entity_access.filter(id => id !== entityId) : [...f.entity_access, entityId];
      return { ...f, entity_access: access };
    });
  }

  const ENTITY_TYPES = [{ value: 'pvt_ltd', label: 'Private Limited' }, { value: 'llp', label: 'LLP' }, { value: 'proprietorship', label: 'Proprietorship' }, { value: 'partnership', label: 'Partnership' }];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-dark)' }}>Entities & Users</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 8, padding: 2 }}>
            {[['entities', `Entities (${entities.length})`], ['users', `Users (${users.length})`]].map(([v, l]) => (
              <button key={v} onClick={() => setSubTab(v)} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: subTab === v ? 700 : 400, color: subTab === v ? 'var(--c-dark)' : 'var(--t-secondary)', background: subTab === v ? '#fff' : 'transparent', border: '1px solid ' + (subTab === v ? 'var(--border)' : 'transparent'), cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
          {subTab === 'entities' && <Btn onClick={() => { setEditEntity(null); setEntityForm({ code: '', name: '', gstin: '', pan: '', cin_llpin: '', email: '', phone: '', address: '', authorized_signatory: '', designation: 'Director', type: 'pvt_ltd' }); setModal('entity'); }} small><Plus size={12} /> Add Entity</Btn>}
          {subTab === 'users' && <Btn onClick={() => { setEditUser(null); setUserForm({ username: '', password: '', full_name: '', role: 'sales_executive', email: '', phone: '', entity_access: [], is_active: true }); setModal('user'); }} small><Plus size={12} /> Add User</Btn>}
        </div>
      </div>

      {subTab === 'entities' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {entities.map(e => (
            <div key={e.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: 'var(--c-dark)', color: 'var(--c-warning)', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4 }}>{e.code}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--c-dark)' }}>{e.name}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--t-muted)', marginTop: 3 }}>{e.cin_llpin || 'CIN/LLPIN not set'}</div>
                </div>
                <Badge label={e.type || 'pvt_ltd'} color="var(--c-info)" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10, fontSize: 11 }}>
                {[['GSTIN', e.gstin || '—'], ['PAN', e.pan || '—'], ['Phone', e.phone || '—'], ['Signatory', e.authorized_signatory || '—']].map(([k, v]) => (
                  <div key={k}><span style={{ color: 'var(--t-muted)' }}>{k}: </span><span style={{ color: 'var(--t-primary)', fontWeight: 500 }}>{v}</span></div>
                ))}
              </div>
              {e.address && <div style={{ fontSize: 10, color: 'var(--t-muted)', marginBottom: 10 }}>{e.address}</div>}
              <button onClick={() => { setEditEntity(e); setEntityForm({ ...e }); setModal('entity'); }} style={{ fontSize: 11, color: 'var(--c-danger)', background: 'none', border: '1px solid var(--c-danger)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Edit</button>
            </div>
          ))}
        </div>
      )}

      {subTab === 'users' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Username</Th><Th>Full Name</Th><Th>Role</Th><Th>Entity Access</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <Td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 11 }}>{u.username}</Td>
                  <Td style={{ fontWeight: 500 }}>{u.full_name}</Td>
                  <Td><Badge label={ROLE_LABELS[u.role] || u.role} color="var(--c-danger)" /></Td>
                  <Td style={{ fontSize: 10 }}>{(u.entity_access || []).map(id => entities.find(e => e.id === id)?.code).filter(Boolean).join(', ') || 'None'}</Td>
                  <Td><Badge label={u.is_active ? 'Active' : 'Inactive'} color={u.is_active ? 'var(--c-success)' : 'var(--t-secondary)'} /></Td>
                  <Td>
                    <button onClick={() => { setEditUser(u); setUserForm({ ...u }); setModal('user'); }} style={{ background: 'var(--c-danger-light)', color: 'var(--c-danger)', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Edit</button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'entity' && (
        <ModalOverlay onClose={() => setModal(null)} title={editEntity ? 'Edit Entity' : 'Add Entity'} wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Entity Code (3-4 chars) *" value={entityForm.code} onChange={v => setEntityForm(f => ({ ...f, code: v.toUpperCase() }))} />
            <FormField label="Entity Name *" value={entityForm.name} onChange={v => setEntityForm(f => ({ ...f, name: v }))} />
            <FormField label="Type" value={entityForm.type} onChange={v => setEntityForm(f => ({ ...f, type: v }))} options={ENTITY_TYPES} />
            <FormField label="CIN / LLPIN" value={entityForm.cin_llpin} onChange={v => setEntityForm(f => ({ ...f, cin_llpin: v }))} />
            <FormField label="GSTIN" value={entityForm.gstin} onChange={v => setEntityForm(f => ({ ...f, gstin: v.toUpperCase() }))} />
            <FormField label="PAN" value={entityForm.pan} onChange={v => setEntityForm(f => ({ ...f, pan: v.toUpperCase() }))} />
            <FormField label="Email" value={entityForm.email} onChange={v => setEntityForm(f => ({ ...f, email: v }))} />
            <FormField label="Phone" value={entityForm.phone} onChange={v => setEntityForm(f => ({ ...f, phone: v }))} />
            <FormField label="Authorized Signatory" value={entityForm.authorized_signatory} onChange={v => setEntityForm(f => ({ ...f, authorized_signatory: v }))} />
            <FormField label="Designation" value={entityForm.designation} onChange={v => setEntityForm(f => ({ ...f, designation: v }))} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-primary)', display: 'block', marginBottom: 4 }}>Address</label>
            <textarea value={entityForm.address || ''} onChange={e => setEntityForm(f => ({ ...f, address: e.target.value }))} rows={2} style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn onClick={() => setModal(null)} color="var(--t-secondary)" small>Cancel</Btn>
            <Btn onClick={saveEntity} small>Save Entity</Btn>
          </div>
        </ModalOverlay>
      )}

      {modal === 'user' && (
        <ModalOverlay onClose={() => setModal(null)} title={editUser ? 'Edit User' : 'Add User'} wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <FormField label="Username *" value={userForm.username} onChange={v => setUserForm(f => ({ ...f, username: v }))} />
            <FormField label="Password" value={userForm.password} onChange={v => setUserForm(f => ({ ...f, password: v }))} type="password" />
            <FormField label="Full Name *" value={userForm.full_name} onChange={v => setUserForm(f => ({ ...f, full_name: v }))} />
            <FormField label="Role" value={userForm.role} onChange={v => setUserForm(f => ({ ...f, role: v }))} options={ALL_ROLES.map(r => ({ value: r, label: ROLE_LABELS[r] }))} />
            <FormField label="Email" value={userForm.email} onChange={v => setUserForm(f => ({ ...f, email: v }))} />
            <FormField label="Phone" value={userForm.phone} onChange={v => setUserForm(f => ({ ...f, phone: v }))} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-primary)', display: 'block', marginBottom: 8 }}>Entity Access</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {entities.map(e => (
                <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: (userForm.entity_access || []).includes(e.id) ? 'var(--c-danger-light)' : 'var(--bg-subtle)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, border: '1px solid ' + ((userForm.entity_access || []).includes(e.id) ? 'var(--c-danger)' : 'var(--border)') }}>
                  <input type="checkbox" checked={(userForm.entity_access || []).includes(e.id)} onChange={() => toggleEntityAccess(e.id)} />
                  {e.code} — {e.name}
                </label>
              ))}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', marginBottom: 16 }}>
            <input type="checkbox" checked={userForm.is_active} onChange={e => setUserForm(f => ({ ...f, is_active: e.target.checked }))} />
            Active User
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn onClick={() => setModal(null)} color="var(--t-secondary)" small>Cancel</Btn>
            <Btn onClick={saveUser} small>Save User</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── MODULE LOCKS ──────────────────────────────────────────────────────────
const MODULE_LIST = [
  { id: 'sales', label: 'Sales' },
  { id: 'finance', label: 'Finance & Accounts' },
  { id: 'construction', label: 'Construction' },
  { id: 'hr', label: 'Human Resources' },
];

const LOCK_LEVELS = [
  { value: 'active', label: '🟢 Active', color: 'var(--c-success)' },
  { value: 'view_only', label: '🟡 View Only', color: 'var(--c-warning)' },
  { value: 'locked', label: '🔴 Locked', color: 'var(--c-danger)' },
];

const PRIORITY_MATRIX = [
  { role: 'super_admin', note: 'Bypasses all locks — always full access' },
  { role: 'director', note: 'Bypasses all locks — always full access' },
  { role: 'accounts_manager', note: 'Affected by finance locks' },
  { role: 'sales_executive', note: 'Affected by sales locks' },
  { role: 'hr_manager', note: 'Affected by HR locks' },
  { role: 'site_supervisor', note: 'Affected by construction locks' },
  { role: 'broker', note: 'Affected by sales locks' },
  { role: 'legal_doc_user', note: 'Affected by sales locks' },
];

function ModuleLocksTab() {
  const { entities, moduleLocks, setModuleLocks, addToast } = useAppStore();
  const [selEntity, setSelEntity] = useState(entities[0]?.code || '');

  function setLock(module, level) {
    const entityLocks = { ...(moduleLocks[selEntity] || {}), [module]: level };
    setModuleLocks(selEntity, entityLocks);
    addToast(`${module} set to ${level} for ${selEntity}`);
  }

  function bulkSet(level) {
    const locks = MODULE_LIST.reduce((acc, m) => ({ ...acc, [m.id]: level }), {});
    setModuleLocks(selEntity, locks);
    addToast(`All modules set to ${level} for ${selEntity}`);
  }

  const entityLocks = (moduleLocks[selEntity] || {});

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-dark)', marginBottom: 4 }}>Module Locks</div>
      <div style={{ fontSize: 11, color: 'var(--t-muted)', marginBottom: 16 }}>Control per-entity module access. Super Admin & Director bypass all locks.</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <select value={selEntity} onChange={e => setSelEntity(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', fontSize: 12, minWidth: 220 }}>
          {entities.map(e => <option key={e.code} value={e.code}>{e.code} — {e.name}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          {LOCK_LEVELS.map(ll => (
            <button key={ll.value} onClick={() => bulkSet(ll.value)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, color: ll.color, background: ll.color + '12', border: '1px solid ' + ll.color + '40', cursor: 'pointer' }}>
              Bulk: {ll.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {MODULE_LIST.map(mod => {
          const current = entityLocks[mod.id] || 'active';
          return (
            <div key={mod.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-dark)', marginBottom: 12 }}>{mod.label}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {LOCK_LEVELS.map(ll => (
                  <button key={ll.value} onClick={() => setLock(mod.id, ll.value)} style={{
                    flex: 1, padding: '8px 6px', borderRadius: 8, fontSize: 11, fontWeight: current === ll.value ? 800 : 500,
                    color: current === ll.value ? '#fff' : ll.color,
                    background: current === ll.value ? ll.color : 'transparent',
                    border: '1px solid ' + ll.color + (current === ll.value ? '' : '60'),
                    cursor: 'pointer', transition: 'all 0.1s',
                  }}>{ll.label}</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Priority Matrix */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bg-subtle)', fontWeight: 700, fontSize: 13, color: 'var(--c-dark)' }}>Role Priority Matrix</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>Role</Th><Th>Lock Behavior</Th></tr></thead>
          <tbody>
            {PRIORITY_MATRIX.map(r => (
              <tr key={r.role}>
                <Td style={{ fontWeight: 600 }}><Badge label={ROLE_LABELS[r.role] || r.role} color="var(--c-danger)" /></Td>
                <Td style={{ color: r.role === 'super_admin' || r.role === 'director' ? 'var(--c-success)' : 'var(--t-primary)', fontWeight: r.role === 'super_admin' ? 700 : 400 }}>{r.note}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── MIS & REPORTS ─────────────────────────────────────────────────────────
function MISTab() {
  const { bookings, projects, employees, journalEntries, gstData, materialIndents, purchaseOrders, tdsEntries, activeEntity, addToast } = useAppStore();

  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const approvedBookings = bookings.filter(b => b.status === 'approved' || b.status === 'registered').length;
    const totalBookingValue = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.agreementValue || 0), 0);
    const totalCollected = bookings.reduce((s, b) => s + (b.payments || []).reduce((ps, p) => ps + (p.amount || 0), 0), 0);
    const totalIncome = journalEntries.filter(e => { const coa = {}; return true; }).reduce((s, e) => s + e.amount, 0);
    const pendingPOs = purchaseOrders.filter(p => p.status === 'pending_approval').length;
    const totalTDS = tdsEntries.reduce((s, e) => s + (e.tdsAmount || 0), 0);
    const totalGSTOut = (gstData.salesInvoices || []).reduce((s, r) => s + Number(r.cgst || 0) + Number(r.sgst || 0) + Number(r.igst || 0), 0);
    return { totalBookings, approvedBookings, totalBookingValue, totalCollected, pendingPOs, totalTDS, totalGSTOut, totalEmployees: employees.length, activeProjects: projects.filter(p => p.status === 'active' || !p.status).length };
  }, [bookings, journalEntries, purchaseOrders, tdsEntries, gstData, employees, projects]);

  async function exportCSV(data, filename) {
    if (!data.length) { addToast('No data to export', 'error'); return; }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(r => Object.values(r).map(v => `"${v}"`).join(','));
    const content = [headers, ...rows].join('\n');
    if (window.vgERP) {
      await window.vgERP.csv.export(content, filename);
    } else {
      const a = document.createElement('a');
      a.href = 'data:text/csv,' + encodeURIComponent(content);
      a.download = filename; a.click();
    }
    addToast('CSV exported');
  }

  const REPORTS = [
    { label: 'Booking Register', desc: 'All bookings with status, value, collections', data: bookings, file: 'bookings.csv' },
    { label: 'Collection Report', desc: 'All payments received', data: bookings.flatMap(b => (b.payments || []).map(p => ({ bookingNo: b.bookingNo, customer: b.customerName, ...p }))), file: 'collections.csv' },
    { label: 'Employee List', desc: 'All employees with designation and salary', data: employees, file: 'employees.csv' },
    { label: 'Journal Ledger', desc: 'All journal entries', data: journalEntries, file: 'journal.csv' },
    { label: 'TDS Register', desc: 'All TDS entries section-wise', data: tdsEntries, file: 'tds.csv' },
    { label: 'PO Register', desc: 'All purchase orders', data: purchaseOrders, file: 'purchase_orders.csv' },
  ];

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-dark)', marginBottom: 16 }}>MIS & Reports — {activeEntity?.name}</div>

      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          ['Total Bookings', stats.totalBookings, 'var(--c-primary)'],
          ['Approved Bookings', stats.approvedBookings, 'var(--c-success)'],
          ['Total Booking Value', `₹${(stats.totalBookingValue / 10000000).toFixed(2)} Cr`, 'var(--c-info)'],
          ['Total Collected', `₹${(stats.totalCollected / 100000).toFixed(1)}L`, 'var(--c-teal)'],
          ['TDS Deducted', `₹${stats.totalTDS.toLocaleString('en-IN')}`, 'var(--c-danger)'],
          ['GST Outward', `₹${stats.totalGSTOut.toLocaleString('en-IN')}`, 'var(--c-warning)'],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--t-muted)' }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: c, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Export Reports */}
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-dark)', marginBottom: 12 }}>Export Reports</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {REPORTS.map(r => (
          <div key={r.label} style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--border)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-dark)' }}>{r.label}</div>
              <div style={{ fontSize: 10.5, color: 'var(--t-muted)', marginTop: 2 }}>{r.desc} · {r.data?.length || 0} records</div>
            </div>
            <Btn onClick={() => exportCSV(r.data || [], r.file)} small color="var(--c-primary)"><Download size={12} /> CSV</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AUDIT LOG ─────────────────────────────────────────────────────────────
function AuditLogTab() {
  const { auditLog } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('all');

  const modules = [...new Set(auditLog.map(e => e.module))].filter(Boolean);
  const filtered = auditLog.filter(e => {
    if (filterModule !== 'all' && e.module !== filterModule) return false;
    if (search && !e.action?.toLowerCase().includes(search.toLowerCase()) && !e.detail?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const ACTION_COLORS = { ADD: 'var(--c-success)', EDIT: 'var(--c-primary)', DELETE: 'var(--c-danger)', APPROVE: 'var(--c-teal)', CANCEL: 'var(--c-danger)', LOGIN: 'var(--c-info)' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-dark)' }}>Audit Log</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={11} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--t-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ paddingLeft: 26, paddingRight: 10, paddingTop: 6, paddingBottom: 6, border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, outline: 'none', width: 180 }} />
          </div>
          <select value={filterModule} onChange={e => setFilterModule(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12 }}>
            <option value="all">All Modules</option>
            {modules.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>Timestamp</Th><Th>User</Th><Th>Action</Th><Th>Module</Th><Th>Detail</Th></tr></thead>
          <tbody>
            {filtered.slice(0, 200).map(e => {
              const actionKey = Object.keys(ACTION_COLORS).find(k => (e.action || '').includes(k)) || '';
              return (
                <tr key={e.id}>
                  <Td style={{ fontSize: 10.5, color: 'var(--t-muted)', whiteSpace: 'nowrap' }}>{new Date(e.ts).toLocaleString('en-IN')}</Td>
                  <Td style={{ fontWeight: 500 }}>{e.user || '—'}</Td>
                  <Td><Badge label={e.action || '—'} color={ACTION_COLORS[actionKey] || 'var(--t-secondary)'} /></Td>
                  <Td><Badge label={e.module || '—'} color="var(--c-primary)" /></Td>
                  <Td style={{ maxWidth: 300 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11.5 }}>{e.detail || '—'}</div></Td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--t-muted)', fontSize: 13 }}>No audit entries yet. Actions you perform will appear here.</div>}
      </div>
    </div>
  );
}

// ── BACKUP MANAGER ────────────────────────────────────────────────────────
function BackupManagerTab() {
  const { addToast, oneDrivePath } = useAppStore();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState('');
  const [promptOpen, setPromptOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);

  async function loadBackups() {
    if (!window.vgERP) { addToast('Backup only in Electron', 'error'); return; }
    setLoading(true);
    const res = await window.vgERP.backup.list();
    if (res.ok) setBackups(res.backups || []);
    else addToast('Failed to load backups', 'error');
    setLoading(false);
  }

  async function createBackup(label = '') {
    if (!window.vgERP) { addToast('Backup only in Electron', 'error'); return; }
    const res = await window.vgERP.backup.create({ label });
    if (res.ok) { addToast(`Backup created — ${res.fileCount} files`); loadBackups(); }
    else addToast('Backup failed: ' + res.error, 'error');
  }

  async function restoreBackup(backup) {
    if (!window.vgERP) return;
    setRestoring(backup.name);
    const res = await window.vgERP.backup.restore(backup.path);
    setRestoring('');
    if (res.ok) addToast(`Restored ${res.fileCount} files. Please restart the app.`);
    else addToast('Restore failed: ' + res.error, 'error');
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-dark)' }}>Backup Manager</div>
          <div style={{ fontSize: 11, color: 'var(--t-muted)' }}>Auto-backup runs daily on startup. Manual backup anytime.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={loadBackups} color="var(--t-secondary)" small disabled={loading}><RefreshCw size={12} /> {loading ? 'Loading…' : 'Refresh'}</Btn>
          <Btn onClick={() => setPromptOpen(true)} small><Database size={12} /> Create Backup Now</Btn>
        </div>
      </div>

      {/* Sync folder info */}
      {oneDrivePath && (
        <div style={{ background: 'var(--c-success-light)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: 'var(--c-success)' }}>
          ✓ Sync folder: <strong>{oneDrivePath}</strong>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {backups.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--t-muted)', fontSize: 13 }}>
            <Database size={36} style={{ color: 'var(--border)', marginBottom: 12 }} />
            <div>No backups loaded. Click Refresh to load, or Create Backup Now.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Backup Name</Th><Th>Files</Th><Th>Size</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {backups.map(b => (
                <tr key={b.name}>
                  <Td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 11 }}>{b.name}</Td>
                  <Td>{b.fileCount} files</Td>
                  <Td>{(b.size / 1024).toFixed(1)} KB</Td>
                  <Td>
                    <button onClick={() => setRestoreTarget(b)} disabled={!!restoring} style={{ background: restoring === b.name ? 'var(--border)' : 'var(--c-warning-light)', color: 'var(--t-secondary)', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: restoring ? 'default' : 'pointer', fontWeight: 600 }}>
                      {restoring === b.name ? 'Restoring…' : 'Restore'}
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <PromptDialog
        open={promptOpen}
        title="Create backup"
        message="Optional label helps identify this backup later."
        placeholder="e.g. pre-month-end-close"
        defaultValue=""
        confirmText="Create Backup"
        cancelText="Cancel"
        onCancel={() => setPromptOpen(false)}
        onSubmit={value => {
          setPromptOpen(false);
          createBackup(value || '');
        }}
      />

      <ConfirmDialog
        open={!!restoreTarget}
        title="Restore backup?"
        message={`Restore from backup "${restoreTarget?.name || ''}"? This will overwrite current data.`}
        confirmText="Restore"
        cancelText="Cancel"
        tone="danger"
        onCancel={() => setRestoreTarget(null)}
        onConfirm={() => {
          if (!restoreTarget) return;
          const target = restoreTarget;
          setRestoreTarget(null);
          restoreBackup(target);
        }}
        loading={!!restoring}
      />
    </div>
  );
}

// ── TALLY IMPORT ──────────────────────────────────────────────────────────
const TALLY_IMPORT_TYPES = [
  { id: 'ledger', label: 'Ledger Entries', desc: 'Journal / voucher entries from Tally XML' },
  { id: 'parties', label: 'Parties / Vendors', desc: 'Customer and vendor master from Tally' },
  { id: 'stock', label: 'Stock Items', desc: 'Material / stock item master' },
  { id: 'employees', label: 'Employees', desc: 'Employee master from Tally payroll' },
  { id: 'gst', label: 'GST Entries', desc: 'GST transactions export from Tally' },
  { id: 'tds', label: 'TDS Entries', desc: 'TDS deduction register from Tally' },
];

function TallyImportTab() {
  const { addToast, setJournalEntries, setVendors, setEmployees } = useAppStore();
  const [preview, setPreview] = useState(null);
  const [xmlDoc, setXmlDoc] = useState(null);
  const [importType, setImportType] = useState('ledger');
  const [conflicts, setConflicts] = useState([]);
  const [resolution, setResolution] = useState('skip'); // skip | overwrite | merge

  async function loadXML() {
    if (!window.vgERP) { addToast('Tally import only in Electron', 'error'); return; }
    const res = await window.vgERP.tally.readFile();
    if (res.cancelled) return;
    if (!res.ok) { addToast('Failed to read XML', 'error'); return; }
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(res.content, 'text/xml');
      setXmlDoc(doc);
      const nodes = doc.querySelectorAll('VOUCHER, LEDGER, STOCKITEM, EMPLOYEE');
      setPreview({ count: nodes.length, fileName: res.filePath?.split('\\').pop(), raw: res.content.slice(0, 500) });
      addToast(`${nodes.length} records found in XML`);
    } catch (e) {
      addToast('XML parse error', 'error');
    }
  }

  function textOf(node, selectors = []) {
    for (const sel of selectors) {
      const el = node.querySelector(sel);
      if (el && el.textContent) return el.textContent.trim();
    }
    return '';
  }

  function parseLedgerEntries(doc) {
    const vouchers = Array.from(doc.querySelectorAll('VOUCHER'));
    return vouchers.map((v, idx) => {
      const amount = Number(textOf(v, ['AMOUNT', 'ALLLEDGERENTRIES.LIST AMOUNT']) || 0);
      const type = textOf(v, ['VOUCHERTYPENAME']) || 'Journal';
      const dateRaw = textOf(v, ['DATE']);
      const date = dateRaw?.length === 8
        ? `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`
        : new Date().toISOString().split('T')[0];
      const narration = textOf(v, ['NARRATION']) || `${type} import`;
      const party = textOf(v, ['PARTYLEDGERNAME']);
      return {
        id: Date.now() + idx,
        date,
        voucherType: type,
        voucherNo: textOf(v, ['VOUCHERNUMBER']) || `TLY/${String(idx + 1).padStart(4, '0')}`,
        narration: party ? `${narration} (${party})` : narration,
        amount: Math.abs(amount),
        drAccount: 'A003',
        crAccount: 'L002',
        ref: textOf(v, ['REFERENCE']),
        importedFrom: 'tally',
        createdAt: new Date().toISOString(),
      };
    }).filter(e => e.amount > 0);
  }

  function parseVendors(doc) {
    const ledgers = Array.from(doc.querySelectorAll('LEDGER'));
    return ledgers.map((l, idx) => {
      const name = l.getAttribute('NAME') || textOf(l, ['NAME']);
      if (!name) return null;
      return {
        id: Date.now() + idx,
        name,
        category: 'Imported',
        gstin: textOf(l, ['GSTIN']),
        pan: textOf(l, ['INCOMETAXNUMBER', 'PAN']),
        phone: textOf(l, ['LEDGERPHONE', 'PHONENUMBER']),
        email: textOf(l, ['EMAIL']),
        importedFrom: 'tally',
      };
    }).filter(Boolean);
  }

  function parseEmployees(doc) {
    const emps = Array.from(doc.querySelectorAll('EMPLOYEE, EMPLOYEEMASTER'));
    return emps.map((e, idx) => {
      const name = e.getAttribute('NAME') || textOf(e, ['NAME']);
      if (!name) return null;
      return {
        id: Date.now() + idx,
        name,
        employeeCode: textOf(e, ['EMPLOYEECODE']) || `IMP${String(idx + 1).padStart(3, '0')}`,
        department: textOf(e, ['DEPARTMENT']) || 'Imported',
        designation: textOf(e, ['DESIGNATION']) || 'Staff',
        phone: textOf(e, ['PHONE', 'MOBILENO']),
        pan: textOf(e, ['PAN']),
        status: 'active',
        importedFrom: 'tally',
      };
    }).filter(Boolean);
  }

  function mergeByName(existing, incoming) {
    const byKey = new Map(existing.map(e => [String(e.name || e.narration || '').toLowerCase(), e]));
    for (const item of incoming) {
      const key = String(item.name || item.narration || '').toLowerCase();
      if (!key) continue;
      if (!byKey.has(key) || resolution === 'overwrite') byKey.set(key, item);
    }
    return Array.from(byKey.values());
  }

  function importData() {
    if (!preview || !xmlDoc) { addToast('Load XML file first', 'error'); return; }
    let count = 0;
    if (importType === 'ledger') {
      const incoming = parseLedgerEntries(xmlDoc);
      setJournalEntries(prev => {
        const next = resolution === 'skip'
          ? [...incoming.filter(i => !prev.some(p => p.voucherNo === i.voucherNo)), ...prev]
          : resolution === 'overwrite'
            ? [...incoming, ...prev.filter(p => !incoming.some(i => i.voucherNo === p.voucherNo))]
            : mergeByName(prev, incoming);
        count = incoming.length;
        return next;
      });
    } else if (importType === 'parties') {
      const incoming = parseVendors(xmlDoc);
      setVendors(prev => {
        const next = resolution === 'skip'
          ? [...incoming.filter(i => !prev.some(p => String(p.name).toLowerCase() === String(i.name).toLowerCase())), ...prev]
          : resolution === 'overwrite'
            ? [...incoming, ...prev.filter(p => !incoming.some(i => String(i.name).toLowerCase() === String(p.name).toLowerCase()))]
            : mergeByName(prev, incoming);
        count = incoming.length;
        return next;
      });
    } else if (importType === 'employees') {
      const incoming = parseEmployees(xmlDoc);
      setEmployees(prev => {
        const next = resolution === 'skip'
          ? [...incoming.filter(i => !prev.some(p => String(p.name).toLowerCase() === String(i.name).toLowerCase())), ...prev]
          : resolution === 'overwrite'
            ? [...incoming, ...prev.filter(p => !incoming.some(i => String(i.name).toLowerCase() === String(p.name).toLowerCase()))]
            : mergeByName(prev, incoming);
        count = incoming.length;
        return next;
      });
    } else {
      addToast('Selected import type is not mapped yet', 'warning');
      return;
    }

    addToast(`Import complete — ${count} ${importType} records (${resolution} mode)`);
    setPreview(null);
    setXmlDoc(null);
  }

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-dark)', marginBottom: 4 }}>Tally Import</div>
      <div style={{ fontSize: 11, color: 'var(--t-muted)', marginBottom: 20 }}>Import data from Tally XML export. Review before committing.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* Left: Controls */}
        <div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 16, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-dark)', marginBottom: 12 }}>Import Settings</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-primary)', display: 'block', marginBottom: 6 }}>Import Type</label>
              {TALLY_IMPORT_TYPES.map(t => (
                <label key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                  <input type="radio" name="importType" value={t.id} checked={importType === t.id} onChange={() => setImportType(t.id)} style={{ marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-dark)' }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--t-muted)' }}>{t.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-primary)', display: 'block', marginBottom: 6 }}>Conflict Resolution</label>
              {[['skip', 'Skip duplicates'], ['overwrite', 'Overwrite existing'], ['merge', 'Merge (safe)']].map(([v, l]) => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, cursor: 'pointer', fontSize: 12 }}>
                  <input type="radio" name="resolution" value={v} checked={resolution === v} onChange={() => setResolution(v)} />
                  {l}
                </label>
              ))}
            </div>
            <Btn onClick={loadXML} style={{ width: '100%', justifyContent: 'center' }}><Upload size={13} /> Load Tally XML</Btn>
          </div>
        </div>

        {/* Right: Preview */}
        <div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-dark)', marginBottom: 12 }}>Preview</div>
            {!preview ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--t-muted)', fontSize: 13 }}>Load an XML file to preview data before importing.</div>
            ) : (
              <>
                <div style={{ background: 'var(--c-success-light)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-success)' }}>{preview.count} records found</div>
                  <div style={{ fontSize: 11, color: 'var(--c-success)', marginTop: 2 }}>File: {preview.fileName}</div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontFamily: 'monospace', fontSize: 10, color: 'var(--t-primary)', maxHeight: 200, overflowY: 'auto' }}>
                  {preview.raw}…
                </div>
                <div style={{ background: 'var(--c-warning-light)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 11.5, color: 'var(--t-secondary)' }}>
                  ⚠ Review carefully. Import cannot be automatically undone — take a backup first.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn onClick={() => setPreview(null)} color="var(--t-secondary)" small>Cancel</Btn>
                  <Btn onClick={importData} color="var(--c-success)" small>Confirm Import ({preview.count} records, {resolution})</Btn>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── NOTIFICATION CENTRE ───────────────────────────────────────────────────
function NotificationCentreTab() {
  const { notifications, markAllNotifRead, markNotifRead, addNotification, entities } = useAppStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ message: '', type: 'info', module: '', priority: 'normal' });

  const unread = notifications.filter(n => !n.read).length;

  function sendNotification() {
    if (!form.message) return;
    addNotification({ ...form });
    setModal(false);
    setForm({ message: '', type: 'info', module: '', priority: 'normal' });
  }

  const TYPE_COLORS = { info: 'var(--c-primary)', warning: 'var(--c-warning)', error: 'var(--c-danger)', success: 'var(--c-success)' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-dark)' }}>Notification Centre</div>
          <div style={{ fontSize: 11, color: 'var(--t-muted)' }}>{unread} unread · {notifications.length} total</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unread > 0 && <Btn onClick={markAllNotifRead} color="var(--t-secondary)" small>Mark All Read</Btn>}
          <Btn onClick={() => setModal(true)} small><Bell size={12} /> Send Notification</Btn>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--t-muted)', fontSize: 13 }}>
            <Bell size={36} style={{ color: 'var(--border)', marginBottom: 12 }} />
            <div>No notifications yet.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Time</Th><Th>Message</Th><Th>Type</Th><Th>Module</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {notifications.slice(0, 100).map(n => (
                <tr key={n.id} style={{ background: n.read ? '#fff' : 'var(--c-primary-light)' }}>
                  <Td style={{ fontSize: 10.5, color: 'var(--t-muted)', whiteSpace: 'nowrap' }}>{new Date(n.ts).toLocaleString('en-IN')}</Td>
                  <Td style={{ fontWeight: n.read ? 400 : 600 }}>{n.message}</Td>
                  <Td><Badge label={n.type || 'info'} color={TYPE_COLORS[n.type] || 'var(--c-primary)'} /></Td>
                  <Td>{n.module || '—'}</Td>
                  <Td>{n.read ? <Badge label="Read" color="var(--t-secondary)" /> : <Badge label="Unread" color="var(--c-primary)" />}</Td>
                  <Td>
                    {!n.read && <button onClick={() => markNotifRead(n.id)} style={{ background: 'none', border: 'none', color: 'var(--c-primary)', cursor: 'pointer', fontSize: 11 }}>Mark Read</button>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <ModalOverlay onClose={() => setModal(false)} title="Send Notification">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <FormField label="Type" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={[{ value: 'info', label: 'Info' }, { value: 'warning', label: 'Warning' }, { value: 'error', label: 'Alert' }, { value: 'success', label: 'Success' }]} />
            <FormField label="Priority" value={form.priority} onChange={v => setForm(f => ({ ...f, priority: v }))} options={['normal', 'high', 'urgent']} />
            <FormField label="Linked Module" value={form.module} onChange={v => setForm(f => ({ ...f, module: v }))} options={[{ value: '', label: '— None —' }, 'sales', 'finance', 'construction', 'hr', 'admin']} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-primary)', display: 'block', marginBottom: 4 }}>Message</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn onClick={() => setModal(false)} color="var(--t-secondary)" small>Cancel</Btn>
            <Btn onClick={sendNotification} small>Send</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
