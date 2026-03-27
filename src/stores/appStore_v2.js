import { create } from 'zustand';
import { PROJECTS, BOOKINGS, VENDORS, BROKERS, EMPLOYEES, LEDGER_ENTRIES } from '../data';

// Helper: supports both direct value and functional updater (arr => newArr)
function applyUpdate(current, arg) {
  if (Array.isArray(arg)) return arg;
  if (typeof arg === 'function') {
    const result = arg(Array.isArray(current) ? current : []);
    return Array.isArray(result) ? result : [];
  }
  return [];
}

export const useAppStore = create((set, get) => ({
  // ── AUTH ──────────────────────────────────────────────────────────────
  user:       null,
  setUser:    (user) => set({ user }),
  logout:     () => set({ user:null, activeEntity:null, activeModule:'dashboard', activeProject:null, pendingBookingUnit:null }),

  // ── ENTITY — locked at login ──────────────────────────────────────────
  activeEntity:      null,
  setActiveEntity:   (entity) => set({ activeEntity: entity }),
  availableEntities: [],
  setAvailableEntities: (list) => set({ availableEntities: list }),

  // ── CROSS-MODULE STATE ────────────────────────────────────────────────
  pendingBookingUnit:    null,
  setPendingBookingUnit: (unit) => set({ pendingBookingUnit: unit }),

  activeProject:    null,
  setActiveProject: (project) => set({ activeProject: project }),

  // ── NAVIGATION ────────────────────────────────────────────────────────
  activeModule:    'dashboard',
  setActiveModule: (mod) => set({ activeModule: mod }),

  // ── SHARED DATA ───────────────────────────────────────────────────────
  // All setters support both direct arrays AND functional updaters: set(arr => [...arr, item])
  projects:    [...PROJECTS],
  setProjects: (arg) => set(s => ({ projects: applyUpdate(s.projects, arg) })),

  // Users managed by AdminSetup (stored separately, entity_id=0 = global)
  users:       [],
  setUsers:    (arg) => set(s => ({ users: applyUpdate(s.users, arg) })),

  bookings:    [...BOOKINGS],
  setBookings: (arg) => set(s => ({ bookings: applyUpdate(s.bookings, arg) })),

  vendors:     [...VENDORS],
  setVendors:  (arg) => set(s => ({ vendors:  applyUpdate(s.vendors,  arg) })),

  brokers:     [...BROKERS],
  setBrokers:  (arg) => set(s => ({ brokers:  applyUpdate(s.brokers,  arg) })),

  employees:   [...EMPLOYEES],
  setEmployees:(arg) => set(s => ({ employees: applyUpdate(s.employees, arg) })),

  ledgerEntries:    [...LEDGER_ENTRIES],
  setLedgerEntries: (arg) => set(s => ({ ledgerEntries: applyUpdate(s.ledgerEntries, arg) })),

  // ── GST MODULE DATA ───────────────────────────────────────────────────
  // salesInvoices, purchaseInvoices, creditNotesIssued, creditNotesReceived,
  // rcmTransactions, advancesReceived, gstChallans, ewayBills stored here
  gstData: { salesInvoices:[], purchaseInvoices:[], creditNotesIssued:[], creditNotesReceived:[], rcmTransactions:[], advancesReceived:[], gstChallans:[], ewayBills:[] },
  setGstData: (arg) => set(s => {
    const data = typeof arg === 'function' ? arg(s.gstData) : { ...s.gstData, ...arg };
    return { gstData: data };
  }),

  // ── ONEDRIVE ──────────────────────────────────────────────────────────
  oneDrivePath:    null,
  setOneDrivePath: (p) => set({ oneDrivePath: p }),

  // ── TOAST ─────────────────────────────────────────────────────────────
  toasts:   [],
  addToast: (msg, type='success') => {
    const id = Date.now();
    set(s => ({ toasts: [...s.toasts, { id, msg, type }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3800);
  },
}));

// ── ROLE LABELS ───────────────────────────────────────────────────────────
export const ROLE_LABELS = {
  super_admin:      'Super Admin',
  director:         'Director',
  accounts_manager: 'Accounts Manager',
  sales_executive:  'Sales Executive',
  hr_manager:       'HR Manager',
  broker:           'Broker',
  legal_doc_user:   'Legal / Doc User',
};

// ── NAV CONFIG ────────────────────────────────────────────────────────────
export const NAV_CONFIG = {
  super_admin:      ['dashboard','crm','inventory','bookings','payments','documents','accounts','gst','hr','brokerage','vendors','mis','audit','communication','admin'],
  director:         ['dashboard','crm','inventory','bookings','payments','documents','accounts','gst','hr','brokerage','vendors','mis','audit','communication','admin'],
  accounts_manager: ['dashboard','bookings','payments','accounts','gst','vendors','mis'],
  sales_executive:  ['dashboard','crm','inventory','bookings'],
  hr_manager:       ['dashboard','hr'],
  broker:           ['dashboard','inventory','bookings'],
  legal_doc_user:   ['dashboard','crm','inventory','bookings','documents'],
};

export function getNavItems(role) {
  return NAV_CONFIG[role] || ['dashboard'];
}
