import React, { useMemo, useState } from 'react';
import { useAppStore, getNavModules } from '../stores/appStore';
import {
  LayoutDashboard, ShoppingBag, DollarSign, HardHat, Users, Settings,
  ChevronDown, ChevronRight, LogOut,
  UserCheck, TrendingUp, BookOpen, Layers, FileText, BarChart3, Receipt,
  Truck, ClipboardList, Package, Wrench, Camera, Building2,
  Landmark, Scale, PieChart, Activity, CreditCard, BadgeCheck,
  CalendarCheck, Award, AlertCircle, Bell, Shield,
} from 'lucide-react';

const MODULES = [
  {
    id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#F6C000',
    subTabs: [],
  },
  {
    id: 'sales', label: 'Sales', icon: ShoppingBag, color: '#1B84FF',
    subTabs: [
      { id: 'crm', label: 'CRM & Leads', icon: UserCheck },
      { id: 'inventory', label: 'Inventory', icon: Building2 },
      { id: 'bookings', label: 'Bookings', icon: BookOpen },
      { id: 'collections', label: 'Collections', icon: TrendingUp },
      { id: 'brokers', label: 'Brokers', icon: BadgeCheck },
      { id: 'documents', label: 'Documents', icon: FileText },
    ],
  },
  {
    id: 'finance', label: 'Finance & Accounts', icon: DollarSign, color: '#17C653',
    subTabs: [
      { id: 'coa', label: 'Chart of Accounts', icon: Layers },
      { id: 'ledger', label: 'Ledger & Journal', icon: BookOpen },
      { id: 'bank', label: 'Bank & Recon', icon: Landmark },
      { id: 'trialbalance', label: 'Trial Balance', icon: Scale },
      { id: 'pandl', label: 'P&L Statement', icon: BarChart3 },
      { id: 'balancesheet', label: 'Balance Sheet', icon: PieChart },
      { id: 'cashflow', label: 'Cash Flow', icon: Activity },
      { id: 'gst', label: 'GST Suite', icon: Receipt },
      { id: 'tds', label: 'TDS Register', icon: CreditCard },
      { id: 'expenses', label: 'Expense Claims', icon: ClipboardList },
      { id: 'vendoradvance', label: 'Vendor Advances', icon: Package },
    ],
  },
  {
    id: 'construction', label: 'Construction', icon: HardHat, color: '#7239EA',
    subTabs: [
      { id: 'projects', label: 'Projects', icon: Building2 },
      { id: 'boq', label: 'BOQ', icon: ClipboardList },
      { id: 'indent', label: 'Material Indent', icon: Package },
      { id: 'procurement', label: 'Procurement & PO', icon: Truck },
      { id: 'grn', label: 'GRN', icon: ClipboardList },
      { id: 'stock', label: 'Stock Ledger', icon: Layers },
      { id: 'workorders', label: 'Work Orders', icon: Wrench },
      { id: 'labour', label: 'Labour Report', icon: Users },
      { id: 'sitephotos', label: 'Site Photos', icon: Camera },
    ],
  },
  {
    id: 'hr', label: 'Human Resources', icon: Users, color: '#0E9F8A',
    subTabs: [
      { id: 'employees', label: 'Employees', icon: UserCheck },
      { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
      { id: 'leave', label: 'Leave', icon: Award },
      { id: 'payroll', label: 'Payroll', icon: DollarSign },
      { id: 'salaryslips', label: 'Salary Slips', icon: FileText },
      { id: 'hrloans', label: 'Loans & Advances', icon: CreditCard },
    ],
  },
  {
    id: 'admin', label: 'Admin', icon: Settings, color: '#F8285A',
    subTabs: [
      { id: 'entities', label: 'Entities & Users', icon: Building2 },
      { id: 'modulelocks', label: 'Module Locks', icon: Shield },
      { id: 'mis', label: 'MIS & Reports', icon: BarChart3 },
      { id: 'auditlog', label: 'Audit Log', icon: ClipboardList },
      { id: 'backup', label: 'Backup Manager', icon: AlertCircle },
      { id: 'tallyimport', label: 'Tally Import', icon: Layers },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ],
  },
];

const SECTION_LABELS = {
  modules: 'Modules',
  management: 'Management',
};

export default function Sidebar({
  collapsed,
  setCollapsed,
  isMobile = false,
  onCloseMobile,
}) {
  const {
    user,
    entities,
    activeEntity,
    activeModule,
    activeSubTab,
    setActiveEntity,
    setActiveModule,
    logout,
    moduleLocks,
  } = useAppStore();
  const [openModules, setOpenModules] = useState({ [activeModule]: true });
  const [hoveredModule, setHoveredModule] = useState(null);
  const [entityOpen, setEntityOpen] = useState(false);

  const navModules = getNavModules(user?.role) || ['dashboard'];
  const entityLocks = (moduleLocks || {})[activeEntity?.code] || {};
  const sideW = collapsed ? 72 : 265;

  const visibleModules = useMemo(
    () =>
      MODULES
        .filter(m => navModules.includes(m.id))
        .filter(m => {
          if (m.id !== 'dashboard' && m.id !== 'admin') {
            const lockStatus = entityLocks[m.id] || 'active';
            if (lockStatus === 'locked' && user?.role !== 'super_admin') return false;
          }
          return true;
        })
        .map(m => ({ ...m, section: m.id === 'admin' ? 'management' : 'modules' })),
    [navModules, entityLocks, user?.role],
  );

  function handleModuleClick(mod) {
    if (mod.subTabs.length === 0) {
      setActiveModule(mod.id, null);
      setOpenModules({ [mod.id]: true });
    } else {
      const isOpen = openModules[mod.id];
      setOpenModules(prev => ({ ...prev, [mod.id]: !isOpen }));
      if (!isOpen || activeModule !== mod.id) {
        setActiveModule(mod.id, mod.subTabs[0]?.id);
      }
    }
    if (isMobile) onCloseMobile?.();
  }

  function handleSubTabClick(modId, subId) {
    setActiveModule(modId, subId);
    if (isMobile) onCloseMobile?.();
  }

  return (
    <aside style={{
      width: sideW, minWidth: sideW, maxWidth: sideW,
      background: '#FFFFFF', display: 'flex', flexDirection: 'column',
      flexShrink: 0, overflow: 'hidden', zIndex: 20,
      borderRight: '1px solid #F1F1F4',
      boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)',
    }}>
      {/* Logo */}
      <div style={{ height: 64, padding: collapsed ? '10px 12px' : '10px 14px', borderBottom: '1px solid #F1F1F4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #071437, #1B84FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#F6C000', fontWeight: 800, fontSize: 13 }}>VG</span>
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#071437', fontWeight: 800, fontSize: 14, lineHeight: 1.1, whiteSpace: 'nowrap' }}>Vision Group</div>
              <div style={{ color: '#99A1B7', fontSize: 9, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 2 }}>ERP v5.0</div>
            </div>
          )}
        </div>
        {!isMobile && (
          <button onClick={() => setCollapsed(c => !c)} style={{
            background: '#fff', border: '1px solid #F1F1F4', borderRadius: '50%',
            width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#99A1B7', flexShrink: 0,
          }}>
            <ChevronRight size={12} style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }} />
          </button>
        )}
      </div>

      {/* Entity switcher */}
      {!collapsed && (
        <div style={{ padding: '10px 12px' }}>
          <button
            onClick={() => setEntityOpen(o => !o)}
            style={{
              width: '100%',
              background: '#F9FAFB',
              border: `1px solid ${entityOpen ? '#1B84FF' : '#F1F1F4'}`,
              borderRadius: 10,
              padding: '10px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              {activeEntity?.code ? (
                <span style={{ background: '#071437', color: '#F6C000', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
                  {activeEntity.code}
                </span>
              ) : null}
              <span style={{ fontSize: 12, fontWeight: 600, color: '#071437', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeEntity?.name || 'Select entity'}
              </span>
            </div>
            <ChevronDown size={14} style={{ color: '#99A1B7', transform: entityOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
          {entityOpen && (
            <div style={{ marginTop: 6, background: '#fff', border: '1px solid #F1F1F4', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', overflow: 'hidden' }}>
              {entities.map(e => (
                <button
                  key={e.id}
                  onClick={() => {
                    setActiveEntity(e);
                    setEntityOpen(false);
                  }}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: String(e.id) === String(activeEntity?.id) ? '#EEF6FF' : '#fff',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ background: '#071437', color: '#F6C000', fontSize: 8.5, fontWeight: 800, padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>{e.code}</span>
                  <span style={{ fontSize: 11.5, color: '#252F4A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '10px 6px' : '6px 0' }}>
        {Object.keys(SECTION_LABELS).map(section => {
          const items = visibleModules.filter(m => m.section === section);
          if (!items.length) return null;
          return (
            <div key={section} style={{ marginBottom: 4 }}>
              {!collapsed && (
                <div style={{ fontSize: 9.5, fontWeight: 700, color: '#99A1B7', textTransform: 'uppercase', letterSpacing: '1px', padding: '12px 16px 4px' }}>
                  {SECTION_LABELS[section]}
                </div>
              )}
              {items.map(mod => {
                const Icon = mod.icon;
                const isActive = activeModule === mod.id;
                const isOpen = !!openModules[mod.id] && !collapsed;
                const lockStatus = entityLocks[mod.id] || 'active';
                const isHovered = hoveredModule === mod.id;
                return (
                  <div key={mod.id} style={{ position: 'relative' }}>
                    <button
                      onClick={() => handleModuleClick(mod)}
                      onMouseEnter={() => setHoveredModule(mod.id)}
                      onMouseLeave={() => setHoveredModule(null)}
                      style={{
                        width: collapsed ? 56 : 'calc(100% - 16px)',
                        margin: collapsed ? '1px auto' : '1px 8px',
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: collapsed ? 0 : 8,
                        border: 'none',
                        borderRadius: 8,
                        padding: collapsed ? 0 : '0 12px',
                        cursor: 'pointer',
                        background: isActive ? '#EEF6FF' : isHovered ? '#F9FAFB' : 'transparent',
                        color: isActive ? '#1B84FF' : '#4B5675',
                        fontSize: 13,
                        fontWeight: isActive ? 700 : 500,
                        transition: 'all 0.12s',
                      }}
                    >
                      <Icon size={16} style={{ color: isActive ? mod.color : '#4B5675', flexShrink: 0 }} />
                      {!collapsed && (
                        <>
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.label}</span>
                          {lockStatus === 'view_only' ? (
                            <span style={{ fontSize: 10, color: '#1B84FF', background: '#EEF6FF', borderRadius: 10, padding: '2px 8px' }}>View</span>
                          ) : null}
                          {mod.subTabs.length > 0 ? (
                            <ChevronRight size={14} style={{ color: '#99A1B7', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                          ) : null}
                        </>
                      )}
                    </button>

                    {/* Tooltip in collapsed mode */}
                    {collapsed && isHovered && (
                      <div style={{
                        position: 'absolute',
                        left: 64,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: '#071437',
                        color: '#fff',
                        fontSize: 11,
                        borderRadius: 6,
                        padding: '4px 10px',
                        whiteSpace: 'nowrap',
                        zIndex: 30,
                        pointerEvents: 'none',
                      }}>
                        {mod.label}
                      </div>
                    )}

                    {!collapsed && mod.subTabs.length > 0 && (
                      <div
                        style={{
                          maxHeight: isOpen ? 500 : 0,
                          overflow: 'hidden',
                          transition: 'max-height 0.2s ease',
                        }}
                      >
                        <div style={{ marginLeft: 28, borderLeft: '2px solid #F1F1F4', paddingLeft: 8, marginBottom: 2 }}>
                          {mod.subTabs.map(st => {
                            const SubIcon = st.icon;
                            const isSubActive = isActive && activeSubTab === st.id;
                            return (
                              <button
                                key={st.id}
                                onClick={() => handleSubTabClick(mod.id, st.id)}
                                style={{
                                  width: '100%',
                                  border: 'none',
                                  height: 34,
                                  background: isSubActive ? '#EEF6FF' : 'transparent',
                                  color: isSubActive ? '#1B84FF' : '#99A1B7',
                                  fontSize: 12,
                                  fontWeight: isSubActive ? 600 : 400,
                                  borderRadius: 8,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '0 10px',
                                  textAlign: 'left',
                                  marginBottom: 1,
                                }}
                              >
                                <span style={{ width: 2, alignSelf: 'stretch', background: isSubActive ? mod.color : 'transparent', borderRadius: 2 }} />
                                <SubIcon size={13} />
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: collapsed ? '8px 8px 10px' : '10px 12px', borderTop: '1px solid #F1F1F4' }}>
        {!collapsed ? (
          <div style={{ background: '#F9FAFB', border: '1px solid #F1F1F4', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1B84FF, #7239EA)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#071437', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name}</div>
              <div style={{ fontSize: 10, color: '#99A1B7', textTransform: 'capitalize' }}>{user?.role?.replace(/_/g, ' ')}</div>
            </div>
            <button
              onClick={logout}
              style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#99A1B7', cursor: 'pointer' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#FFE2E5';
                e.currentTarget.style.color = '#F8285A';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#99A1B7';
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            style={{ width: 56, height: 40, margin: '0 auto', border: '1px solid #F1F1F4', borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#99A1B7', cursor: 'pointer' }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#F8285A';
              e.currentTarget.style.background = '#FFE2E5';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#99A1B7';
              e.currentTarget.style.background = '#fff';
            }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>

      {/* Mobile close helper */}
      {isMobile && (
        <button
          onClick={onCloseMobile}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 28,
            height: 28,
            border: '1px solid #F1F1F4',
            borderRadius: 8,
            background: '#fff',
            color: '#99A1B7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label="Close sidebar"
        >
          ×
        </button>
      )}
    </aside>
  );
}
