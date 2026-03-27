import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Plus, Search, Download, X, ChevronDown, User } from 'lucide-react';
import {
  moduleBtnStyle,
  ModuleModalOverlay as ThemeModalOverlay,
  ModuleTableTh as ThemeTh,
  ModuleTableTd as ThemeTd,
  formLabelStyle,
  fieldStyle,
  onFieldFocus,
  onFieldBlur,
  PAGE_HEADER_STYLE,
  PAGE_TITLE_STYLE,
  PAGE_SUBTITLE_STYLE,
} from '../theme/moduleUi.jsx';

export default function HRModule({ viewOnly }) {
  const { activeSubTab } = useAppStore();
  const tab = activeSubTab || 'employees';
  return (
    <div>
      {tab === 'employees'   && <EmployeesTab viewOnly={viewOnly} />}
      {tab === 'attendance'  && <AttendanceTab viewOnly={viewOnly} />}
      {tab === 'leave'       && <LeaveTab viewOnly={viewOnly} />}
      {tab === 'payroll'     && <PayrollTab viewOnly={viewOnly} />}
      {tab === 'salaryslips' && <SalarySlipsTab viewOnly={viewOnly} />}
      {tab === 'hrloans'     && <LoansTab viewOnly={viewOnly} />}
    </div>
  );
}

// ── SHARED ─────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, color = 'var(--c-teal)', small, disabled, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={moduleBtnStyle(color, small, disabled, style)}>{children}</button>
);
const Badge = ({ label, color = 'var(--c-teal)' }) => <span style={{ background: color + '18', color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{label}</span>;
function ModalOverlay({ children, onClose, title, wide }) {
  return <ThemeModalOverlay onClose={onClose} title={title} wide={wide}>{children}</ThemeModalOverlay>;
}
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
          onFocus={onFieldFocus} onBlur={e => onFieldBlur(e, false)} />
      )}
    </div>
  );
}
function Th({ children }) { return <ThemeTh>{children}</ThemeTh>; }
function Td({ children, style = {} }) { return <ThemeTd style={style}>{children}</ThemeTd>; }

const DEPARTMENTS = ['Management', 'Accounts', 'Sales', 'Construction', 'HR', 'Admin', 'Site'];
const DESIGNATIONS = ['Director', 'Manager', 'Executive', 'Supervisor', 'Engineer', 'Accountant', 'Clerk', 'Worker'];

// ── EMPLOYEES ─────────────────────────────────────────────────────────────
function EmployeesTab({ viewOnly }) {
  const { employees, setEmployees, addToast, user } = useAppStore();
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', pan: '', aadhaar: '', department: 'Accounts', designation: 'Executive', employeeCode: '', joinDate: '', salary: '', salaryType: 'monthly', bankAccount: '', ifsc: '', bankName: '', pf: false, esi: false, status: 'active' });

  function saveEmployee() {
    if (!form.name) { addToast('Employee name required', 'error'); return; }
    if (selected) {
      setEmployees(prev => prev.map(e => e.id === selected.id ? { ...e, ...form } : e));
      addToast('Employee updated');
    } else {
      const code = form.employeeCode || `EMP${String(employees.length + 1).padStart(3, '0')}`;
      setEmployees(prev => [...prev, { ...form, id: Date.now(), employeeCode: code, createdAt: new Date().toISOString() }]);
      addToast('Employee added');
    }
    setModal(null);
  }

  const filtered = employees.filter(e => !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.employeeCode?.includes(search));
  const active = employees.filter(e => e.status === 'active').length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-dark)' }}>Employees</div>
          <div style={{ fontSize: 11, color: 'var(--t-muted)' }}>{active} active · {employees.length} total</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={11} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--t-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ paddingLeft: 26, paddingRight: 10, paddingTop: 6, paddingBottom: 6, border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, outline: 'none', width: 180 }} />
          </div>
          {!viewOnly && <Btn onClick={() => { setSelected(null); setForm({ name: '', phone: '', email: '', pan: '', aadhaar: '', department: 'Accounts', designation: 'Executive', employeeCode: '', joinDate: '', salary: '', salaryType: 'monthly', bankAccount: '', ifsc: '', bankName: '', pf: false, esi: false, status: 'active' }); setModal('form'); }} small><Plus size={12} /> Add Employee</Btn>}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>Code</Th><Th>Name</Th><Th>Department</Th><Th>Designation</Th><Th>Salary</Th><Th>PF</Th><Th>ESI</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id}>
                <Td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 11 }}>{e.employeeCode}</Td>
                <Td style={{ fontWeight: 600, color: 'var(--c-dark)' }}>{e.name}</Td>
                <Td>{e.department}</Td>
                <Td>{e.designation}</Td>
                <Td style={{ fontWeight: 600 }}>₹{Number(e.salary || 0).toLocaleString('en-IN')}<span style={{ fontSize: 9, color: 'var(--t-muted)' }}>/{e.salaryType === 'monthly' ? 'mo' : 'day'}</span></Td>
                <Td>{e.pf ? <Badge label="PF" color="var(--c-teal)" /> : '—'}</Td>
                <Td>{e.esi ? <Badge label="ESI" color="var(--c-primary)" /> : '—'}</Td>
                <Td><Badge label={e.status} color={e.status === 'active' ? 'var(--c-success)' : 'var(--c-danger)'} /></Td>
                <Td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => { setSelected(e); setModal('view'); }} style={{ background: 'var(--c-success-light)', color: 'var(--c-teal)', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>View</button>
                    {!viewOnly && <button onClick={() => { setSelected(e); setForm({ ...e }); setModal('form'); }} style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Edit</button>}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--t-muted)', fontSize: 13 }}>No employees yet. Add your team.</div>}
      </div>

      {modal === 'form' && (
        <ModalOverlay onClose={() => setModal(null)} title={selected ? `Edit — ${selected.name}` : 'Add Employee'} wide>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-dark)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Basic Info</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <FormField label="Full Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <FormField label="Employee Code" value={form.employeeCode} onChange={v => setForm(f => ({ ...f, employeeCode: v }))} />
            <FormField label="Join Date" value={form.joinDate} onChange={v => setForm(f => ({ ...f, joinDate: v }))} type="date" />
            <FormField label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
            <FormField label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
            <FormField label="Department" value={form.department} onChange={v => setForm(f => ({ ...f, department: v }))} options={DEPARTMENTS} />
            <FormField label="Designation" value={form.designation} onChange={v => setForm(f => ({ ...f, designation: v }))} options={DESIGNATIONS} />
            <FormField label="PAN" value={form.pan} onChange={v => setForm(f => ({ ...f, pan: v.toUpperCase() }))} />
            <FormField label="Aadhaar No" value={form.aadhaar} onChange={v => setForm(f => ({ ...f, aadhaar: v }))} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-dark)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Salary & Compliance</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <FormField label="Salary (₹)" value={form.salary} onChange={v => setForm(f => ({ ...f, salary: v }))} type="number" />
            <FormField label="Salary Type" value={form.salaryType} onChange={v => setForm(f => ({ ...f, salaryType: v }))} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'daily', label: 'Daily Wage' }]} />
            <FormField label="Status" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          </div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.pf} onChange={e => setForm(f => ({ ...f, pf: e.target.checked }))} />
              PF Applicable
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.esi} onChange={e => setForm(f => ({ ...f, esi: e.target.checked }))} />
              ESI Applicable
            </label>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-dark)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bank Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <FormField label="Bank Name" value={form.bankName} onChange={v => setForm(f => ({ ...f, bankName: v }))} />
            <FormField label="Account No" value={form.bankAccount} onChange={v => setForm(f => ({ ...f, bankAccount: v }))} />
            <FormField label="IFSC Code" value={form.ifsc} onChange={v => setForm(f => ({ ...f, ifsc: v.toUpperCase() }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn onClick={() => setModal(null)} color="var(--t-secondary)" small>Cancel</Btn>
            <Btn onClick={saveEmployee} small>Save Employee</Btn>
          </div>
        </ModalOverlay>
      )}

      {modal === 'view' && selected && (
        <ModalOverlay onClose={() => setModal(null)} title={selected.name} wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[['Code', selected.employeeCode], ['Department', selected.department], ['Designation', selected.designation], ['Phone', selected.phone || '—'], ['Email', selected.email || '—'], ['PAN', selected.pan || '—'], ['Aadhaar', selected.aadhaar || '—'], ['Join Date', selected.joinDate || '—'], ['Salary', `₹${Number(selected.salary || 0).toLocaleString('en-IN')}/${selected.salaryType === 'monthly' ? 'month' : 'day'}`], ['PF', selected.pf ? 'Yes' : 'No'], ['ESI', selected.esi ? 'Yes' : 'No'], ['Status', selected.status]].map(([k, v]) => (
              <div key={k}><div style={{ fontSize: 10, color: 'var(--t-muted)' }}>{k}</div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-dark)' }}>{v}</div></div>
            ))}
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── ATTENDANCE ────────────────────────────────────────────────────────────
function AttendanceTab({ viewOnly }) {
  const { employees, attendance, setAttendance, addToast } = useAppStore();
  const [mode, setMode] = useState('daily'); // daily | monthly
  const [selDate, setSelDate] = useState(new Date().toISOString().split('T')[0]);
  const [selMonth, setSelMonth] = useState(new Date().toISOString().slice(0, 7));

  function markAttendance(empId, status) {
    setAttendance(prev => {
      const existing = prev.findIndex(a => a.empId === empId && a.date === selDate);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], status };
        return updated;
      }
      return [...prev, { id: Date.now() + empId, empId, date: selDate, status }];
    });
  }

  function getStatus(empId) {
    return attendance.find(a => a.empId === empId && a.date === selDate)?.status || '';
  }

  // Monthly summary
  const monthlySummary = useMemo(() => {
    const monthAttendance = attendance.filter(a => a.date?.startsWith(selMonth));
    return employees.map(e => {
      const empAtt = monthAttendance.filter(a => a.empId === e.id);
      return {
        ...e,
        present: empAtt.filter(a => a.status === 'P').length,
        absent: empAtt.filter(a => a.status === 'A').length,
        halfday: empAtt.filter(a => a.status === 'HD').length,
        leave: empAtt.filter(a => a.status === 'L').length,
        lop: empAtt.filter(a => a.status === 'LOP').length,
      };
    });
  }, [attendance, employees, selMonth]);

  const STATUS_OPTIONS = [
    { val: 'P', label: 'Present', color: 'var(--c-success)' },
    { val: 'A', label: 'Absent', color: 'var(--c-danger)' },
    { val: 'HD', label: 'Half Day', color: 'var(--c-warning)' },
    { val: 'L', label: 'Leave', color: 'var(--c-primary)' },
    { val: 'LOP', label: 'LOP', color: 'var(--c-info)' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-dark)' }}>Attendance</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 8, padding: 2 }}>
            {[['daily', 'Daily'], ['monthly', 'Monthly Summary']].map(([v, l]) => (
              <button key={v} onClick={() => setMode(v)} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: mode === v ? 700 : 400, color: mode === v ? 'var(--c-dark)' : 'var(--t-secondary)', background: mode === v ? '#fff' : 'transparent', border: '1px solid ' + (mode === v ? 'var(--border)' : 'transparent'), cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
          {mode === 'daily' ? (
            <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 12 }} />
          ) : (
            <input type="month" value={selMonth} onChange={e => setSelMonth(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 12 }} />
          )}
        </div>
      </div>

      {mode === 'daily' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Employee</Th><Th>Dept.</Th><Th>Designation</Th><Th>Status</Th></tr></thead>
            <tbody>
              {employees.filter(e => e.status === 'active').map(e => {
                const status = getStatus(e.id);
                return (
                  <tr key={e.id}>
                    <Td style={{ fontWeight: 600 }}>{e.name}</Td>
                    <Td>{e.department}</Td>
                    <Td>{e.designation}</Td>
                    <Td>
                      {!viewOnly ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          {STATUS_OPTIONS.map(opt => (
                            <button key={opt.val} onClick={() => markAttendance(e.id, opt.val)} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', background: status === opt.val ? opt.color : 'transparent', color: status === opt.val ? '#fff' : opt.color, border: `1px solid ${opt.color}` }}>{opt.val}</button>
                          ))}
                        </div>
                      ) : (
                        status ? <Badge label={status} color={STATUS_OPTIONS.find(o => o.val === status)?.color || 'var(--t-secondary)'} /> : '—'
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {employees.filter(e => e.status === 'active').length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--t-muted)', fontSize: 13 }}>No active employees.</div>}
        </div>
      )}

      {mode === 'monthly' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Employee</Th><Th>Present</Th><Th>Absent</Th><Th>Half Day</Th><Th>Leave</Th><Th>LOP</Th><Th>Payable Days</Th></tr></thead>
            <tbody>
              {monthlySummary.filter(e => e.status === 'active').map(e => {
                const payableDays = e.present + (e.halfday * 0.5) + e.leave;
                return (
                  <tr key={e.id}>
                    <Td style={{ fontWeight: 600 }}>{e.name}</Td>
                    <Td style={{ color: 'var(--c-success)', fontWeight: 600 }}>{e.present}</Td>
                    <Td style={{ color: 'var(--c-danger)', fontWeight: 600 }}>{e.absent}</Td>
                    <Td style={{ color: 'var(--c-warning)' }}>{e.halfday}</Td>
                    <Td style={{ color: 'var(--c-primary)' }}>{e.leave}</Td>
                    <Td style={{ color: 'var(--c-info)' }}>{e.lop}</Td>
                    <Td style={{ fontWeight: 700 }}>{payableDays}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── LEAVE ─────────────────────────────────────────────────────────────────
const LEAVE_TYPES = ['CL', 'SL', 'PL', 'LOP'];
const LEAVE_LABELS = { CL: 'Casual Leave', SL: 'Sick Leave', PL: 'Privilege Leave', LOP: 'Loss of Pay' };
const LEAVE_COLORS = { CL: 'var(--c-primary)', SL: 'var(--c-info)', PL: 'var(--c-teal)', LOP: 'var(--c-danger)' };

function LeaveTab({ viewOnly }) {
  const { employees, leaveApplications, setLeaveApplications, addToast, user } = useAppStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ empId: '', leaveType: 'CL', fromDate: '', toDate: '', reason: '', status: 'pending' });

  const days = form.fromDate && form.toDate ? Math.max(1, Math.ceil((new Date(form.toDate) - new Date(form.fromDate)) / 86400000) + 1) : 0;

  function applyLeave() {
    if (!form.empId || !form.fromDate || !form.toDate) { addToast('All fields required', 'error'); return; }
    setLeaveApplications(prev => [...prev, { ...form, id: Date.now(), days, appliedBy: user?.full_name, appliedAt: new Date().toISOString() }]);
    addToast('Leave application submitted'); setModal(false);
  }

  function approveLeave(id) {
    setLeaveApplications(prev => prev.map(l => l.id === id ? { ...l, status: 'approved', approvedBy: user?.full_name, approvedAt: new Date().toISOString() } : l));
    addToast('Leave approved');
  }

  function rejectLeave(id) {
    setLeaveApplications(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected' } : l));
    addToast('Leave rejected');
  }

  const STATUS_COLORS = { pending: 'var(--c-warning)', approved: 'var(--c-success)', rejected: 'var(--c-danger)' };
  const canApprove = user?.role === 'super_admin' || user?.role === 'director' || user?.role === 'hr_manager';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-dark)' }}>Leave Management</div>
        {!viewOnly && <Btn onClick={() => { setForm({ empId: '', leaveType: 'CL', fromDate: '', toDate: '', reason: '', status: 'pending' }); setModal(true); }} small><Plus size={12} /> Apply Leave</Btn>}
      </div>

      {/* Leave type pills summary */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {LEAVE_TYPES.map(lt => {
          const cnt = leaveApplications.filter(l => l.leaveType === lt && l.status === 'approved').length;
          return (
            <div key={lt} style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--border)', padding: '10px 16px', minWidth: 90 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: LEAVE_COLORS[lt] }}>{cnt}</div>
              <div style={{ fontSize: 10, color: 'var(--t-muted)' }}>{LEAVE_LABELS[lt]}</div>
            </div>
          );
        })}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>Employee</Th><Th>Type</Th><Th>From</Th><Th>To</Th><Th>Days</Th><Th>Reason</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {leaveApplications.map(l => {
              const emp = employees.find(e => String(e.id) === String(l.empId));
              return (
                <tr key={l.id}>
                  <Td style={{ fontWeight: 500 }}>{emp?.name || '—'}</Td>
                  <Td><Badge label={l.leaveType} color={LEAVE_COLORS[l.leaveType] || 'var(--t-secondary)'} /></Td>
                  <Td>{l.fromDate}</Td>
                  <Td>{l.toDate}</Td>
                  <Td style={{ fontWeight: 700 }}>{l.days || 1}</Td>
                  <Td style={{ maxWidth: 160 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason}</div></Td>
                  <Td><Badge label={l.status} color={STATUS_COLORS[l.status] || 'var(--t-secondary)'} /></Td>
                  <Td>
                    {!viewOnly && canApprove && l.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => approveLeave(l.id)} style={{ background: 'var(--c-success-light)', color: 'var(--c-success)', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => rejectLeave(l.id)} style={{ background: 'var(--c-danger-light)', color: 'var(--c-danger)', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Reject</button>
                      </div>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {leaveApplications.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--t-muted)', fontSize: 13 }}>No leave applications.</div>}
      </div>

      {modal && (
        <ModalOverlay onClose={() => setModal(false)} title="Apply Leave">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Employee *" value={form.empId} onChange={v => setForm(f => ({ ...f, empId: v }))} options={[{ value: '', label: '— Select —' }, ...employees.map(e => ({ value: e.id, label: `${e.employeeCode || ''} ${e.name}` }))]} />
            <FormField label="Leave Type" value={form.leaveType} onChange={v => setForm(f => ({ ...f, leaveType: v }))} options={LEAVE_TYPES.map(lt => ({ value: lt, label: LEAVE_LABELS[lt] }))} />
            <FormField label="From Date *" value={form.fromDate} onChange={v => setForm(f => ({ ...f, fromDate: v }))} type="date" />
            <FormField label="To Date *" value={form.toDate} onChange={v => setForm(f => ({ ...f, toDate: v }))} type="date" />
          </div>
          {days > 0 && <div style={{ background: 'var(--c-success-light)', borderRadius: 8, padding: '8px 12px', marginTop: 10, fontSize: 12, color: 'var(--c-success)', fontWeight: 600 }}>{days} day(s) of {LEAVE_LABELS[form.leaveType]}</div>}
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-primary)', display: 'block', marginBottom: 4 }}>Reason</label>
            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn onClick={() => setModal(false)} color="var(--t-secondary)" small>Cancel</Btn>
            <Btn onClick={applyLeave} small>Submit Application</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── PAYROLL ───────────────────────────────────────────────────────────────
function PayrollTab({ viewOnly }) {
  const { employees, payrollRuns, setPayrollRuns, attendance, leaveApplications, addToast, user } = useAppStore();
  const [selMonth, setSelMonth] = useState(new Date().toISOString().slice(0, 7));
  const [modal, setModal] = useState(false);

  const existingRun = payrollRuns.find(r => r.month === selMonth);

  function generatePayroll() {
    if (existingRun) { addToast('Payroll already generated for this month', 'error'); return; }
    const monthAttendance = attendance.filter(a => a.date?.startsWith(selMonth));
    const slips = employees.filter(e => e.status === 'active').map(e => {
      const empAtt = monthAttendance.filter(a => a.empId === e.id);
      const presentDays = empAtt.filter(a => a.status === 'P').length + empAtt.filter(a => a.status === 'HD').length * 0.5 + empAtt.filter(a => a.status === 'L').length;
      const lopDays = empAtt.filter(a => a.status === 'LOP').length;
      const totalDays = empAtt.length || 26;
      const salary = Number(e.salary || 0);
      const perDay = salary / 26;
      const gross = salary - (lopDays * perDay);
      const pf = e.pf ? gross * 0.12 : 0;
      const esi = e.esi && gross <= 21000 ? gross * 0.0075 : 0;
      const tds = gross > 50000 ? gross * 0.1 : 0;
      const net = gross - pf - esi - tds;
      return { empId: e.id, empCode: e.employeeCode, empName: e.name, department: e.department, designation: e.designation, salary, presentDays, lopDays, gross, pf, esi, tds, net, bankAccount: e.bankAccount };
    });
    setPayrollRuns(prev => [...prev, { id: Date.now(), month: selMonth, slips, status: 'draft', generatedBy: user?.full_name, generatedAt: new Date().toISOString(), totalGross: slips.reduce((s, sl) => s + sl.gross, 0), totalNet: slips.reduce((s, sl) => s + sl.net, 0) }]);
    addToast(`Payroll generated for ${slips.length} employees`); setModal(false);
  }

  function finalizePayroll() {
    setPayrollRuns(prev => prev.map(r => r.month === selMonth ? { ...r, status: 'finalized', finalizedBy: user?.full_name, finalizedAt: new Date().toISOString() } : r));
    addToast('Payroll finalized');
  }

  const run = existingRun;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-dark)' }}>Payroll</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="month" value={selMonth} onChange={e => setSelMonth(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 12 }} />
          {!viewOnly && !run && <Btn onClick={generatePayroll} small>Generate Payroll</Btn>}
          {!viewOnly && run && run.status === 'draft' && <Btn onClick={finalizePayroll} color="var(--c-success)" small>Finalize Payroll</Btn>}
        </div>
      </div>

      {run ? (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {[['Employees', run.slips?.length, 'var(--c-primary)'], ['Total Gross', `₹${(run.totalGross || 0).toLocaleString('en-IN')}`, 'var(--c-success)'], ['Total Net', `₹${(run.totalNet || 0).toLocaleString('en-IN')}`, 'var(--c-teal)'], ['Status', run.status, run.status === 'finalized' ? 'var(--c-success)' : 'var(--c-warning)']].map(([l, v, c]) => (
              <div key={l} style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--border)', padding: '12px 20px' }}>
                <div style={{ fontSize: 11, color: 'var(--t-muted)' }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: c, marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><Th>Code</Th><Th>Name</Th><Th>Dept.</Th><Th>Present</Th><Th>LOP</Th><Th>Gross</Th><Th>PF</Th><Th>ESI</Th><Th>TDS</Th><Th>Net Pay</Th></tr></thead>
              <tbody>
                {(run.slips || []).map(sl => (
                  <tr key={sl.empId}>
                    <Td style={{ fontFamily: 'monospace', fontSize: 11 }}>{sl.empCode}</Td>
                    <Td style={{ fontWeight: 600 }}>{sl.empName}</Td>
                    <Td>{sl.department}</Td>
                    <Td style={{ color: 'var(--c-success)', fontWeight: 600 }}>{sl.presentDays}</Td>
                    <Td style={{ color: 'var(--c-danger)' }}>{sl.lopDays}</Td>
                    <Td>₹{(sl.gross || 0).toLocaleString('en-IN')}</Td>
                    <Td style={{ color: 'var(--t-secondary)' }}>₹{(sl.pf || 0).toLocaleString('en-IN')}</Td>
                    <Td style={{ color: 'var(--t-secondary)' }}>₹{(sl.esi || 0).toLocaleString('en-IN')}</Td>
                    <Td style={{ color: 'var(--t-secondary)' }}>₹{(sl.tds || 0).toLocaleString('en-IN')}</Td>
                    <Td style={{ fontWeight: 800, color: 'var(--c-teal)' }}>₹{(sl.net || 0).toLocaleString('en-IN')}</Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-subtle)' }}>
                  <td colSpan={5} style={{ padding: '9px 14px', fontWeight: 700, textAlign: 'right', fontSize: 12 }}>Total</td>
                  <td style={{ padding: '9px 14px', fontWeight: 800 }}>₹{(run.totalGross || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '9px 14px', fontWeight: 700 }}>₹{(run.slips || []).reduce((s, sl) => s + sl.pf, 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '9px 14px', fontWeight: 700 }}>₹{(run.slips || []).reduce((s, sl) => s + sl.esi, 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '9px 14px', fontWeight: 700 }}>₹{(run.slips || []).reduce((s, sl) => s + sl.tds, 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '9px 14px', fontWeight: 800, color: 'var(--c-teal)' }}>₹{(run.totalNet || 0).toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 48, textAlign: 'center', color: 'var(--t-muted)', fontSize: 13 }}>
          No payroll generated for {selMonth}. Click Generate Payroll to compute salary slips.
        </div>
      )}
    </div>
  );
}

// ── SALARY SLIPS ──────────────────────────────────────────────────────────
function SalarySlipsTab({ viewOnly }) {
  const { payrollRuns, employees, activeEntity, addToast } = useAppStore();
  const [selRun, setSelRun] = useState('');
  const [selEmp, setSelEmp] = useState('');

  const run = payrollRuns.find(r => String(r.id) === selRun);
  const slips = run?.slips || [];
  const filteredSlips = selEmp ? slips.filter(s => String(s.empId) === selEmp) : slips;

  async function downloadSlip(slip) {
    // In production: call docEngine to generate DOCX salary slip
    addToast(`Generating slip for ${slip.empName}…`);
    setTimeout(() => addToast('Salary slip ready — print on letterhead', 'success'), 800);
  }

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-dark)', marginBottom: 16 }}>Salary Slips</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select value={selRun} onChange={e => setSelRun(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', fontSize: 12, minWidth: 200 }}>
          <option value="">— Select Payroll Month —</option>
          {payrollRuns.map(r => <option key={r.id} value={r.id}>{r.month} ({r.status})</option>)}
        </select>
        <select value={selEmp} onChange={e => setSelEmp(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', fontSize: 12, minWidth: 200 }}>
          <option value="">All Employees</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        {run && <Btn onClick={() => filteredSlips.forEach(s => downloadSlip(s))} small><Download size={12} /> Bulk Download DOCX</Btn>}
      </div>

      {filteredSlips.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {filteredSlips.map(sl => (
            <div key={sl.empId} style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--c-dark)' }}>{sl.empName}</div>
                  <div style={{ fontSize: 10, color: 'var(--t-muted)' }}>{sl.empCode} · {sl.department}</div>
                </div>
                <button onClick={() => downloadSlip(sl)} style={{ background: 'var(--c-success-light)', color: 'var(--c-teal)', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}><Download size={11} /></button>
              </div>
              {[['Gross', sl.gross, 'var(--c-success)'], ['PF Dedn.', sl.pf, 'var(--t-secondary)'], ['ESI Dedn.', sl.esi, 'var(--t-secondary)'], ['Net Pay', sl.net, 'var(--c-teal)']].map(([l, v, c]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: 'var(--t-secondary)' }}>{l}</span>
                  <span style={{ fontWeight: 700, color: c }}>₹{(v || 0).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 48, textAlign: 'center', color: 'var(--t-muted)', fontSize: 13 }}>Select a payroll month to view salary slips.</div>
      )}
    </div>
  );
}

// ── EMPLOYEE LOANS ────────────────────────────────────────────────────────
function LoansTab({ viewOnly }) {
  const { employeeLoans, setEmployeeLoans, employees, addToast, user } = useAppStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ empId: '', amount: '', emi: '', tenure: '', disbursedDate: new Date().toISOString().split('T')[0], purpose: '', status: 'active' });

  function saveLoan() {
    if (!form.empId || !form.amount) { addToast('Employee and amount required', 'error'); return; }
    setEmployeeLoans(prev => [...prev, { ...form, id: Date.now(), amount: Number(form.amount), emi: Number(form.emi), recovered: 0, balance: Number(form.amount), approvedBy: user?.full_name }]);
    addToast('Loan recorded'); setModal(false);
  }

  function recoverEMI(id) {
    setEmployeeLoans(prev => prev.map(l => {
      if (l.id !== id) return l;
      const recovered = (l.recovered || 0) + (l.emi || 0);
      return { ...l, recovered, balance: l.amount - recovered, status: recovered >= l.amount ? 'closed' : 'active' };
    }));
    addToast('EMI recovery recorded');
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-dark)' }}>Employee Loans & Advances</div>
        {!viewOnly && <Btn onClick={() => { setForm({ empId: '', amount: '', emi: '', tenure: '', disbursedDate: new Date().toISOString().split('T')[0], purpose: '', status: 'active' }); setModal(true); }} small><Plus size={12} /> Add Loan</Btn>}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>Employee</Th><Th>Loan Amount</Th><Th>EMI</Th><Th>Recovered</Th><Th>Balance</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {employeeLoans.map(l => {
              const emp = employees.find(e => String(e.id) === String(l.empId));
              return (
                <tr key={l.id}>
                  <Td style={{ fontWeight: 600 }}>{emp?.name || '—'}</Td>
                  <Td style={{ fontWeight: 600 }}>₹{(l.amount || 0).toLocaleString('en-IN')}</Td>
                  <Td>₹{(l.emi || 0).toLocaleString('en-IN')}/mo</Td>
                  <Td style={{ color: 'var(--c-success)', fontWeight: 600 }}>₹{(l.recovered || 0).toLocaleString('en-IN')}</Td>
                  <Td style={{ fontWeight: 700, color: l.balance > 0 ? 'var(--c-danger)' : 'var(--c-success)' }}>₹{(l.balance || 0).toLocaleString('en-IN')}</Td>
                  <Td><Badge label={l.status} color={l.status === 'closed' ? 'var(--c-success)' : 'var(--c-warning)'} /></Td>
                  <Td>
                    {!viewOnly && l.status === 'active' && (
                      <button onClick={() => recoverEMI(l.id)} style={{ background: 'var(--c-success-light)', color: 'var(--c-success)', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Recover EMI</button>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {employeeLoans.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--t-muted)', fontSize: 13 }}>No employee loans recorded.</div>}
      </div>

      {modal && (
        <ModalOverlay onClose={() => setModal(false)} title="Record Employee Loan">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Employee *" value={form.empId} onChange={v => setForm(f => ({ ...f, empId: v }))} options={[{ value: '', label: '— Select —' }, ...employees.map(e => ({ value: e.id, label: e.name }))]} />
            <FormField label="Loan Amount (₹) *" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} type="number" />
            <FormField label="Monthly EMI (₹)" value={form.emi} onChange={v => setForm(f => ({ ...f, emi: v }))} type="number" />
            <FormField label="Tenure (months)" value={form.tenure} onChange={v => setForm(f => ({ ...f, tenure: v }))} type="number" />
            <FormField label="Disbursed Date" value={form.disbursedDate} onChange={v => setForm(f => ({ ...f, disbursedDate: v }))} type="date" />
            <FormField label="Purpose" value={form.purpose} onChange={v => setForm(f => ({ ...f, purpose: v }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn onClick={() => setModal(false)} color="var(--t-secondary)" small>Cancel</Btn>
            <Btn onClick={saveLoan} small>Save Loan</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
