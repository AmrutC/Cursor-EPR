import React from 'react';
import { useAppStore, getNavItems } from '../stores/appStore';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Toast from './ui/Toast';

import Dashboard    from './modules/Dashboard';
import Projects     from './modules/Projects';
import Inventory    from './modules/Inventory';
import CRM          from './modules/CRM';
import Bookings     from './modules/Bookings';
import Payments     from './modules/Payments';
import Documents    from './modules/Documents';
import Accounts     from './modules/Accounts';
import GST          from './modules/GST';
import HR           from './modules/HR';
import Brokerage    from './modules/Brokerage';
import Vendors      from './modules/Vendors';
import MIS          from './modules/MIS';
import AuditLog     from './modules/AuditLog';
import Communication from './modules/Communication';
import AdminSetup   from './modules/AdminSetup';

// Projects + Inventory combined with sub-tabs
function ProjectsAndInventory() {
  const [subTab, setSubTab] = React.useState('projects');
  return (
    <div>
      <div style={{ display:'flex', gap:3, background:'#F9F9F9', borderRadius:10, padding:3, marginBottom:18, width:'fit-content' }}>
        {[['projects','Projects'],['inventory','Inventory']].map(([id,label])=>(
          <button key={id} onClick={()=>setSubTab(id)}
            style={{ padding:'6px 20px', borderRadius:7, fontSize:12.5, fontWeight:subTab===id?700:500,
              color:subTab===id?'#071437':'#78829D', background:subTab===id?'#fff':'transparent',
              cursor:'pointer', border:subTab===id?'1px solid #F1F1F4':'1px solid transparent',
              boxShadow:subTab===id?'0 1px 3px rgba(0,0,0,0.08)':'', transition:'all .12s' }}>
            {label}
          </button>
        ))}
      </div>
      {subTab==='projects' ? <Projects/> : <Inventory/>}
    </div>
  );
}

const SCREENS = {
  dashboard:    { component:Dashboard,             label:'Dashboard',               dept:'Overview' },
  crm:          { component:CRM,                   label:'CRM & Leads',             dept:'Sales' },
  inventory:    { component:ProjectsAndInventory,  label:'Projects & Inventory',    dept:'Sales' },
  bookings:     { component:Bookings,              label:'Customers & Bookings',    dept:'Sales' },
  payments:     { component:Payments,              label:'Payments & Collections',  dept:'Finance' },
  accounts:     { component:Accounts,              label:'Accounts & Ledger',       dept:'Finance' },
  gst:          { component:GST,                   label:'GST & Tax Reports',       dept:'Finance' },
  vendors:      { component:Vendors,               label:'Vendors & Contractors',   dept:'Construction' },
  documents:    { component:Documents,             label:'Document Automation',     dept:'Construction' },
  hr:           { component:HR,                    label:'HR & Payroll',            dept:'HR' },
  brokerage:    { component:Brokerage,             label:'Brokerage',               dept:'HR' },
  mis:          { component:MIS,                   label:'MIS & Reports',           dept:'Management' },
  audit:        { component:AuditLog,              label:'Audit Log',               dept:'Management' },
  communication:{ component:Communication,         label:'Communication',           dept:'Management' },
  admin:        { component:AdminSetup,            label:'Admin Setup',             dept:'Management' },
};

const DEPT_COLORS = {
  Overview:'#F6C000', Sales:'#1B84FF', Finance:'#17C653',
  Construction:'#7239EA', HR:'#0E9F8A', Management:'#F8285A',
};

export default function Shell() {
  const { activeModule, user, toasts } = useAppStore();
  const screen = SCREENS[activeModule] || SCREENS.dashboard;
  const Screen = screen.component;
  const deptColor = DEPT_COLORS[screen.dept] || '#071437';

  return (
    <div className="vg-shell">
      <Sidebar />
      <div className="vg-shell-main">
        <Topbar title={screen.label} dept={screen.dept} deptColor={deptColor} />
        <main className="vg-content">
          {getNavItems(user?.role).includes(activeModule) ? (
            <Screen />
          ) : (
            <div className="vg-forbidden">
              <div>
                <div className="vg-forbidden-icon">🔒</div>
                <div className="vg-forbidden-title">Access Restricted</div>
                <div className="vg-forbidden-sub">You do not have permission to view this module.</div>
              </div>
            </div>
          )}
        </main>
      </div>
      <Toast toasts={toasts} />
    </div>
  );
}
