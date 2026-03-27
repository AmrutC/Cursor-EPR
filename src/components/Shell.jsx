import React, { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Toast from './ui/Toast';
import GlobalSearch from './GlobalSearch';

import DashboardModule    from './modules/Dashboard';
import SalesModule        from './modules/Sales';
import FinanceModule      from './modules/Finance';
import ConstructionModule from './modules/Construction';
import HRModule           from './modules/HR';
import AdminModule        from './modules/Admin';

const MODULE_COMPONENTS = {
  dashboard:    DashboardModule,
  sales:        SalesModule,
  finance:      FinanceModule,
  construction: ConstructionModule,
  hr:           HRModule,
  admin:        AdminModule,
};

const MODULE_LABELS = {
  dashboard:    'Dashboard',
  sales:        'Sales',
  finance:      'Finance & Accounts',
  construction: 'Construction',
  hr:           'Human Resources',
  admin:        'Admin',
};

const MODULE_COLORS = {
  dashboard: '#F6C000', sales: '#1B84FF', finance: '#17C653',
  construction: '#7239EA', hr: '#0E9F8A', admin: '#F8285A',
};

export default function Shell() {
  const { activeModule, activeSubTab, user, toasts, searchOpen, setSearchOpen, getNavModules, moduleLocks, activeEntity } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Ctrl+K global search
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const navModules = getNavModules ? getNavModules(user?.role) : ['dashboard'];
  const Screen = MODULE_COMPONENTS[activeModule] || DashboardModule;
  const color = MODULE_COLORS[activeModule] || '#071437';

  // Check entity module lock
  const entityLocks = (moduleLocks || {})[activeEntity?.code] || {};
  const lockStatus = entityLocks[activeModule] || 'active';
  const isLocked = lockStatus === 'locked' && user?.role !== 'super_admin';
  const isViewOnly = lockStatus === 'view_only' && user?.role !== 'super_admin';

  useEffect(() => {
    function onResize() {
      if (window.innerWidth < 768) {
        setMobileSidebarOpen(false);
      }
      if (window.innerWidth < 1280) {
        setSidebarCollapsed(true);
      }
    }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div style={{ height:'100vh', display:'flex', overflow:'hidden', background:'#F5F8FA' }}>
      {/* Desktop sidebar */}
      <div className="shell-desktop-sidebar">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      </div>
      {/* Mobile overlay sidebar */}
      {mobileSidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex' }}>
          <div style={{ width: 280, maxWidth: '80vw' }}>
            <Sidebar
              collapsed={false}
              setCollapsed={setSidebarCollapsed}
              isMobile
              onCloseMobile={() => setMobileSidebarOpen(false)}
            />
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.25)' }} onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <Topbar moduleLabel={MODULE_LABELS[activeModule]} onToggleMobileSidebar={() => setMobileSidebarOpen(true)} />
        <main style={{
          flex:1, overflowY:'auto', padding:'24px 28px',
          scrollbarWidth:'thin', scrollbarColor:'#DBDFE9 transparent',
        }}>
          {isLocked ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
                <div style={{ fontSize:17, fontWeight:800, color:'#071437', marginBottom:6 }}>Module Locked</div>
                <div style={{ fontSize:13, color:'#4B5675' }}>This module is locked for {activeEntity?.name}.</div>
                <div style={{ fontSize:12, color:'#78829D', marginTop:4 }}>Contact your administrator to enable access.</div>
              </div>
            </div>
          ) : (
            <div key={`${activeModule}:${activeSubTab || ''}`} className="app-page-enter">
              <Screen viewOnly={isViewOnly} />
            </div>
          )}
        </main>
      </div>
      <style>{`
        @media (max-width: 768px){.shell-desktop-sidebar{display:none !important;}}
        @media (max-width: 1100px){.kpi-grid-4{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}}
        @media (max-width: 900px){.form-grid-two{grid-template-columns:1fr !important;}.kpi-grid-2{grid-template-columns:1fr !important;}}
      `}</style>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      <Toast toasts={toasts} />
    </div>
  );
}
