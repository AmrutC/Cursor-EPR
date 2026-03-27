import React, { useEffect } from 'react';
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

  return (
    <div style={{ height:'100vh', display:'flex', overflow:'hidden', background:'#F5F8FA' }}>
      <Sidebar />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <Topbar moduleLabel={MODULE_LABELS[activeModule]} moduleColor={color} />
        <main style={{
          flex:1, overflowY:'auto', padding:'16px 20px',
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
            <Screen viewOnly={isViewOnly} />
          )}
        </main>
      </div>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      <Toast toasts={toasts} />
    </div>
  );
}
