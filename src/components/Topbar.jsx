import React, { useMemo, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { Bell, Search, ChevronDown } from 'lucide-react';

const MODULE_LABELS = {
  dashboard: 'Dashboard',
  sales: 'Sales',
  finance: 'Finance',
  construction: 'Construction',
  hr: 'HR',
  admin: 'Admin',
};

const SUBTAB_LABELS = {
  crm: 'CRM & Leads',
  inventory: 'Inventory',
  bookings: 'Bookings',
  collections: 'Collections',
  brokers: 'Brokers',
  documents: 'Documents',
  coa: 'Chart of Accounts',
  ledger: 'Ledger & Journal',
  bank: 'Bank & Recon',
  trialbalance: 'Trial Balance',
  pandl: 'P&L Statement',
  balancesheet: 'Balance Sheet',
  cashflow: 'Cash Flow',
  gst: 'GST Suite',
  tds: 'TDS Register',
  expenses: 'Expense Claims',
  vendoradvance: 'Vendor Advances',
  projects: 'Projects',
  boq: 'BOQ',
  indent: 'Material Indent',
  procurement: 'Procurement & PO',
  grn: 'GRN',
  stock: 'Stock Ledger',
  workorders: 'Work Orders',
  labour: 'Labour Report',
  sitephotos: 'Site Photos',
  employees: 'Employees',
  attendance: 'Attendance',
  leave: 'Leave',
  payroll: 'Payroll',
  salaryslips: 'Salary Slips',
  hrloans: 'Loans & Advances',
  entities: 'Entities & Users',
  modulelocks: 'Module Locks',
  mis: 'MIS & Reports',
  auditlog: 'Audit Log',
  backup: 'Backup Manager',
  tallyimport: 'Tally Import',
  notifications: 'Notifications',
};

function IconBtn({ children, onClick, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        border: '1px solid #F1F1F4',
        background: '#fff',
        color: '#4B5675',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#F9FAFB';
        e.currentTarget.style.color = '#071437';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#fff';
        e.currentTarget.style.color = '#4B5675';
      }}
    >
      {children}
    </button>
  );
}

export default function Topbar({ moduleLabel, onToggleMobileSidebar }) {
  const {
    user,
    notifications,
    activeEntity,
    activeModule,
    activeSubTab,
    setSearchOpen,
    markAllNotifRead,
    markNotifRead,
    setActiveModule,
    logout,
  } = useAppStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const unread = (notifications || []).filter(n => !n.read).length;
  const crumbModule = moduleLabel || MODULE_LABELS[activeModule] || 'Dashboard';
  const crumbSub = SUBTAB_LABELS[activeSubTab] || null;

  const crumbTrail = useMemo(() => {
    const out = ['Home', crumbModule];
    if (crumbSub) out.push(crumbSub);
    return out;
  }, [crumbModule, crumbSub]);

  function handleNotifClick(n) {
    markNotifRead(n.id);
    setNotifOpen(false);
    if (n.module) setActiveModule(n.module, n.subTab || null);
  }

  function closeOverlays() {
    setNotifOpen(false);
    setUserOpen(false);
  }

  return (
    <header
      style={{
        background: '#fff',
        borderBottom: '1px solid #F1F1F4',
        padding: '0 20px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        position: 'relative',
        zIndex: 18,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={onToggleMobileSidebar}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1px solid #F1F1F4',
            background: '#fff',
            color: '#4B5675',
            cursor: 'pointer',
            display: 'none',
          }}
          className="topbar-mobile-toggle"
        >
          ☰
        </button>
        <style>{`.topbar-mobile-toggle{display:none;}@media (max-width:768px){.topbar-mobile-toggle{display:flex !important;align-items:center;justify-content:center;}.topbar-user-name{display:none !important;}}`}</style>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {crumbTrail.map((item, idx) => {
            const isLast = idx === crumbTrail.length - 1;
            return (
              <React.Fragment key={`${item}-${idx}`}>
                {idx > 0 && <span style={{ color: '#DBDFE9', fontSize: 14 }}>›</span>}
                <span
                  style={{
                    fontSize: 12.5,
                    color: isLast ? '#071437' : '#99A1B7',
                    fontWeight: isLast ? 600 : 500,
                    cursor: isLast ? 'default' : 'pointer',
                  }}
                >
                  {item}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <IconBtn title="Global Search" onClick={() => setSearchOpen(true)}>
          <Search size={15} />
        </IconBtn>

        <div style={{ position: 'relative' }}>
          <IconBtn title="Notifications" onClick={() => setNotifOpen(o => !o)}>
            <Bell size={15} />
          </IconBtn>
          {unread > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 16,
                height: 16,
                background: '#F8285A',
                borderRadius: '50%',
                fontSize: 9,
                fontWeight: 700,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}

          {notifOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 42,
                width: 340,
                background: '#fff',
                border: '1px solid #F1F1F4',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #FCFCFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 13, color: '#071437' }}>
                  Notifications
                </span>
                {unread > 0 ? (
                  <button
                    onClick={markAllNotifRead}
                    style={{
                      fontSize: 10.5,
                      color: '#1B84FF',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Mark all read
                  </button>
                ) : null}
              </div>
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {(notifications || []).length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#78829D', fontSize: 12 }}>
                    No notifications
                  </div>
                ) : (
                  (notifications || []).slice(0, 30).map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid #FCFCFC',
                        background: n.read ? '#fff' : '#EEF6FF',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: n.read ? '#DBDFE9' : '#1B84FF',
                          marginTop: 4,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: n.read ? 400 : 600, color: '#071437' }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: 10, color: '#78829D', marginTop: 2 }}>
                          {new Date(n.ts).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 28, background: '#F1F1F4' }} />

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setUserOpen(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid #F1F1F4',
              borderRadius: 8,
              padding: '4px 8px 4px 4px',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1B84FF, #7239EA)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <span className="topbar-user-name" style={{ fontSize: 13, fontWeight: 600, color: '#071437' }}>
              {user?.full_name || 'User'}
            </span>
            <ChevronDown size={14} style={{ color: '#99A1B7' }} />
          </button>

          {userOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 42,
                width: 200,
                background: '#fff',
                border: '1px solid #F1F1F4',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F1F4' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#071437' }}>{user?.full_name || 'User'}</div>
                <div style={{ fontSize: 10.5, color: '#99A1B7', marginTop: 2 }}>
                  {activeEntity?.code ? `${activeEntity.code} • ` : ''}{user?.role?.replace(/_/g, ' ') || ''}
                </div>
              </div>
              {['Profile', 'Settings'].map(item => (
                <button
                  key={item}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: '#fff',
                    textAlign: 'left',
                    padding: '9px 12px',
                    cursor: 'pointer',
                    color: '#252F4A',
                    fontSize: 12.5,
                  }}
                >
                  {item}
                </button>
              ))}
              <div style={{ height: 1, background: '#F1F1F4' }} />
              <button
                onClick={logout}
                style={{
                  width: '100%',
                  border: 'none',
                  background: '#fff',
                  textAlign: 'left',
                  padding: '9px 12px',
                  cursor: 'pointer',
                  color: '#F8285A',
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
      {(notifOpen || userOpen) && (
        <div
          onClick={closeOverlays}
          style={{ position: 'fixed', inset: 0, zIndex: -1 }}
        />
      )}
    </header>
  );
}
