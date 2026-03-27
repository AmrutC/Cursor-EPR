import { create } from 'zustand';
import { ENTITIES, USERS, getNavModules, STANDARD_COA } from '../data.js';

const isElectron = () => typeof window !== 'undefined' && !!window.vgERP?.data?.save;

// ── DEBOUNCED SAVE HELPERS ────────────────────────────────────────────────
let globalSaveTimer = null;
function saveGlobal(getState) {
  if (!isElectron()) return;
  clearTimeout(globalSaveTimer);
  globalSaveTimer = setTimeout(() => {
    const s = getState();
    window.vgERP.data.saveGlobal({
      entities: s.entities, users: s.users,
      moduleLocks: s.moduleLocks, savedAt: new Date().toISOString(),
    }).catch(e => console.error('[Store] saveGlobal error:', e));
  }, 300);
}

let entitySaveTimer = null;
function saveEntityData(getState) {
  if (!isElectron()) return;
  clearTimeout(entitySaveTimer);
  entitySaveTimer = setTimeout(() => {
    const s = getState();
    const code = s.activeEntity?.code;
    if (!code) return;
    const payload = {
      // Sales
      projects: s.projects, bookings: s.bookings, crmLeads: s.crmLeads,
      brokers: s.brokers, siteVisits: s.siteVisits,
      // Finance
      coa: s.coa, journalEntries: s.journalEntries,
      bankAccounts: s.bankAccounts, bankTransactions: s.bankTransactions,
      tdsEntries: s.tdsEntries, expenseClaims: s.expenseClaims,
      pettyCache: s.pettyCache, vendorAdvances: s.vendorAdvances,
      gstData: s.gstData,
      // Construction
      vendors: s.vendors, materialIndents: s.materialIndents,
      purchaseOrders: s.purchaseOrders, grns: s.grns,
      stockLedger: s.stockLedger, workOrders: s.workOrders,
      labourReports: s.labourReports, sitePhotos: s.sitePhotos, boq: s.boq,
      // HR
      employees: s.employees, attendance: s.attendance,
      leaveApplications: s.leaveApplications,
      payrollRuns: s.payrollRuns, employeeLoans: s.employeeLoans,
      // Misc
      notifications: s.notifications, counters: s.counters,
      savedAt: new Date().toISOString(), entityCode: code,
    };
    window.vgERP.data.save(code, payload)
      .catch(e => console.error('[Store] save error:', e));
  }, 400);
}

function applyUpdate(current, arg) {
  if (Array.isArray(arg)) return arg;
  if (typeof arg === 'function') {
    const r = arg(Array.isArray(current) ? current : []);
    return Array.isArray(r) ? r : [];
  }
  return Array.isArray(current) ? current : [];
}

function makeSetters(set, get, fields, saveFunc) {
  const result = {};
  for (const field of fields) {
    const setter = 'set' + field.charAt(0).toUpperCase() + field.slice(1);
    result[setter] = (arg) => set(s => {
      const data = applyUpdate(s[field], arg);
      saveFunc(get);
      return { [field]: data };
    });
  }
  return result;
}

// ── EMPTY ENTITY DATA ─────────────────────────────────────────────────────
const EMPTY_ENTITY = {
  // Sales
  projects: [], bookings: [], crmLeads: [], brokers: [], siteVisits: [],
  // Finance
  coa: STANDARD_COA.map((a, i) => ({ ...a, id: i + 1, openingBalance: 0, openingDate: '', isSystem: true })),
  journalEntries: [], bankAccounts: [], bankTransactions: [],
  tdsEntries: [], expenseClaims: [], pettyCache: [], vendorAdvances: [],
  gstData: { salesInvoices:[], purchaseInvoices:[], creditNotesIssued:[], creditNotesReceived:[], rcmTransactions:[], advancesReceived:[], gstChallans:[], ewayBills:[] },
  // Construction
  vendors: [], materialIndents: [], purchaseOrders: [], grns: [],
  stockLedger: [], workOrders: [], labourReports: [], sitePhotos: [], boq: [],
  // HR
  employees: [], attendance: [], leaveApplications: [], payrollRuns: [], employeeLoans: [],
  // Misc
  notifications: [],
  counters: {},
};

export const useAppStore = create((set, get) => ({
  // ── AUTH ─────────────────────────────────────────────────────────────
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set(s => ({
    user: null, activeEntity: null, activeModule: 'dashboard', activeSubTab: null,
    subTabsByModule: {},
    dataLoaded: false, ...EMPTY_ENTITY,
    entities: s.entities, users: s.users, moduleLocks: s.moduleLocks,
  })),

  // ── GLOBAL ───────────────────────────────────────────────────────────
  entities: [...ENTITIES],
  users: [...USERS],
  moduleLocks: {}, // { entityCode: { moduleName: 'active'|'view_only'|'locked' } }

  setEntities: (arg) => set(s => { const data = applyUpdate(s.entities, arg); saveGlobal(get); return { entities: data }; }),
  addEntity: (e) => set(s => {
    const id = Math.max(0, ...s.entities.map(x => x.id)) + 1;
    const data = [...s.entities, { ...e, id, code: (e.code||'').toUpperCase().trim() }];
    saveGlobal(get); return { entities: data };
  }),
  updateEntity: (e) => set(s => {
    const data = s.entities.map(x => x.id === e.id ? { ...x, ...e } : x);
    saveGlobal(get); return { entities: data };
  }),
  setUsers: (arg) => set(s => { const data = applyUpdate(s.users, arg); saveGlobal(get); return { users: data }; }),
  setModuleLocks: (entityCode, locks) => set(s => {
    const ml = { ...s.moduleLocks, [entityCode]: locks };
    saveGlobal(get); return { moduleLocks: ml };
  }),

  // ── ENTITY SELECTION ─────────────────────────────────────────────────
  activeEntity: null,
  setActiveEntity: (e) => set({ activeEntity: e }),

  // ── NAVIGATION ───────────────────────────────────────────────────────
  activeModule: 'dashboard',
  activeSubTab: null,
  subTabsByModule: {},
  setActiveModule: (mod, subTab) => set(s => {
    const nextSub = subTab !== undefined ? subTab : (s.subTabsByModule[mod] || null);
    return {
      activeModule: mod,
      activeSubTab: nextSub,
      subTabsByModule: nextSub ? { ...s.subTabsByModule, [mod]: nextSub } : s.subTabsByModule,
    };
  }),
  setActiveSubTab: (tab) => set(s => ({
    activeSubTab: tab || null,
    subTabsByModule: tab ? { ...s.subTabsByModule, [s.activeModule]: tab } : s.subTabsByModule,
  })),

  // ── GLOBAL SEARCH ────────────────────────────────────────────────────
  searchOpen: false,
  setSearchOpen: (v) => set({ searchOpen: v }),

  // ── DATA LOAD STATE ──────────────────────────────────────────────────
  dataLoaded: false,
  oneDrivePath: null,
  setOneDrivePath: (p) => set({ oneDrivePath: p }),

  // ── ENTITY DATA SETTERS ──────────────────────────────────────────────
  ...EMPTY_ENTITY,

  // Individual setters for entity data fields
  ...makeSetters(set, get, [
    'projects','bookings','crmLeads','brokers','siteVisits',
    'coa','journalEntries','bankAccounts','bankTransactions',
    'tdsEntries','expenseClaims','pettyCache','vendorAdvances',
    'vendors','materialIndents','purchaseOrders','grns',
    'stockLedger','workOrders','labourReports','sitePhotos','boq',
    'employees','attendance','leaveApplications','payrollRuns','employeeLoans',
    'notifications',
  ], saveEntityData),

  setGstData: (arg) => set(s => {
    const data = typeof arg === 'function' ? arg(s.gstData) : { ...s.gstData, ...arg };
    saveEntityData(get); return { gstData: data };
  }),

  setCounters: (arg) => set(s => {
    const data = typeof arg === 'function' ? arg(s.counters) : { ...s.counters, ...arg };
    saveEntityData(get); return { counters: data };
  }),

  // ── COUNTER HELPER — auto-increments and saves ────────────────────────
  nextSerial(prefix, key, pad = 3) {
    const s = get();
    const fy = (() => { const y = new Date().getFullYear(), m = new Date().getMonth(); const st = m >= 3 ? y : y - 1; return `${String(st).slice(2)}-${String(st+1).slice(2)}`; })();
    const n = (s.counters[key] || 0) + 1;
    get().setCounters({ ...s.counters, [key]: n });
    return `${prefix}/${fy}/${key.toUpperCase()}/${String(n).padStart(pad, '0')}`;
  },

  // ── CROSS MODULE ──────────────────────────────────────────────────────
  pendingBookingUnit: null,
  setPendingBookingUnit: (u) => set({ pendingBookingUnit: u }),
  activeProject: null,
  setActiveProject: (p) => set({ activeProject: p }),

  // ── TOASTS ───────────────────────────────────────────────────────────
  toasts: [],
  addToast: (msg, type = 'success', durationMs) => {
    const id = Date.now() + Math.random();
    const durationByType = {
      success: 2500,
      error: 5000,
      warning: 4200,
      info: 3200,
    };
    const ttl = durationMs ?? durationByType[type] ?? 3200;
    set(s => ({ toasts: [...s.toasts, { id, msg, type, duration: ttl, createdAt: Date.now() }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), ttl);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  // ── AUDIT LOG ─────────────────────────────────────────────────────────
  auditLog: [],
  addAuditEntry: (entry) => set(s => ({
    auditLog: [{ ...entry, id: Date.now(), ts: new Date().toISOString(), user: s.user?.full_name || 'System' }, ...s.auditLog].slice(0, 2000),
  })),

  // ── LOAD GLOBAL ───────────────────────────────────────────────────────
  async loadGlobal() {
    if (!isElectron()) { set({ dataLoaded: true }); return; }
    try {
      const res = await window.vgERP.data.loadGlobal();
      if (res.ok && res.data) {
        const d = res.data;
        const updates = {};
        if (Array.isArray(d.entities) && d.entities.length > 0) updates.entities = d.entities;
        if (Array.isArray(d.users) && d.users.length > 0) updates.users = d.users;
        if (d.moduleLocks && typeof d.moduleLocks === 'object') updates.moduleLocks = d.moduleLocks;
        if (Object.keys(updates).length > 0) set(updates);
      }
    } catch (e) { console.warn('[Store] loadGlobal error:', e); }
  },

  // ── LOAD ENTITY DATA ──────────────────────────────────────────────────
  async loadFromFile(entityCode) {
    if (!isElectron()) { set({ dataLoaded: true }); return; }
    try {
      const res = await window.vgERP.data.load(entityCode);
      if (res.ok && res.data) {
        const d = res.data;
        const arr = (key) => Array.isArray(d[key]) ? d[key] : [];
        const obj = (key, def) => (d[key] && typeof d[key] === 'object') ? { ...def, ...d[key] } : def;
        set({
          projects: arr('projects'), bookings: arr('bookings'), crmLeads: arr('crmLeads'),
          brokers: arr('brokers'), siteVisits: arr('siteVisits'),
          coa: arr('coa').length > 0 ? arr('coa') : STANDARD_COA.map((a, i) => ({ ...a, id: i+1, openingBalance: 0, openingDate: '', isSystem: true })),
          journalEntries: arr('journalEntries'), bankAccounts: arr('bankAccounts'),
          bankTransactions: arr('bankTransactions'), tdsEntries: arr('tdsEntries'),
          expenseClaims: arr('expenseClaims'), pettyCache: arr('pettyCache'),
          vendorAdvances: arr('vendorAdvances'),
          gstData: obj('gstData', { salesInvoices:[], purchaseInvoices:[], creditNotesIssued:[], creditNotesReceived:[], rcmTransactions:[], advancesReceived:[], gstChallans:[], ewayBills:[] }),
          vendors: arr('vendors'), materialIndents: arr('materialIndents'),
          purchaseOrders: arr('purchaseOrders'), grns: arr('grns'),
          stockLedger: arr('stockLedger'), workOrders: arr('workOrders'),
          labourReports: arr('labourReports'), sitePhotos: arr('sitePhotos'), boq: arr('boq'),
          employees: arr('employees'), attendance: arr('attendance'),
          leaveApplications: arr('leaveApplications'), payrollRuns: arr('payrollRuns'),
          employeeLoans: arr('employeeLoans'), notifications: arr('notifications'),
          counters: obj('counters', {}),
          dataLoaded: true,
        });
        if (res.fromBackup) get().addToast('⚠ Loaded from backup file', 'warning');
      } else {
        set({ ...EMPTY_ENTITY, dataLoaded: true });
      }
    } catch (e) {
      console.error('[Store] loadFromFile error:', e);
      set({ dataLoaded: true });
    }
  },

  // ── NOTIFICATION HELPERS ──────────────────────────────────────────────
  addNotification(notif) {
    const id = Date.now();
    set(s => ({
      notifications: [{ ...notif, id, ts: new Date().toISOString(), read: false }, ...s.notifications].slice(0, 500),
    }));
    saveEntityData(get);
  },
  markNotifRead(id) {
    set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
    saveEntityData(get);
  },
  markAllNotifRead() {
    set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) }));
    saveEntityData(get);
  },
}));

export { getNavModules };
