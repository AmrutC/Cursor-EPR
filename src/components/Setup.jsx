// ── SETUP.JSX ──────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { FolderOpen } from 'lucide-react';

export default function Setup() {
  const { setOneDrivePath, loadGlobal } = useAppStore();
  const [loading, setLoading] = useState(false);

  async function chooseFolder() {
    if (!window.vgERP) return;
    setLoading(true);
    const path = await window.vgERP.setSyncFolder();
    if (path) {
      setOneDrivePath(path);
      await loadGlobal();
    }
    setLoading(false);
  }

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#071437' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '48px 48px', width: 480, textAlign: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#071437', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <FolderOpen size={28} style={{ color: '#F6C000' }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#071437', marginBottom: 8 }}>Set Sync Folder</div>
        <div style={{ fontSize: 13, color: '#78829D', lineHeight: 1.6, marginBottom: 32 }}>
          Choose a folder where ERP data will be stored. Use a <strong>OneDrive</strong> or shared folder for automatic sync across devices.
        </div>
        <button onClick={chooseFolder} disabled={loading} style={{
          background: '#071437', color: '#F6C000', border: 'none', borderRadius: 12, padding: '14px 32px',
          fontSize: 14, fontWeight: 800, cursor: loading ? 'default' : 'pointer', width: '100%',
        }}>
          {loading ? 'Selecting…' : 'Choose Sync Folder'}
        </button>
        <div style={{ marginTop: 16, fontSize: 11, color: '#DBDFE9' }}>You can change this later from Admin → Backup Manager</div>
      </div>
    </div>
  );
}
