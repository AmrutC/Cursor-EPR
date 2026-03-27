// ─────────────────────────────────────────────────────────────────────────
// Vision Grroup ERP v5.0 — Production Data Store
// 4 entities | All live data starts empty
// ─────────────────────────────────────────────────────────────────────────

export const ENTITIES = [
  {
    id: 1, code: 'VEH', name: 'Vision Estate Holdings Pvt Ltd',
    gstin: '', pan: '', cin_llpin: 'U45400MH2024PTC000001',
    email: '', phone: '',
    address: 'Panvel, Raigad, Maharashtra 410206',
    authorized_signatory: 'Director', designation: 'Director',
    type: 'pvt_ltd',
  },
  {
    id: 2, code: 'VL', name: 'Vision Lifespaces Pvt Ltd',
    gstin: '', pan: '', cin_llpin: '',
    email: '', phone: '', address: '',
    authorized_signatory: 'Director', designation: 'Director',
    type: 'pvt_ltd',
  },
  {
    id: 3, code: 'ME', name: 'Mangaldeep Enterprises',
    gstin: '', pan: '', cin_llpin: '',
    email: '', phone: '', address: '',
    authorized_signatory: 'Proprietor', designation: 'Proprietor',
    type: 'proprietorship',
  },
  {
    id: 4, code: 'VU', name: 'Vision Urbanspaces LLP',
    gstin: '', pan: '', cin_llpin: '',
    email: '', phone: '', address: '',
    authorized_signatory: 'Partner', designation: 'Partner',
    type: 'llp',
  },
];

export const USERS = [
  {
    id: 1, username: 'admin', password: 'Admin@1234',
    full_name: 'System Administrator', role: 'super_admin',
    entity_access: [1, 2, 3, 4], email: '', phone: '', is_active: true,
  },
  {
    id: 2, username: 'director', password: 'Director@1234',
    full_name: 'Director', role: 'director',
    entity_access: [1, 2, 3, 4], email: '', phone: '', is_active: true,
  },
  {
    id: 3, username: 'accounts', password: 'Acc@1234',
    full_name: 'Accounts Manager', role: 'accounts_manager',
    entity_access: [1, 2, 3, 4], email: '', phone: '', is_active: true,
  },
];

// ── FY HELPER ──────────────────────────────────────────────────────────────
export function fyString() {
  const y = new Date().getFullYear(), m = new Date().getMonth();
  const s = m >= 3 ? y : y - 1;
  return `${String(s).slice(2)}-${String(s + 1).slice(2)}`;
}

// ── NUMBER GENERATORS ─────────────────────────────────────────────────────
export function makeSerial(prefix, counters, key, pad = 3) {
  const n = (counters[key] || 0) + 1;
  counters[key] = n;
  return `${prefix}/${fyString()}/${key.toUpperCase()}/${String(n).padStart(pad, '0')}`;
}

export function nextBookingNo(code = 'VEH', n = 1) {
  return `BKG/${code}/${fyString()}/${String(n).padStart(3, '0')}`;
}

// ── ROLE PERMISSIONS ──────────────────────────────────────────────────────
export const ROLE_PERMS = {
  super_admin:      { admin: true,  canRegisterProject: true,  canApproveBooking: true,  canEditProject: true,  canCancelBooking: true  },
  director:         { admin: true,  canRegisterProject: true,  canApproveBooking: true,  canEditProject: true,  canCancelBooking: true  },
  accounts_manager: { admin: false, canRegisterProject: false, canApproveBooking: false, canEditProject: false, canCancelBooking: false },
  sales_executive:  { admin: false, canRegisterProject: false, canApproveBooking: false, canEditProject: false, canCancelBooking: false },
  hr_manager:       { admin: false, canRegisterProject: false, canApproveBooking: false, canEditProject: false, canCancelBooking: false },
  site_supervisor:  { admin: false, canRegisterProject: false, canApproveBooking: false, canEditProject: false, canCancelBooking: false },
  broker:           { admin: false, canRegisterProject: false, canApproveBooking: false, canEditProject: false, canCancelBooking: false },
  legal_doc_user:   { admin: false, canRegisterProject: false, canApproveBooking: false, canEditProject: false, canCancelBooking: false },
};

export function can(user, perm) {
  if (!user) return false;
  return !!(ROLE_PERMS[user.role]?.[perm]);
}

// ── ROLE LABELS ───────────────────────────────────────────────────────────
export const ROLE_LABELS = {
  super_admin:      'Super Admin',
  director:         'Director',
  accounts_manager: 'Accounts Manager',
  sales_executive:  'Sales Executive',
  hr_manager:       'HR Manager',
  site_supervisor:  'Site Supervisor',
  broker:           'Broker',
  legal_doc_user:   'Legal / Doc User',
};

// ── V5 NAV CONFIG — 6 MODULES ─────────────────────────────────────────────
export const NAV_CONFIG_V5 = {
  super_admin:      ['dashboard', 'sales', 'finance', 'construction', 'hr', 'admin'],
  director:         ['dashboard', 'sales', 'finance', 'construction', 'hr', 'admin'],
  accounts_manager: ['dashboard', 'sales', 'finance'],
  sales_executive:  ['dashboard', 'sales'],
  hr_manager:       ['dashboard', 'hr'],
  site_supervisor:  ['dashboard', 'construction'],
  broker:           ['dashboard', 'sales'],
  legal_doc_user:   ['dashboard', 'sales'],
};

export function getNavModules(role) {
  return NAV_CONFIG_V5[role] || ['dashboard'];
}

// ── GST RATE RULE ─────────────────────────────────────────────────────────
export function suggestGSTRate(unitType, agreementValue) {
  if (unitType === 'Shop' || unitType === 'Office') return 5;
  return Number(agreementValue) <= 4500000 ? 1 : 5;
}

// ── VALIDATION ────────────────────────────────────────────────────────────
export const VALIDATE = {
  pan:      v => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test((v || '').toUpperCase().trim()),
  gstin:    v => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test((v || '').toUpperCase().trim()),
  phone:    v => /^[6-9]\d{9}$/.test((v || '').trim()),
  email:    v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim()),
  ifsc:     v => /^[A-Z]{4}0[A-Z0-9]{6}$/.test((v || '').toUpperCase().trim()),
};

// ── STANDARD COA (Real Estate) ────────────────────────────────────────────
export const STANDARD_COA = [
  // Assets
  { code: 'A001', name: 'Land Cost',              group: 'Assets', subGroup: 'Fixed Assets',   type: 'asset' },
  { code: 'A002', name: 'WIP - Construction',     group: 'Assets', subGroup: 'Current Assets', type: 'asset' },
  { code: 'A003', name: 'Cash in Hand',           group: 'Assets', subGroup: 'Current Assets', type: 'asset' },
  { code: 'A004', name: 'Bank Account',           group: 'Assets', subGroup: 'Current Assets', type: 'asset' },
  { code: 'A005', name: 'Receivables',            group: 'Assets', subGroup: 'Current Assets', type: 'asset' },
  { code: 'A006', name: 'Advances Paid',          group: 'Assets', subGroup: 'Current Assets', type: 'asset' },
  { code: 'A007', name: 'TDS Receivable',         group: 'Assets', subGroup: 'Current Assets', type: 'asset' },
  { code: 'A008', name: 'Furniture & Fixtures',   group: 'Assets', subGroup: 'Fixed Assets',   type: 'asset' },
  { code: 'A009', name: 'Computers & Equipment',  group: 'Assets', subGroup: 'Fixed Assets',   type: 'asset' },
  // Liabilities
  { code: 'L001', name: 'Customer Advances',      group: 'Liabilities', subGroup: 'Current Liabilities', type: 'liability' },
  { code: 'L002', name: 'Creditors - Vendors',    group: 'Liabilities', subGroup: 'Current Liabilities', type: 'liability' },
  { code: 'L003', name: 'TDS Payable',            group: 'Liabilities', subGroup: 'Current Liabilities', type: 'liability' },
  { code: 'L004', name: 'GST Payable',            group: 'Liabilities', subGroup: 'Current Liabilities', type: 'liability' },
  { code: 'L005', name: 'Loan - Bank',            group: 'Liabilities', subGroup: 'Long Term Liabilities', type: 'liability' },
  { code: 'L006', name: 'Loan - Director',        group: 'Liabilities', subGroup: 'Long Term Liabilities', type: 'liability' },
  // Capital
  { code: 'C001', name: 'Share Capital',          group: 'Capital', subGroup: 'Capital',       type: 'capital' },
  { code: 'C002', name: 'Retained Earnings',      group: 'Capital', subGroup: 'Capital',       type: 'capital' },
  { code: 'C003', name: 'Directors Drawings',     group: 'Capital', subGroup: 'Capital',       type: 'capital' },
  // Income
  { code: 'I001', name: 'Sales Income - Flats',   group: 'Income', subGroup: 'Direct Income',  type: 'income' },
  { code: 'I002', name: 'Sales Income - Shops',   group: 'Income', subGroup: 'Direct Income',  type: 'income' },
  { code: 'I003', name: 'Interest Income',        group: 'Income', subGroup: 'Other Income',   type: 'income' },
  { code: 'I004', name: 'Miscellaneous Income',   group: 'Income', subGroup: 'Other Income',   type: 'income' },
  // Expenses
  { code: 'E001', name: 'Construction Cost',      group: 'Expenses', subGroup: 'Direct Expenses',    type: 'expense' },
  { code: 'E002', name: 'Material Cost',          group: 'Expenses', subGroup: 'Direct Expenses',    type: 'expense' },
  { code: 'E003', name: 'Labour Cost',            group: 'Expenses', subGroup: 'Direct Expenses',    type: 'expense' },
  { code: 'E004', name: 'Subcontractor Cost',     group: 'Expenses', subGroup: 'Direct Expenses',    type: 'expense' },
  { code: 'E005', name: 'Salaries & Wages',       group: 'Expenses', subGroup: 'Operating Expenses', type: 'expense' },
  { code: 'E006', name: 'Office Rent',            group: 'Expenses', subGroup: 'Operating Expenses', type: 'expense' },
  { code: 'E007', name: 'Marketing & Advertising',group: 'Expenses', subGroup: 'Operating Expenses', type: 'expense' },
  { code: 'E008', name: 'Legal & Professional',   group: 'Expenses', subGroup: 'Operating Expenses', type: 'expense' },
  { code: 'E009', name: 'Bank Interest',          group: 'Expenses', subGroup: 'Finance Charges',    type: 'expense' },
  { code: 'E010', name: 'Depreciation',           group: 'Expenses', subGroup: 'Finance Charges',    type: 'expense' },
  { code: 'E011', name: 'Petty Expenses',         group: 'Expenses', subGroup: 'Operating Expenses', type: 'expense' },
  { code: 'E012', name: 'Brokerage Commission',   group: 'Expenses', subGroup: 'Operating Expenses', type: 'expense' },
];

// ── TDS SECTIONS ──────────────────────────────────────────────────────────
export const TDS_SECTIONS = {
  '194C': { label: '194C - Contractor', rate_individual: 1, rate_company: 2 },
  '194I': { label: '194I - Rent', rate: 10 },
  '194IA': { label: '194IA - Property Purchase', rate: 1, threshold: 5000000 },
  '194J': { label: '194J - Professional', rate: 10 },
  '194H': { label: '194H - Brokerage', rate: 5 },
};

// ── NOTIFICATION TYPES ────────────────────────────────────────────────────
export const NOTIFICATION_TRIGGERS = [
  { type: 'overdue_payment',   label: 'Overdue milestone payments' },
  { type: 'pending_booking',   label: 'Pending booking approvals' },
  { type: 'pending_po',        label: 'Pending PO approvals' },
  { type: 'tds_due',          label: 'TDS due date (7th)' },
  { type: 'gst_filing',       label: 'GST filing reminder (10th/20th)' },
  { type: 'stock_shortage',   label: 'Material shortage alert' },
  { type: 'crm_followup',     label: 'CRM follow-up due' },
  { type: 'grn_awaited',      label: 'Awaited material delivery' },
];
