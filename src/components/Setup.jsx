import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { FolderOpen, CheckCircle2 } from 'lucide-react';

export default function Setup() {
  const { setOneDrivePath, loadGlobal } = useAppStore();
  const [status, setStatus] = useState('idle');

  async function selectFolder() {
    setStatus('selecting');
    const result = await window.vgERP.setSyncFolder();
    if (result.ok) {
      setOneDrivePath(result.path);
      // Load any existing entities/users from vg_global.json in this folder
      await loadGlobal();
      setStatus('done');
    } else {
      setStatus('idle');
    }
  }

  return (
    <div className="vg-auth-shell">
      <div className="vg-auth-left">
        <div className="vg-logo-wrap mb-4">
          <img src="/metronic/assets/media/logos/demo50.svg" alt="Logo" className="vg-logo" />
          <div>
            <div className="vg-logo-title">Vision Grroup</div>
            <div className="vg-logo-sub">ERP setup wizard</div>
          </div>
        </div>
        <h2 className="vg-auth-heading">Configure your shared workspace once.</h2>
        <p className="vg-auth-sub">
          The selected folder will hold database files, documents, backups, and exports.
        </p>
      </div>

      <div className="vg-auth-right">
        <div className="card shadow-sm border-0 w-100" style={{ maxWidth: 520 }}>
          <div className="card-body p-8">
            <div className="text-center mb-6">
              <span className="badge badge-light-primary mb-3">First-time setup</span>
              <h1 className="fs-2 fw-bolder text-gray-900 mb-2">Select OneDrive ERP folder</h1>
              <div className="text-gray-500 fs-7">
                Suggested path: <span className="fw-semibold">OneDrive/Vision Grroup ERP</span>
              </div>
            </div>

            <div className="alert alert-info py-3 px-4 mb-5">
              All team members should point the app to the same shared OneDrive folder.
            </div>

            {status === 'done' ? (
              <div className="alert alert-success d-flex align-items-center gap-2 py-3 px-4 mb-0">
                <CheckCircle2 size={18} />
                <span>Folder configured. Redirecting to login...</span>
              </div>
            ) : (
              <button
                onClick={selectFolder}
                disabled={status === 'selecting'}
                className="btn btn-primary w-100 d-flex justify-content-center align-items-center gap-2"
              >
                <FolderOpen size={16} />
                {status === 'selecting' ? 'Selecting...' : 'Choose OneDrive Folder'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
