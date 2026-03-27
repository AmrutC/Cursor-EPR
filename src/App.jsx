import React, { useEffect, useState } from 'react';
import { useAppStore } from './stores/appStore';
import Login from './components/Login';
import Shell from './components/Shell';
import Setup from './components/Setup';

export default function App() {
  const { user, activeEntity, oneDrivePath, setOneDrivePath, loadGlobal, loadFromFile, dataLoaded } = useAppStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function init() {
      if (window.vgERP) {
        try {
          const p = await window.vgERP.getSyncFolder();
          if (p) { setOneDrivePath(p); await loadGlobal(); }
        } catch (e) { console.error('[App] init error:', e); }
      }
      setChecking(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (user && activeEntity?.code) loadFromFile(activeEntity.code);
  }, [user?.id, activeEntity?.code]);

  if (checking) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#071437' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ color:'#F6C000', fontSize:22, fontWeight:800, marginBottom:8 }}>Vision Grroup ERP</div>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>v5.0 — Starting up…</div>
      </div>
    </div>
  );

  if (!oneDrivePath) return <Setup />;
  if (!user) return <Login />;

  if (!dataLoaded) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F5F8FA' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:36, height:36, border:'4px solid #F1F1F4', borderTopColor:'#F6C000', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ color:'#071437', fontWeight:700, fontSize:14 }}>Loading {activeEntity?.code} data…</div>
        <div style={{ color:'#78829D', fontSize:11, marginTop:4 }}>Reading vg_data_{activeEntity?.code}.json</div>
      </div>
    </div>
  );

  return <Shell />;
}
