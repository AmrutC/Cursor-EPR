import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { Database, Bell, Search, ChevronDown } from 'lucide-react';

export default function Topbar({ moduleLabel, moduleColor }) {
  const { activeEntity, oneDrivePath, user, notifications, setSearchOpen, markAllNotifRead, markNotifRead, setActiveModule, setActiveSubTab } = useAppStore();
  const [notifOpen, setNotifOpen] = useState(false);

  const unread = (notifications || []).filter(n => !n.read).length;

  function handleNotifClick(n) {
    markNotifRead(n.id);
    setNotifOpen(false);
    if (n.module) setActiveModule(n.module, n.subTab || null);
  }

  return (
    <header style={{
      background: '#fff', borderBottom: '1px solid #F1F1F4',
      padding: '0 20px', height: 52, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', flexShrink: 0,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 3, height: 18, borderRadius: 2, background: moduleColor || '#071437' }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#071437', lineHeight: 1 }}>{moduleLabel || 'Vision Grroup ERP'}</div>
          {activeEntity && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <span style={{ fontSize: 8.5, fontWeight: 800, color: '#fff', background: '#071437', padding: '1px 5px', borderRadius: 3 }}>{activeEntity.code}</span>
              <span style={{ fontSize: 10.5, color: '#4B5675' }}>{activeEntity.name}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Ctrl+K search button */}
        <button onClick={() => setSearchOpen(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#FCFCFC', border: '1px solid #F1F1F4', borderRadius: 8,
          padding: '5px 12px', cursor: 'pointer', color: '#78829D', fontSize: 11,
        }}>
          <Search size={12} /> Search… <span style={{ background: '#F1F1F4', borderRadius: 4, padding: '1px 5px', fontSize: 9.5, color: '#4B5675', marginLeft: 4 }}>Ctrl+K</span>
        </button>

        {/* Sync indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: oneDrivePath ? '#E8FFF3' : '#FFF8DD',
          border: `1px solid ${oneDrivePath ? '#50CD89' : '#F6C000'}`,
          borderRadius: 7, padding: '3px 8px',
        }}>
          <Database size={10} style={{ color: oneDrivePath ? '#17C653' : '#7A4E00' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: oneDrivePath ? '#17C653' : '#7A4E00' }}>
            {oneDrivePath ? 'Synced' : 'Local'}
          </span>
        </div>

        {/* Notification bell */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setNotifOpen(o => !o)} style={{
            width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 9, background: notifOpen ? '#FCFCFC' : 'transparent',
            border: '1px solid #F1F1F4', cursor: 'pointer', color: '#252F4A', position: 'relative',
          }}>
            <Bell size={15} />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4, width: 16, height: 16,
                background: '#F8285A', borderRadius: '50%', fontSize: 9, fontWeight: 800,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{unread > 9 ? '9+' : unread}</span>
            )}
          </button>

          {notifOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 40, width: 340,
              background: '#fff', border: '1px solid #F1F1F4', borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #FCFCFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#071437' }}>Notifications {unread > 0 && <span style={{ background: '#F8285A', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10 }}>{unread}</span>}</span>
                {unread > 0 && <button onClick={markAllNotifRead} style={{ fontSize: 10, color: '#1B84FF', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>}
              </div>
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {(notifications || []).length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#78829D', fontSize: 12 }}>No notifications</div>
                ) : (
                  (notifications || []).slice(0, 30).map(n => (
                    <div key={n.id} onClick={() => handleNotifClick(n)} style={{
                      padding: '10px 16px', borderBottom: '1px solid #FCFCFC',
                      background: n.read ? '#fff' : '#EEF6FF', cursor: 'pointer',
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FCFCFC'}
                      onMouseLeave={e => e.currentTarget.style.background = n.read ? '#fff' : '#EEF6FF'}
                    >
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: n.read ? '#DBDFE9' : '#1B84FF', marginTop: 4, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: n.read ? 400 : 600, color: '#071437' }}>{n.message}</div>
                        <div style={{ fontSize: 10, color: '#78829D', marginTop: 2 }}>{new Date(n.ts).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FCFCFC', border: '1px solid #F1F1F4', borderRadius: 20, padding: '4px 10px' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#071437', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#F6C000' }}>
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#071437' }}>{user?.full_name}</div>
            <div style={{ fontSize: 9, color: '#78829D', textTransform: 'capitalize' }}>{user?.role?.replace(/_/g, ' ')}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
