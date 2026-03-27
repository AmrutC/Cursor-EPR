import React, { useMemo, useState } from 'react';
import { useAppStore, getNavItems } from '../stores/appStore';
import {
  ChevronDown, ChevronRight, LogOut, Settings, LayoutDashboard, Users, Building2,
  BookOpen, CreditCard, FileText, BarChart3, Receipt, UserCheck, Handshake,
  Truck, PieChart, ClipboardList, MessageSquare, Search, X, PanelLeftOpen, PanelLeftClose,
} from 'lucide-react';

const ICONS = {
  dashboard: LayoutDashboard, crm: Users, inventory: Building2, bookings: BookOpen,
  payments: CreditCard, documents: FileText, accounts: BarChart3, gst: Receipt,
  hr: UserCheck, brokerage: Handshake, vendors: Truck, mis: PieChart,
  audit: ClipboardList, communication: MessageSquare, admin: Settings,
};

const LABELS = {
  dashboard: 'Dashboard', crm: 'CRM & Leads', inventory: 'Projects & Inventory',
  bookings: 'Bookings', payments: 'Collections', documents: 'Documents',
  accounts: 'Accounts & Ledger', gst: 'GST & Tax', hr: 'HR & Payroll',
  brokerage: 'Brokerage', vendors: 'Vendors & PO', mis: 'MIS Reports',
  audit: 'Audit Log', communication: 'Communication', admin: 'Admin Setup',
};

const DEPT_GROUPS = [
  { label: 'Overview', color: '#f6c000', items: ['dashboard'] },
  { label: 'Sales', color: '#1B84FF', items: ['crm', 'inventory', 'bookings'] },
  { label: 'Finance', color: '#17C653', items: ['payments', 'accounts', 'gst'] },
  { label: 'Construction', color: '#7239ea', items: ['vendors', 'documents'] },
  { label: 'HR', color: '#0f9e8a', items: ['hr', 'brokerage'] },
  { label: 'Management', color: '#f8285a', items: ['mis', 'audit', 'communication', 'admin'] },
];

const SUBS = {
  gst: ['GST Register', 'Monthly Liability', 'Slab Summary', 'ITC Register', 'TDS Register'],
  hr: ['Employees', 'Attendance', 'Payroll', 'HR Documents'],
  vendors: ['Vendor Master', 'Bills Register', 'Pending Payments', 'Purchase Orders'],
  admin: ['Entities', 'Users & Roles', 'Banks', 'Settings'],
  accounts: ['Ledger Entries', 'GST Payment Entry'],
};

export default function Sidebar() {
  const { user, activeEntity, activeModule, setActiveModule, logout } = useAppStore();
  const [open, setOpen] = useState({});
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const navItems = getNavItems(user?.role);

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return null;
    return navItems.filter((id) => LABELS[id]?.toLowerCase().includes(query));
  }, [search, navItems]);

  function handleClick(id) {
    if (SUBS[id]) {
      setActiveModule(id);
      setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
    } else {
      setActiveModule(id);
      setOpen({});
    }
    setSearch('');
  }

  return (
    <aside className={`vg-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="vg-sidebar-head">
        {!collapsed && (
          <div className="vg-logo-wrap">
            <img src="/metronic/assets/media/logos/demo50.svg" alt="Logo" className="vg-logo" />
            <div>
              <div className="vg-logo-title">Vision Grroup</div>
              <div className="vg-logo-sub">ERP v4.0</div>
            </div>
          </div>
        )}
        <button
          type="button"
          className="btn btn-icon btn-sm btn-light-primary"
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="vg-entity-box">
            <div className="vg-section-label">Active Entity</div>
            <div className="vg-entity-row">
              {activeEntity?.code && <span className="badge badge-light-success">{activeEntity.code}</span>}
              <span className="vg-entity-name">{activeEntity?.name || 'No entity selected'}</span>
            </div>
            <button type="button" className="btn btn-sm btn-light-danger w-100 mt-2" onClick={logout}>
              Logout to switch entity
            </button>
          </div>

          <div className="vg-search-wrap">
            <Search size={13} className="vg-search-icon" />
            <input
              className="form-control form-control-sm form-control-solid"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules..."
            />
            {search && (
              <button type="button" className="vg-clear-search" onClick={() => setSearch('')}>
                <X size={11} />
              </button>
            )}
          </div>
        </>
      )}

      <nav className="vg-nav">
        {filteredItems ? (
          <div className="mb-2">
            {!collapsed && <div className="vg-section-label">Search Results</div>}
            {filteredItems.map((id) => (
              <NavItem
                key={id}
                id={id}
                active={activeModule === id}
                onClick={handleClick}
                hasSubs={!!SUBS[id]}
                isOpen={open[id]}
                collapsed={collapsed}
              />
            ))}
          </div>
        ) : (
          DEPT_GROUPS.map((group) => {
            const groupItems = group.items.filter((id) => navItems.includes(id));
            if (!groupItems.length) return null;
            return (
              <div key={group.label}>
                {!collapsed && (
                  <div className="vg-section-label d-flex align-items-center gap-2">
                    <span className="vg-color-dot" style={{ background: group.color }} />
                    {group.label}
                  </div>
                )}
                {groupItems.map((id) => (
                  <div key={id}>
                    <NavItem
                      id={id}
                      active={activeModule === id}
                      onClick={handleClick}
                      hasSubs={!!SUBS[id]}
                      isOpen={open[id]}
                      collapsed={collapsed}
                    />
                    {!collapsed && SUBS[id] && open[id] && (
                      <div className="vg-sub-nav">
                        {SUBS[id].map((sub) => (
                          <button key={sub} type="button" className="vg-sub-item" onClick={() => setActiveModule(id)}>
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })
        )}
      </nav>

      <div className="vg-sidebar-foot">
        {!collapsed && (
          <div className="vg-user-mini">
            <div className="vg-user-avatar">{user?.full_name?.charAt(0) || 'U'}</div>
            <div>
              <div className="fw-bold text-gray-100 fs-8">{user?.full_name}</div>
              <div className="text-gray-500 fs-9 text-capitalize">{user?.role?.replace(/_/g, ' ')}</div>
            </div>
          </div>
        )}
        <button type="button" className="btn btn-sm btn-light-danger w-100" onClick={logout}>
          <LogOut size={12} />
          {!collapsed && <span className="ms-1">Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

function NavItem({ id, active, onClick, hasSubs, isOpen, collapsed }) {
  const Icon = ICONS[id] || LayoutDashboard;
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      title={collapsed ? LABELS[id] : undefined}
      className={`vg-nav-item ${active ? 'is-active' : ''}`}
    >
      <Icon size={14} />
      {!collapsed && (
        <>
          <span className="vg-nav-label">{LABELS[id] || id}</span>
          {hasSubs && (isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />)}
        </>
      )}
    </button>
  );
}
