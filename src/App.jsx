import React, { useEffect, useState } from 'react';
import { useAppStore } from './stores/appStore';
import Login from './components/Login';
import Shell from './components/Shell';
import Setup from './components/Setup';

export default function App() {
  const {
    user, activeEntity, oneDrivePath, setOneDrivePath,
    loadGlobal, loadFromFile, dataLoaded,
  } = useAppStore();
  const [checking, setChecking] = useState(true);

  // ── Step 1: On app open — get sync folder, then load global config ──────
  useEffect(() => {
    async function init() {
      if (window.vgERP) {
        try {
          const p = await window.vgERP.getSyncFolder();
          if (p) {
            setOneDrivePath(p);
            // Load entities + users immediately — before login screen shows
            await loadGlobal();
          }
        } catch (e) {
          console.error('[App] init error:', e);
        }
      }
      setChecking(false);
    }
    init();
  }, []);

  // ── Step 2: After login + entity selected — load entity data ────────────
  useEffect(() => {
    if (user && activeEntity?.code) {
      loadFromFile(activeEntity.code);
    }
  }, [user?.id, activeEntity?.code]);

  if (checking) {
    return (
      <div className="vg-splash">
        <div className="vg-splash-card">
          <div className="vg-brand">Vision Grroup ERP</div>
          <div className="spinner-border text-success mb-3" role="status" />
          <div className="text-gray-500 fw-semibold fs-7">Starting up workspace...</div>
        </div>
      </div>
    );
  }

  if (!oneDrivePath) return <Setup />;
  if (!user) return <Login />;

  if (!dataLoaded) {
    return (
      <div className="vg-splash light">
        <div className="vg-splash-card">
          <div className="spinner-border text-primary mb-3" role="status" />
          <div className="text-gray-800 fw-bold fs-6">
            Loading {activeEntity?.code} data...
          </div>
          <div className="text-gray-500 fs-8 mt-1">
            Reading vg_data_{activeEntity?.code}.json
          </div>
        </div>
      </div>
    );
  }

  return <Shell />;
}
