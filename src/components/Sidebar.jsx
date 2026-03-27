import React, { useState } from 'react';
import { useAppStore, getNavModules } from '../stores/appStore';
import {
  LayoutDashboard, ShoppingBag, DollarSign, HardHat, Users, Settings,
  ChevronDown, ChevronRight, LogOut, Search, X,
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

export default function Sidebar() {
  const { user, activeEntity, activeModule, activeSubTab, setActiveModule, setActiveSubTab, logout, moduleLocks } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [openModules, setOpenModules] = useState({ [activeModule]: true });
  const [search, setSearch] = useState('');

  const navModules = getNavModules(user?.role) || ['dashboard'];
  const entityLocks = (moduleLocks || {})[activeEntity?.code] || {};

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
    setSearch('');
  }

  function handleSubTabClick(modId, subId) {
    setActiveModule(modId, subId);
  }

  const sideW = collapsed ? 52 : 228;
  const searchLower = search.toLowerCase().trim();

  return (
    <aside style={{
      width: sideW, minWidth: sideW, maxWidth: sideW,
      background: '#071437', display: 'flex', flexDirection: 'column',
      flexShrink: 0, overflow: 'hidden', zIndex: 20,
      transition: 'width 0.2s, min-width 0.2s',
    }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '12px 8px' : '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
        {!collapsed && (
          <div>
            <div style={{ color: '#F6C000', fontWeight: 800, fontSize: 13, lineHeight: 1 }}>Vision Grroup</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 2 }}>ERP v5.0</div>
          </div>
        )}
        <button onClick={() => setCollapsed(c => !c)} style={{
          background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 6,
          width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'rgba(255,255,255,0.5)', flexShrink: 0,
        }}>
          {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Entity badge */}
      {!collapsed && (
        <div style={{ padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 3 }}>Active Entity</div>
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 7, padding: '5px 9px', display: 'flex', alignItems: 'center', gap: 6 }}>
            {activeEntity?.code && (
              <span style={{ background: '#F6C000', color: '#071437', fontSize: 8.5, fontWeight: 800, padding: '2px 5px', borderRadius: 4, flexShrink: 0 }}>
                {activeEntity.code}
              </span>
            )}
            <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeEntity?.name || 'No entity'}
            </span>
          </div>
        </div>
      )}

      {/* Search */}
      {!collapsed && (
        <div style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={10} style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search… (Ctrl+K for full search)"
              style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '5px 24px 5px 24px', fontSize: 10.5, color: 'rgba(255,255,255,0.8)', outline: 'none', boxSizing: 'border-box' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0 }}>
                <X size={9} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '6px 4px' : '4px 0', scrollbarWidth: 'none' }}>
        {MODULES.filter(m => {
          if (!navModules.includes(m.id)) return false;
          if (m.id !== 'dashboard' && m.id !== 'admin') {
            const lockStatus = entityLocks[m.id] || 'active';
            if (lockStatus === 'locked' && user?.role !== 'super_admin') return false;
          }
          if (searchLower) {
            const matchMod = m.label.toLowerCase().includes(searchLower);
            const matchSub = m.subTabs.some(s => s.label.toLowerCase().includes(searchLower));
            return matchMod || matchSub;
          }
          return true;
        }).map(mod => {
          const Icon = mod.icon;
          const isActive = activeModule === mod.id;
          const isOpen = openModules[mod.id] && !collapsed;
          const lockStatus = entityLocks[mod.id] || 'active';

          return (
            <div key={mod.id}>
              <button
                onClick={() => handleModuleClick(mod)}
                title={collapsed ? mod.label : undefined}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: collapsed ? 0 : 8, padding: collapsed ? '10px' : '8px 13px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  fontSize: 12, fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.68)',
                  background: isActive ? `rgba(${mod.color === '#F6C000' ? '201,149,30' : mod.color === '#1B84FF' ? '29,78,216' : mod.color === '#17C653' ? '20,83,45' : mod.color === '#7239EA' ? '124,58,237' : mod.color === '#0E9F8A' ? '15,118,110' : '220,38,38'},0.15)` : 'transparent',
                  borderLeft: collapsed ? 'none' : `3px solid ${isActive ? mod.color : 'transparent'}`,
                  border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s',
                  borderRadius: collapsed ? 8 : 0, position: 'relative',
                }}
              >
                <Icon size={14} style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }} />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{mod.label}</span>
                    {lockStatus === 'view_only' && <span style={{ fontSize: 8, color: '#F6C000', marginRight: 2 }}>VIEW</span>}
                    {mod.subTabs.length > 0 && (isOpen ? <ChevronDown size={10} style={{ opacity: 0.5 }} /> : <ChevronRight size={10} style={{ opacity: 0.3 }} />)}
                  </>
                )}
              </button>

              {/* Sub-tabs */}
              {!collapsed && isOpen && mod.subTabs.length > 0 && (
                <div style={{ borderLeft: `2px solid ${mod.color}22`, marginLeft: 20, marginBottom: 2 }}>
                  {mod.subTabs.filter(st => {
                    if (!searchLower) return true;
                    return st.label.toLowerCase().includes(searchLower) || mod.label.toLowerCase().includes(searchLower);
                  }).map(st => {
                    const SubIcon = st.icon;
                    const isSubActive = isActive && activeSubTab === st.id;
                    return (
                      <button key={st.id} onClick={() => handleSubTabClick(mod.id, st.id)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 7,
                          padding: '6px 12px 6px 10px', fontSize: 11.5,
                          fontWeight: isSubActive ? 700 : 400,
                          color: isSubActive ? mod.color : 'rgba(255,255,255,0.55)',
                          background: isSubActive ? `rgba(255,255,255,0.06)` : 'transparent',
                          borderLeft: `2px solid ${isSubActive ? mod.color : 'transparent'}`,
                          border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s',
                        }}
                        onMouseEnter={e => { if (!isSubActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.88)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; } }}
                        onMouseLeave={e => { if (!isSubActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.background = 'transparent'; } }}
                      >
                        <SubIcon size={11} style={{ opacity: 0.8, flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: collapsed ? '8px 4px' : '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, padding: '0 2px' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(201,149,30,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#F6C000', flexShrink: 0 }}>
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.82)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize' }}>{user?.role?.replace(/_/g, ' ')}</div>
            </div>
          </div>
        )}
        <button onClick={logout} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 6, padding: '6px 8px', fontSize: 11, color: 'rgba(255,255,255,0.35)',
          background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, cursor: 'pointer',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent'; }}>
          <LogOut size={11} /> {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
