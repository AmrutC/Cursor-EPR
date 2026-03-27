import React from 'react';
import { useAppStore } from '../stores/appStore';
import { Database, Bell } from 'lucide-react';

export default function Topbar({ title, dept, deptColor = '#0D1E35' }) {
  const { activeEntity, oneDrivePath, user } = useAppStore();

  return (
    <header className="vg-topbar">
      <div className="vg-topbar-left">
        <div className="d-flex align-items-center gap-3">
          <span className="vg-dept-dot" style={{ background: deptColor }} />
          <div>
            <div className="vg-breadcrumb">Vision Grroup ERP / {dept}</div>
            <h1 className="vg-page-title">{title}</h1>
          </div>
        </div>
        {activeEntity && (
          <div className="vg-entity-pill">
            <span className="badge badge-light-primary">{activeEntity.code}</span>
            <span>{activeEntity.name}</span>
          </div>
        )}
      </div>

      <div className="vg-topbar-right">
        <div className={`vg-sync-pill ${oneDrivePath ? 'is-synced' : 'is-local'}`}>
          <Database size={13} />
          <span>{oneDrivePath ? 'OneDrive synced' : 'Local only'}</span>
        </div>

        <div className="vg-user-chip">
          <div className="vg-user-avatar">{user?.full_name?.charAt(0) || 'U'}</div>
          <div className="vg-user-meta">
            <div>{user?.full_name || 'User'}</div>
            <small>{(user?.role || '').replace(/_/g, ' ')}</small>
          </div>
        </div>

        <button className="btn btn-icon btn-sm btn-light">
          <Bell size={14} />
        </button>
      </div>
    </header>
  );
}
