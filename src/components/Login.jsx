import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';

export default function Login() {
  const { entities, users, setUser, setActiveEntity } = useAppStore();
  const [step, setStep] = useState('entity'); // entity | login
  const [selEntity, setSelEntity] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function selectEntity(entity) {
    setSelEntity(entity);
    setStep('login');
    setError('');
  }

  function handleLogin() {
    setError(''); setLoading(true);
    setTimeout(() => {
      const u = users.find(u => u.username === username && u.password === password && u.is_active);
      if (!u) { setError('Invalid username or password'); setLoading(false); return; }
      // Check entity access
      if (!(u.entity_access || []).includes(selEntity.id) && u.role !== 'super_admin') {
        setError('You do not have access to this entity'); setLoading(false); return;
      }
      setActiveEntity(selEntity);
      setUser(u);
      setLoading(false);
    }, 300);
  }

  return (
    <div style={{ height: '100vh', display: 'flex', background: '#071437', overflow: 'hidden' }}>
      {/* Left panel */}
      <div style={{ width: 420, background: '#071437', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px', flexShrink: 0 }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ color: '#F6C000', fontWeight: 900, fontSize: 26, letterSpacing: '-0.5px' }}>Vision Grroup</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4, letterSpacing: '2px', textTransform: 'uppercase' }}>ERP v5.0</div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.8 }}>
          {['Real Estate CRM & Bookings', 'Finance & Accounts', 'Construction Management', 'HR & Payroll', 'GST & TDS Compliance', 'Document Automation'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F6C000' }} />
              {f}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 40, color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>
          © 2026 Vision Grroup. All Rights Reserved.
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, background: '#F5F8FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {step === 'entity' && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#071437', marginBottom: 4 }}>Select Entity</div>
              <div style={{ fontSize: 13, color: '#78829D', marginBottom: 28 }}>Choose the company you want to work in</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {entities.map(e => (
                  <button key={e.id} onClick={() => selectEntity(e)} style={{
                    background: '#fff', border: '2px solid #F1F1F4', borderRadius: 12, padding: '16px 20px',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 14,
                  }}
                    onMouseEnter={ev => { ev.currentTarget.style.borderColor = '#F6C000'; ev.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={ev => { ev.currentTarget.style.borderColor = '#F1F1F4'; ev.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#071437', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#F6C000', fontWeight: 800, fontSize: 13 }}>{e.code}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#071437' }}>{e.name}</div>
                      <div style={{ fontSize: 11, color: '#78829D', marginTop: 2 }}>{e.cin_llpin || e.type || '—'}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'login' && (
            <div>
              <button onClick={() => { setStep('entity'); setError(''); }} style={{ fontSize: 12, color: '#4B5675', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
                ← Back
              </button>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#071437', marginBottom: 4 }}>Sign in</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
                <div style={{ background: '#071437', color: '#F6C000', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>{selEntity?.code}</div>
                <div style={{ fontSize: 13, color: '#4B5675' }}>{selEntity?.name}</div>
              </div>

              {error && (
                <div style={{ background: '#FFE2E5', border: '1px solid #FFB8C6', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#F8285A' }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#252F4A', display: 'block', marginBottom: 6 }}>Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)} autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #F1F1F4', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={ev => ev.target.style.borderColor = '#F6C000'} onBlur={ev => ev.target.style.borderColor = '#F1F1F4'} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#252F4A', display: 'block', marginBottom: 6 }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #F1F1F4', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={ev => ev.target.style.borderColor = '#F6C000'} onBlur={ev => ev.target.style.borderColor = '#F1F1F4'} />
              </div>

              <button onClick={handleLogin} disabled={loading} style={{
                width: '100%', background: loading ? '#F1F1F4' : '#071437', color: loading ? '#78829D' : '#F6C000',
                border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 800,
                cursor: loading ? 'default' : 'pointer', letterSpacing: '0.3px', transition: 'all 0.15s',
              }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              <div style={{ marginTop: 24, padding: '12px 14px', background: '#FCFCFC', borderRadius: 8, fontSize: 11, color: '#78829D', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Default accounts:</div>
                admin / Admin@1234 (Super Admin) · director / Director@1234 · accounts / Acc@1234
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
