import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { USERS as SEED_USERS } from '../data';
import { Eye, EyeOff, LogIn, Building2, Lock } from 'lucide-react';

export default function Login() {
  const { setUser, setActiveEntity, setAvailableEntities, addToast, users: storeUsers, entities } = useAppStore();
  const allEntities = entities && entities.length > 0 ? entities : [];

  const [selEntityId, setSelEntityId] = useState('');
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('entity');

  function handleEntitySelect() {
    if (!selEntityId) { setError('Please select an entity.'); return; }
    setError(''); setStep('credentials');
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!form.username||!form.password) { setError('Enter username and password.'); return; }
    setLoading(true); setError('');
    try {
      let user = null;

      // 1. Try SQLite auth (Electron)
      if (window.vgERP?.db?.login) {
        const res = await window.vgERP.db.login({ username:form.username, password:form.password });
        if (res.ok) {
          user = res.user;
          if (typeof user.entity_access==='string') {
            try { user.entity_access = JSON.parse(user.entity_access); } catch { user.entity_access=[1,2,3]; }
          }
        } else {
          // SQLite says no — fall through to in-memory checks
        }
      }

      // 2. Check store users (added via AdminSetup — highest priority after SQLite)
      if (!user && storeUsers && storeUsers.length > 0) {
        const found = storeUsers.find(u =>
          u.username === form.username &&
          u.password === form.password &&
          u.is_active !== false
        );
        if (found) user = { ...found };
      }

      // 3. Fallback: seed users from data.js (admin/director)
      if (!user) {
        const found = SEED_USERS.find(u =>
          u.username === form.username && u.password === form.password && u.is_active !== false
        );
        if (found) user = { ...found };
      }

      if (!user) {
        setError('Invalid username or password.');
        setLoading(false); return;
      }

      const entity = allEntities.find(e => e.id === Number(selEntityId));
      if (!entity) { setError('Invalid entity. Please log out and try again.'); setLoading(false); return; }

      // Parse entity_access — handle both array and JSON string
      let entityAccess = user.entity_access;
      if (typeof entityAccess === 'string') {
        try { entityAccess = JSON.parse(entityAccess); } catch { entityAccess = []; }
      }
      // Super admin and director can always access all entities
      const isAdmin = user.role === 'super_admin' || user.role === 'director';
      const hasAccess = isAdmin || (Array.isArray(entityAccess) && entityAccess.includes(entity.id));
      if (!hasAccess) {
        setError(`You do not have access to ${entity.name}. Contact your administrator.`);
        setLoading(false); return;
      }

      const available = isAdmin ? allEntities : allEntities.filter(e => (entityAccess||[]).includes(e.id));
      setAvailableEntities(available);
      setActiveEntity(entity);
      setUser(user);
      addToast(`Welcome, ${user.full_name}! Logged into ${entity.code}.`);
    } catch(err) {
      setError('Login error: ' + err.message);
    }
    setLoading(false);
  }

  const inp = { width:'100%', border:'1px solid #DBDFE9', borderRadius:8, padding:'8px 12px', fontSize:13.5, color:'#111827', background:'#fff', outline:'none', fontFamily:'Inter,system-ui,sans-serif' };

  return (
    <div className="vg-auth-page">
      <div className="vg-auth-left">
        <div>
          <div className="d-flex align-items-center gap-3 mb-10">
            <img
              src="/metronic/assets/media/logos/demo50.svg"
              alt="Vision Grroup"
              style={{ height: 26 }}
            />
            <span className="text-gray-500 fs-7 fw-semibold">Real Estate ERP v4.0</span>
          </div>
          <h2 className="vg-auth-title">
            Manage every project,
            <br />
            every allottee,
            <br />
            every rupee.
          </h2>
          <div className="vg-auth-list">
            {['13 integrated modules', 'SQLite persistent data', 'Multi-entity support', 'Full audit trail'].map((f) => (
              <div key={f} className="vg-auth-list-item">
                <span className="vg-auth-list-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className="text-gray-500 fs-8">© 2026 Vision Grroup. All rights reserved.</div>
      </div>

      <div className="vg-auth-right">
        <div className="vg-auth-card card shadow-sm">
          {step === 'entity' && (
            <>
              <div className="mb-6">
                <h1 className="fs-2 fw-bolder text-gray-900 mb-2">Select Entity</h1>
                <p className="text-gray-500 fs-7 m-0">Choose your working entity. Cannot switch without logging out.</p>
              </div>

              <div className="d-flex flex-column gap-3 mb-5">
                {allEntities.map((en) => {
                  const active = selEntityId === String(en.id);
                  return (
                    <button
                      key={en.id}
                      type="button"
                      className={`vg-entity-select ${active ? 'is-active' : ''}`}
                      onClick={() => {
                        setSelEntityId(String(en.id));
                        setError('');
                      }}
                    >
                      <Building2 size={16} />
                      <div className="vg-entity-select-meta">
                        <span>{en.name}</span>
                        <small>{en.code}</small>
                      </div>
                    </button>
                  );
                })}
              </div>

              {error && <div className="alert alert-danger py-2 px-3 fs-8 mb-4">{error}</div>}
              <button type="button" className="btn btn-primary w-100" onClick={handleEntitySelect}>
                Continue
              </button>
            </>
          )}

          {step === 'credentials' && (
            <>
              <div className="mb-6">
                <div className="alert alert-primary d-flex align-items-center gap-2 py-2 px-3 mb-4">
                  <Lock size={12} />
                  <span className="fs-8 fw-bold">
                    {allEntities.find((e) => e.id === Number(selEntityId))?.code} —{' '}
                    {allEntities.find((e) => e.id === Number(selEntityId))?.name}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-light ms-auto"
                    onClick={() => {
                      setStep('entity');
                      setError('');
                    }}
                  >
                    Change
                  </button>
                </div>
                <h1 className="fs-2 fw-bolder text-gray-900 mb-2">Sign in</h1>
                <p className="text-gray-500 fs-7 m-0">Enter your credentials</p>
              </div>

              <form onSubmit={handleLogin} className="d-flex flex-column gap-4">
                <div>
                  <label className="form-label fs-8 fw-bold text-gray-700">Username</label>
                  <input
                    className="form-control form-control-solid"
                    style={inp}
                    placeholder="Username"
                    autoFocus
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label fs-8 fw-bold text-gray-700">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control form-control-solid"
                      style={{ ...inp, paddingRight: 40 }}
                      type={showPw ? 'text' : 'password'}
                      placeholder="Password"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#99A1B7',
                      }}
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {error && <div className="alert alert-danger py-2 px-3 fs-8 m-0">{error}</div>}
                <button type="submit" className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                  <LogIn size={15} />
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <div className="alert alert-warning mt-5 mb-0 fs-8">
                <div className="fw-bold">admin / Admin@1234</div>
                <div className="fw-bold">director / Director@1234</div>
                <div className="text-muted mt-1">Other users: add via Admin Setup → Users</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
