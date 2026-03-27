import React, { useState, useMemo, useRef } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Plus, Search, Upload, Camera, Download, RefreshCw, X, Package, Truck, ClipboardList, AlertTriangle } from 'lucide-react';
import { runOCR, parseIndentOCR, parseGRNOCR } from '../../utils/ocr.js';

export default function ConstructionModule({ viewOnly }) {
  const { activeSubTab } = useAppStore();
  const tab = activeSubTab || 'projects';
  return (
    <div>
      {tab === 'projects'    && <ProjectsTab viewOnly={viewOnly} />}
      {tab === 'boq'         && <BOQTab viewOnly={viewOnly} />}
      {tab === 'indent'      && <IndentTab viewOnly={viewOnly} />}
      {tab === 'procurement' && <ProcurementTab viewOnly={viewOnly} />}
      {tab === 'grn'         && <GRNTab viewOnly={viewOnly} />}
      {tab === 'stock'       && <StockTab viewOnly={viewOnly} />}
      {tab === 'workorders'  && <WorkOrdersTab viewOnly={viewOnly} />}
      {tab === 'labour'      && <LabourTab viewOnly={viewOnly} />}
      {tab === 'sitephotos'  && <SitePhotosTab viewOnly={viewOnly} />}
    </div>
  );
}

// ── SHARED ─────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, color = '#7239EA', small, disabled, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{ background: disabled ? '#F1F1F4' : color, color: disabled ? '#78829D' : '#fff', border: 'none', borderRadius: 8, padding: small ? '5px 12px' : '7px 16px', fontSize: small ? 11 : 12, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 5, ...style }}>{children}</button>
);
const Badge = ({ label, color = '#7239EA' }) => <span style={{ background: color + '18', color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{label}</span>;
function ModalOverlay({ children, onClose, title, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 14, width: wide ? 820 : 520, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #FCFCFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#071437' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78829D' }}><X size={16} /></button>
        </div>
        <div style={{ padding: '16px 20px' }}>{children}</div>
      </div>
    </div>
  );
}
function FormField({ label, value, onChange, type = 'text', options }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#252F4A', display: 'block', marginBottom: 4 }}>{label}</label>
      {options ? (
        <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1px solid #F1F1F4', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }}>
          {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
        </select>
      ) : (
        <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
          style={{ width: '100%', padding: '7px 10px', border: '1px solid #F1F1F4', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = '#7239EA'} onBlur={e => e.target.style.borderColor = '#F1F1F4'} />
      )}
    </div>
  );
}
function Th({ children }) { return <th style={{ padding: '9px 14px', fontSize: 11, fontWeight: 700, color: '#4B5675', textAlign: 'left', borderBottom: '1px solid #FCFCFC', background: '#FCFCFC' }}>{children}</th>; }
function Td({ children, style = {} }) { return <td style={{ padding: '8px 14px', fontSize: 12, color: '#252F4A', borderBottom: '1px solid #FCFCFC', ...style }}>{children}</td>; }

// ── PROJECTS TAB ──────────────────────────────────────────────────────────
function ProjectsTab({ viewOnly }) {
  const { projects, setProjects, boq, addToast } = useAppStore();
  const [modal, setModal] = useState(null);
  const [selProject, setSelProject] = useState(null);
  const [form, setForm] = useState({ name: '', location: '', reraNo: '', totalBudget: '', startDate: '', expectedEnd: '', status: 'active', architect: '', contractor: '', completionPct: 0 });

  function saveProject() {
    if (!form.name) { addToast('Project name required', 'error'); return; }
    if (selProject) {
      setProjects(prev => prev.map(p => p.id === selProject.id ? { ...p, ...form } : p));
      addToast('Project updated');
    } else {
      setProjects(prev => [...prev, { ...form, id: Date.now(), units: [], createdAt: new Date().toISOString() }]);
      addToast('Project added');
    }
    setModal(null);
  }

  const STATUS_COLORS = { active: '#17C653', completed: '#1B84FF', onhold: '#F6C000', cancelled: '#F8285A' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#071437' }}>Construction Projects</div>
        {!viewOnly && <Btn onClick={() => { setSelProject(null); setForm({ name: '', location: '', reraNo: '', totalBudget: '', startDate: '', expectedEnd: '', status: 'active', architect: '', contractor: '', completionPct: 0 }); setModal('form'); }} small><Plus size={12} /> Add Project</Btn>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {projects.map(p => {
          const projectBOQ = boq.filter(b => b.projectId === p.id);
          const totalBOQ = projectBOQ.reduce((s, b) => s + (b.estimatedCost || 0), 0);
          const actualCost = projectBOQ.reduce((s, b) => s + (b.actualCost || 0), 0);
          return (
            <div key={p.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F1F4', padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#071437' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#78829D' }}>{p.location}</div>
                </div>
                <Badge label={p.status || 'active'} color={STATUS_COLORS[p.status] || '#17C653'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[['Budget', `₹${(p.totalBudget || 0) > 0 ? (Number(p.totalBudget) / 100000).toFixed(1) + 'L' : '—'}`], ['BOQ Est.', `₹${(totalBOQ / 100000).toFixed(1)}L`], ['Actual', `₹${(actualCost / 100000).toFixed(1)}L`], ['Variance', `${totalBOQ > 0 ? (((actualCost - totalBOQ) / totalBOQ) * 100).toFixed(1) : '0'}%`]].map(([l, v]) => (
                  <div key={l} style={{ background: '#FCFCFC', borderRadius: 7, padding: '7px 10px' }}>
                    <div style={{ fontSize: 9.5, color: '#78829D' }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#071437' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ height: 5, background: '#FCFCFC', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ width: `${Math.min(p.completionPct || 0, 100)}%`, height: '100%', background: '#7239EA', borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 10, color: '#78829D', marginBottom: 10 }}>{p.completionPct || 0}% complete</div>
              {!viewOnly && (
                <button onClick={() => { setSelProject(p); setForm({ ...p }); setModal('form'); }} style={{ fontSize: 11, color: '#7239EA', background: 'none', border: '1px solid #7239EA', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Edit</button>
              )}
            </div>
          );
        })}
        {projects.length === 0 && <div style={{ gridColumn: '1/-1', padding: 48, textAlign: 'center', color: '#78829D', fontSize: 13, background: '#fff', borderRadius: 12, border: '1px solid #F1F1F4' }}>No construction projects yet.</div>}
      </div>

      {modal === 'form' && (
        <ModalOverlay onClose={() => setModal(null)} title={selProject ? 'Edit Project' : 'Add Project'} wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Project Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <FormField label="Location" value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} />
            <FormField label="RERA No" value={form.reraNo} onChange={v => setForm(f => ({ ...f, reraNo: v }))} />
            <FormField label="Total Budget (₹)" value={form.totalBudget} onChange={v => setForm(f => ({ ...f, totalBudget: v }))} type="number" />
            <FormField label="Architect" value={form.architect} onChange={v => setForm(f => ({ ...f, architect: v }))} />
            <FormField label="Main Contractor" value={form.contractor} onChange={v => setForm(f => ({ ...f, contractor: v }))} />
            <FormField label="Start Date" value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} type="date" />
            <FormField label="Expected Completion" value={form.expectedEnd} onChange={v => setForm(f => ({ ...f, expectedEnd: v }))} type="date" />
            <FormField label="Completion %" value={form.completionPct} onChange={v => setForm(f => ({ ...f, completionPct: Number(v) }))} type="number" />
            <FormField label="Status" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={['active', 'completed', 'onhold', 'cancelled']} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn onClick={() => setModal(null)} color="#4B5675" small>Cancel</Btn>
            <Btn onClick={saveProject} small>Save Project</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── BOQ ────────────────────────────────────────────────────────────────────
function BOQTab({ viewOnly }) {
  const { boq, setBoq, projects, stockLedger, addToast } = useAppStore();
  const [selProject, setSelProject] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ projectId: '', item: '', unit: 'kg', estimatedQty: '', estimatedRate: '', estimatedCost: '', actualQty: '', actualCost: '', category: 'Structure' });

  function saveItem() {
    if (!form.item || !form.projectId) { addToast('Item and project required', 'error'); return; }
    const cost = Number(form.estimatedQty || 0) * Number(form.estimatedRate || 0);
    setBoq(prev => [...prev, { ...form, id: Date.now(), estimatedCost: form.estimatedCost || cost }]);
    addToast('BOQ item added'); setModal(false);
  }

  const projectBOQ = boq.filter(b => !selProject || String(b.projectId) === selProject);

  // BOQ vs Stock comparison
  const stockByMaterial = useMemo(() => {
    return stockLedger.reduce((acc, s) => {
      const key = s.material?.toLowerCase();
      if (!acc[key]) acc[key] = 0;
      acc[key] += s.type === 'receipt' ? s.qty : -s.qty;
      return acc;
    }, {});
  }, [stockLedger]);

  const totalEst = projectBOQ.reduce((s, b) => s + (b.estimatedCost || 0), 0);
  const totalAct = projectBOQ.reduce((s, b) => s + (b.actualCost || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#071437' }}>Bill of Quantities</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={selProject} onChange={e => setSelProject(e.target.value)} style={{ border: '1px solid #F1F1F4', borderRadius: 8, padding: '6px 10px', fontSize: 12 }}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {!viewOnly && <Btn onClick={() => { setForm({ projectId: selProject, item: '', unit: 'kg', estimatedQty: '', estimatedRate: '', estimatedCost: '', actualQty: '', actualCost: '', category: 'Structure' }); setModal(true); }} small><Plus size={12} /> Add Item</Btn>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[['Estimated', totalEst, '#1B84FF'], ['Actual', totalAct, '#F8285A'], ['Variance', totalAct - totalEst, totalAct > totalEst ? '#F8285A' : '#17C653']].map(([l, v, c]) => (
          <div key={l} style={{ background: '#fff', borderRadius: 10, border: '1px solid #F1F1F4', padding: '12px 20px' }}>
            <div style={{ fontSize: 11, color: '#78829D' }}>{l}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: c }}>₹{Math.abs(v).toLocaleString('en-IN')}{v < 0 ? ' under' : v > 0 && l === 'Variance' ? ' over' : ''}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F1F4', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>Item</Th><Th>Category</Th><Th>Unit</Th><Th>Est. Qty</Th><Th>Est. Rate</Th><Th>Est. Cost</Th><Th>Actual Cost</Th><Th>Stock Available</Th><Th>Status</Th></tr></thead>
          <tbody>
            {projectBOQ.map(b => {
              const stockQty = stockByMaterial[b.item?.toLowerCase()] || 0;
              const estQty = Number(b.estimatedQty || 0);
              const shortage = estQty > 0 && stockQty < estQty;
              return (
                <tr key={b.id}>
                  <Td style={{ fontWeight: 500 }}>{b.item}</Td>
                  <Td>{b.category}</Td>
                  <Td>{b.unit}</Td>
                  <Td>{b.estimatedQty || '—'}</Td>
                  <Td>₹{(b.estimatedRate || 0).toLocaleString('en-IN')}</Td>
                  <Td style={{ fontWeight: 600 }}>₹{(b.estimatedCost || 0).toLocaleString('en-IN')}</Td>
                  <Td style={{ fontWeight: 600, color: b.actualCost > b.estimatedCost ? '#F8285A' : '#17C653' }}>₹{(b.actualCost || 0).toLocaleString('en-IN')}</Td>
                  <Td style={{ color: shortage ? '#F8285A' : '#17C653', fontWeight: 600 }}>{stockQty.toLocaleString('en-IN')} {b.unit}{shortage ? ' ⚠' : ''}</Td>
                  <Td>{shortage ? <Badge label="Shortage" color="#F8285A" /> : <Badge label="OK" color="#17C653" />}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {projectBOQ.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#78829D', fontSize: 13 }}>No BOQ items added.</div>}
      </div>

      {modal && (
        <ModalOverlay onClose={() => setModal(false)} title="Add BOQ Item" wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <FormField label="Project" value={form.projectId} onChange={v => setForm(f => ({ ...f, projectId: v }))} options={[{ value: '', label: '— Select —' }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
            <FormField label="Item Name *" value={form.item} onChange={v => setForm(f => ({ ...f, item: v }))} />
            <FormField label="Category" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} options={['Structure', 'Finishing', 'Plumbing', 'Electrical', 'External', 'Labour', 'Misc']} />
            <FormField label="Unit" value={form.unit} onChange={v => setForm(f => ({ ...f, unit: v }))} options={['kg', 'bags', 'sqft', 'rft', 'nos', 'mt', 'liters', 'sets', 'rmt']} />
            <FormField label="Est. Qty" value={form.estimatedQty} onChange={v => setForm(f => ({ ...f, estimatedQty: v }))} type="number" />
            <FormField label="Est. Rate (₹)" value={form.estimatedRate} onChange={v => setForm(f => ({ ...f, estimatedRate: v }))} type="number" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn onClick={() => setModal(false)} color="#4B5675" small>Cancel</Btn>
            <Btn onClick={saveItem} small>Add Item</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── MATERIAL INDENT (with OCR) ────────────────────────────────────────────
function IndentTab({ viewOnly }) {
  const { materialIndents, setMaterialIndents, projects, vendors, addToast, user } = useAppStore();
  const [modal, setModal] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [form, setForm] = useState({ projectId: '', requestedBy: '', date: new Date().toISOString().split('T')[0], urgency: 'normal', remarks: '', items: [] });

  async function runOCRIndent() {
    if (!window.vgERP) { addToast('OCR only in Electron app', 'error'); return; }
    const res = await window.vgERP.ocr.readFile();
    if (res.cancelled || !res.ok) return;
    setOcrRunning(true); setOcrProgress(0);
    try {
      const text = await runOCR(res.base64, res.ext, p => setOcrProgress(p));
      const parsed = parseIndentOCR(text);
      setForm(f => ({ ...f, items: [...f.items, ...parsed.items], remarks: parsed.remarks || f.remarks }));
      addToast(`OCR complete — ${parsed.items.length} items found`);
    } catch (e) {
      addToast('OCR failed: ' + e.message, 'error');
    } finally { setOcrRunning(false); }
  }

  function addItem() { setForm(f => ({ ...f, items: [...f.items, { material: '', qty: '', unit: 'bags', vendor: '' }] })); }
  function removeItem(i) { setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) })); }
  function updateItem(i, key, v) { setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [key]: v } : it) })); }

  function saveIndent() {
    if (!form.projectId || form.items.length === 0) { addToast('Project and at least one item required', 'error'); return; }
    const id = Date.now();
    setMaterialIndents(prev => [...prev, { ...form, id, indentNo: `IND/${new Date().getFullYear()}/${String(materialIndents.length + 1).padStart(3, '0')}`, status: 'pending', createdBy: user?.full_name, createdAt: new Date().toISOString() }]);
    addToast('Indent submitted'); setModal(null);
  }

  const STATUS_COLORS = { pending: '#F6C000', approved: '#17C653', 'po_raised': '#1B84FF', received: '#7239EA' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#071437' }}>Material Indent</div>
        {!viewOnly && <Btn onClick={() => { setForm({ projectId: '', requestedBy: user?.full_name || '', date: new Date().toISOString().split('T')[0], urgency: 'normal', remarks: '', items: [] }); setModal('form'); }} small><Plus size={12} /> New Indent</Btn>}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F1F4', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>Indent No</Th><Th>Date</Th><Th>Project</Th><Th>Items</Th><Th>Urgency</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {materialIndents.map(ind => {
              const proj = projects.find(p => String(p.id) === String(ind.projectId));
              return (
                <tr key={ind.id}>
                  <Td style={{ fontWeight: 700, color: '#071437', fontSize: 11 }}>{ind.indentNo}</Td>
                  <Td>{ind.date}</Td>
                  <Td>{proj?.name || ind.projectId}</Td>
                  <Td>{(ind.items || []).length} items</Td>
                  <Td><Badge label={ind.urgency} color={ind.urgency === 'urgent' ? '#F8285A' : '#F6C000'} /></Td>
                  <Td><Badge label={ind.status} color={STATUS_COLORS[ind.status] || '#4B5675'} /></Td>
                  <Td>
                    {!viewOnly && ind.status === 'pending' && (
                      <button onClick={() => setMaterialIndents(prev => prev.map(i => i.id === ind.id ? { ...i, status: 'approved' } : i))} style={{ background: '#E8FFF3', color: '#17C653', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Approve</button>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {materialIndents.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#78829D', fontSize: 13 }}>No indents raised yet.</div>}
      </div>

      {modal === 'form' && (
        <ModalOverlay onClose={() => setModal(null)} title="New Material Indent" wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <FormField label="Project *" value={form.projectId} onChange={v => setForm(f => ({ ...f, projectId: v }))} options={[{ value: '', label: '— Select —' }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
            <FormField label="Requested By" value={form.requestedBy} onChange={v => setForm(f => ({ ...f, requestedBy: v }))} />
            <FormField label="Date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" />
            <FormField label="Urgency" value={form.urgency} onChange={v => setForm(f => ({ ...f, urgency: v }))} options={['normal', 'urgent', 'critical']} />
          </div>

          {/* OCR Upload */}
          <div style={{ background: '#F5F0FF', borderRadius: 10, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Btn onClick={runOCRIndent} color="#7239EA" small disabled={ocrRunning}><Upload size={12} /> {ocrRunning ? `Scanning… ${ocrProgress}%` : 'Scan Indent via OCR'}</Btn>
            <span style={{ fontSize: 11, color: '#4B5675' }}>Upload a photo/PDF of handwritten or printed indent — auto-fills items below</span>
          </div>

          {/* Items */}
          <div style={{ fontWeight: 700, fontSize: 12, color: '#071437', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Items
            <button onClick={addItem} style={{ background: '#7239EA', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>+ Add Row</button>
          </div>
          {form.items.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr auto', gap: 8, marginBottom: 6, alignItems: 'flex-end' }}>
              <FormField label={i === 0 ? 'Material' : ''} value={item.material} onChange={v => updateItem(i, 'material', v)} />
              <FormField label={i === 0 ? 'Qty' : ''} value={item.qty} onChange={v => updateItem(i, 'qty', v)} type="number" />
              <FormField label={i === 0 ? 'Unit' : ''} value={item.unit} onChange={v => updateItem(i, 'unit', v)} options={['bags', 'kg', 'mt', 'sqft', 'rft', 'nos', 'liters', 'sets', 'rmt']} />
              <FormField label={i === 0 ? 'Preferred Vendor' : ''} value={item.vendor} onChange={v => updateItem(i, 'vendor', v)} />
              <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#F8285A', cursor: 'pointer', padding: '0 4px', marginBottom: 2 }}><X size={14} /></button>
            </div>
          ))}
          {form.items.length === 0 && <div style={{ fontSize: 12, color: '#78829D', padding: '8px 0', marginBottom: 12 }}>Add items manually or use OCR scan above.</div>}

          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#252F4A', display: 'block', marginBottom: 4 }}>Remarks</label>
            <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows={2} style={{ width: '100%', padding: '7px 10px', border: '1px solid #F1F1F4', borderRadius: 8, fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn onClick={() => setModal(null)} color="#4B5675" small>Cancel</Btn>
            <Btn onClick={saveIndent} small>Submit Indent</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── PROCUREMENT & AUTO-PO ─────────────────────────────────────────────────
function ProcurementTab({ viewOnly }) {
  const { purchaseOrders, setPurchaseOrders, materialIndents, vendors, setVendors, addToast, user } = useAppStore();
  const [subTab, setSubTab] = useState('vendors');
  const [modal, setModal] = useState(null);
  const [vendorForm, setVendorForm] = useState({ name: '', phone: '', email: '', gstin: '', pan: '', category: 'Cement', address: '' });
  const [poForm, setPoForm] = useState({ vendorId: '', projectId: '', items: [], expectedDelivery: '', terms: '' });

  function saveVendor() {
    if (!vendorForm.name) { addToast('Vendor name required', 'error'); return; }
    setVendors(prev => [...prev, { ...vendorForm, id: Date.now(), createdAt: new Date().toISOString() }]);
    addToast('Vendor added'); setModal(null);
  }

  function generateAutoPO() {
    // Group approved indent items by preferred vendor
    const approved = materialIndents.filter(i => i.status === 'approved');
    const byVendor = {};
    approved.forEach(ind => {
      (ind.items || []).forEach(item => {
        const vendor = item.vendor || 'Unassigned';
        if (!byVendor[vendor]) byVendor[vendor] = [];
        byVendor[vendor].push({ ...item, indentId: ind.id, projectId: ind.projectId });
      });
    });
    let created = 0;
    Object.entries(byVendor).forEach(([vendor, items]) => {
      const v = vendors.find(v => v.name === vendor);
      const poNo = `PO/${new Date().getFullYear()}/${String(purchaseOrders.length + created + 1).padStart(3, '0')}`;
      setPurchaseOrders(prev => [...prev, { id: Date.now() + created, poNo, vendorName: vendor, vendorId: v?.id, items, status: 'pending_approval', createdAt: new Date().toISOString(), createdBy: user?.full_name }]);
      created++;
    });
    if (created > 0) addToast(`${created} PO(s) auto-generated`);
    else addToast('No approved indents to convert', 'error');
  }

  function approvePO(id) {
    setPurchaseOrders(prev => prev.map(p => p.id === id ? { ...p, status: 'approved', approvedBy: user?.full_name, approvedAt: new Date().toISOString() } : p));
    addToast('PO approved');
  }

  const STATUS_COLORS = { pending_approval: '#F6C000', approved: '#17C653', sent: '#1B84FF', received: '#7239EA', cancelled: '#F8285A' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#071437' }}>Procurement & Purchase Orders</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!viewOnly && <Btn onClick={generateAutoPO} color="#17C653" small><RefreshCw size={12} /> Auto-generate POs</Btn>}
          {!viewOnly && <Btn onClick={() => { setVendorForm({ name: '', phone: '', email: '', gstin: '', pan: '', category: 'Cement', address: '' }); setModal('vendor'); }} small><Plus size={12} /> Add Vendor</Btn>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['vendors', 'Vendors'], ['pos', 'Purchase Orders']].map(([v, l]) => (
          <button key={v} onClick={() => setSubTab(v)} style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: subTab === v ? 700 : 400, color: subTab === v ? '#7239EA' : '#4B5675', background: subTab === v ? '#F5F0FF' : '#FCFCFC', border: '1px solid ' + (subTab === v ? '#EDE4FF' : 'transparent'), cursor: 'pointer' }}>{l}</button>
        ))}
      </div>

      {subTab === 'vendors' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F1F4', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Vendor Name</Th><Th>Phone</Th><Th>GSTIN</Th><Th>Category</Th><Th>POs</Th></tr></thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id}>
                  <Td style={{ fontWeight: 600 }}>{v.name}</Td>
                  <Td>{v.phone}</Td>
                  <Td style={{ fontFamily: 'monospace', fontSize: 11 }}>{v.gstin || '—'}</Td>
                  <Td>{v.category}</Td>
                  <Td>{purchaseOrders.filter(p => p.vendorId === v.id).length}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          {vendors.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#78829D', fontSize: 13 }}>No vendors added.</div>}
        </div>
      )}

      {subTab === 'pos' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F1F4', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>PO No</Th><Th>Vendor</Th><Th>Items</Th><Th>Expected Delivery</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {purchaseOrders.map(po => (
                <tr key={po.id}>
                  <Td style={{ fontWeight: 700, fontSize: 11 }}>{po.poNo}</Td>
                  <Td style={{ fontWeight: 500 }}>{po.vendorName}</Td>
                  <Td>{(po.items || []).length} items</Td>
                  <Td>{po.expectedDelivery || '—'}</Td>
                  <Td><Badge label={po.status} color={STATUS_COLORS[po.status] || '#4B5675'} /></Td>
                  <Td>
                    {!viewOnly && po.status === 'pending_approval' && (user?.role === 'super_admin' || user?.role === 'director') && (
                      <button onClick={() => approvePO(po.id)} style={{ background: '#E8FFF3', color: '#17C653', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Approve</button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          {purchaseOrders.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#78829D', fontSize: 13 }}>No POs yet. Use Auto-generate from approved indents.</div>}
        </div>
      )}

      {modal === 'vendor' && (
        <ModalOverlay onClose={() => setModal(null)} title="Add Vendor" wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Vendor Name *" value={vendorForm.name} onChange={v => setVendorForm(f => ({ ...f, name: v }))} />
            <FormField label="Phone" value={vendorForm.phone} onChange={v => setVendorForm(f => ({ ...f, phone: v }))} />
            <FormField label="Email" value={vendorForm.email} onChange={v => setVendorForm(f => ({ ...f, email: v }))} />
            <FormField label="GSTIN" value={vendorForm.gstin} onChange={v => setVendorForm(f => ({ ...f, gstin: v.toUpperCase() }))} />
            <FormField label="PAN" value={vendorForm.pan} onChange={v => setVendorForm(f => ({ ...f, pan: v.toUpperCase() }))} />
            <FormField label="Category" value={vendorForm.category} onChange={v => setVendorForm(f => ({ ...f, category: v }))} options={['Cement', 'Steel', 'Sand', 'Bricks', 'Plumbing', 'Electrical', 'Tiles', 'Painting', 'Labour', 'Machinery', 'Misc']} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn onClick={() => setModal(null)} color="#4B5675" small>Cancel</Btn>
            <Btn onClick={saveVendor} small>Save Vendor</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── GRN (with OCR) ────────────────────────────────────────────────────────
function GRNTab({ viewOnly }) {
  const { grns, setGrns, purchaseOrders, stockLedger, setStockLedger, addToast, user } = useAppStore();
  const [modal, setModal] = useState(false);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [form, setForm] = useState({ poId: '', date: new Date().toISOString().split('T')[0], challanNo: '', vehicle: '', receivedBy: '', items: [], remarks: '' });

  async function runOCRGRN() {
    if (!window.vgERP) { addToast('OCR only in Electron', 'error'); return; }
    const res = await window.vgERP.ocr.readFile();
    if (res.cancelled || !res.ok) return;
    setOcrRunning(true); setOcrProgress(0);
    try {
      const text = await runOCR(res.base64, res.ext, p => setOcrProgress(p));
      const parsed = parseGRNOCR(text);
      setForm(f => ({ ...f, challanNo: parsed.challanNo || f.challanNo, vehicle: parsed.vehicle || f.vehicle, date: parsed.date || f.date }));
      addToast('OCR complete — review and verify fields');
    } catch (e) { addToast('OCR failed: ' + e.message, 'error'); }
    finally { setOcrRunning(false); }
  }

  function saveGRN() {
    if (!form.items.length) { addToast('Add at least one item', 'error'); return; }
    const id = Date.now();
    const grnNo = `GRN/${new Date().getFullYear()}/${String(grns.length + 1).padStart(3, '0')}`;
    const grnEntry = { ...form, id, grnNo, status: 'received', createdBy: user?.full_name, createdAt: new Date().toISOString() };
    setGrns(prev => [...prev, grnEntry]);
    // Auto-update stock ledger
    form.items.forEach(item => {
      if (item.material && item.receivedQty) {
        setStockLedger(prev => [...prev, { id: Date.now() + Math.random(), date: form.date, material: item.material, qty: Number(item.receivedQty), unit: item.unit || 'nos', type: 'receipt', grnId: id, grnNo, projectId: form.projectId }]);
      }
    });
    addToast('GRN saved and stock updated'); setModal(false);
  }

  const SHORTAGE_OPTIONS = ['Accept partial — raise shortage PO', 'Accept partial — deduct from invoice', 'Reject all — return to vendor', 'Accept full — update delivery date'];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#071437' }}>Goods Receipt Note (GRN)</div>
        {!viewOnly && <Btn onClick={() => { setForm({ poId: '', date: new Date().toISOString().split('T')[0], challanNo: '', vehicle: '', receivedBy: user?.full_name || '', items: [], remarks: '' }); setModal(true); }} small><Plus size={12} /> New GRN</Btn>}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F1F4', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>GRN No</Th><Th>Date</Th><Th>PO No</Th><Th>Challan No</Th><Th>Vehicle</Th><Th>Items</Th><Th>Status</Th></tr></thead>
          <tbody>
            {grns.map(g => {
              const po = purchaseOrders.find(p => String(p.id) === String(g.poId));
              return (
                <tr key={g.id}>
                  <Td style={{ fontWeight: 700, fontSize: 11 }}>{g.grnNo}</Td>
                  <Td>{g.date}</Td>
                  <Td>{po?.poNo || '—'}</Td>
                  <Td>{g.challanNo || '—'}</Td>
                  <Td>{g.vehicle || '—'}</Td>
                  <Td>{(g.items || []).length} items</Td>
                  <Td><Badge label={g.status || 'received'} color="#17C653" /></Td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {grns.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#78829D', fontSize: 13 }}>No GRNs yet.</div>}
      </div>

      {modal && (
        <ModalOverlay onClose={() => setModal(false)} title="New GRN" wide>
          <div style={{ background: '#F5F0FF', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
            <Btn onClick={runOCRGRN} color="#7239EA" small disabled={ocrRunning}><Upload size={12} /> {ocrRunning ? `Scanning… ${ocrProgress}%` : 'Scan Delivery Challan (OCR)'}</Btn>
            <span style={{ fontSize: 11, color: '#4B5675' }}>Auto-fills challan no, vehicle, date</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <FormField label="PO Reference" value={form.poId} onChange={v => setForm(f => ({ ...f, poId: v }))} options={[{ value: '', label: '— Select PO —' }, ...purchaseOrders.map(p => ({ value: p.id, label: p.poNo }))]} />
            <FormField label="Date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" />
            <FormField label="Challan No" value={form.challanNo} onChange={v => setForm(f => ({ ...f, challanNo: v }))} />
            <FormField label="Vehicle No" value={form.vehicle} onChange={v => setForm(f => ({ ...f, vehicle: v }))} />
            <FormField label="Received By" value={form.receivedBy} onChange={v => setForm(f => ({ ...f, receivedBy: v }))} />
          </div>

          <div style={{ fontWeight: 700, fontSize: 12, color: '#071437', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            Items Received
            <button onClick={() => setForm(f => ({ ...f, items: [...f.items, { material: '', orderedQty: '', receivedQty: '', unit: 'bags', shortage: false, shortageAction: '' }] }))} style={{ background: '#7239EA', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>+ Add Row</button>
          </div>
          {form.items.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 8, marginBottom: 6, alignItems: 'flex-end' }}>
              <FormField label={i === 0 ? 'Material' : ''} value={item.material} onChange={v => { const items = [...form.items]; items[i] = { ...items[i], material: v }; setForm(f => ({ ...f, items })); }} />
              <FormField label={i === 0 ? 'Ordered' : ''} value={item.orderedQty} onChange={v => { const items = [...form.items]; items[i] = { ...items[i], orderedQty: v, shortage: Number(v) > Number(items[i].receivedQty) }; setForm(f => ({ ...f, items })); }} type="number" />
              <FormField label={i === 0 ? 'Received' : ''} value={item.receivedQty} onChange={v => { const items = [...form.items]; items[i] = { ...items[i], receivedQty: v, shortage: Number(items[i].orderedQty) > Number(v) }; setForm(f => ({ ...f, items })); }} type="number" />
              <FormField label={i === 0 ? 'Unit' : ''} value={item.unit} onChange={v => { const items = [...form.items]; items[i] = { ...items[i], unit: v }; setForm(f => ({ ...f, items })); }} options={['bags', 'kg', 'mt', 'sqft', 'rft', 'nos', 'liters', 'sets']} />
              {item.shortage ? (
                <div>
                  {i === 0 && <label style={{ fontSize: 11, fontWeight: 600, color: '#F8285A', display: 'block', marginBottom: 4 }}>Shortage Action</label>}
                  <select value={item.shortageAction || ''} onChange={e => { const items = [...form.items]; items[i] = { ...items[i], shortageAction: e.target.value }; setForm(f => ({ ...f, items })); }} style={{ width: '100%', padding: '7px 8px', border: '1px solid #FFB8C6', borderRadius: 8, fontSize: 10, color: '#F8285A' }}>
                    <option value="">⚠ Select action</option>
                    {SHORTAGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ) : <div />}
              <button onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: '#F8285A', cursor: 'pointer', marginBottom: 2 }}><X size={14} /></button>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn onClick={() => setModal(false)} color="#4B5675" small>Cancel</Btn>
            <Btn onClick={saveGRN} small>Save GRN & Update Stock</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── STOCK LEDGER ──────────────────────────────────────────────────────────
function StockTab() {
  const { stockLedger, boq, projects } = useAppStore();
  const [viewMode, setViewMode] = useState('ledger'); // ledger | consolidated | boqvs

  // Consolidated stock by material
  const consolidated = useMemo(() => {
    const map = {};
    stockLedger.forEach(s => {
      if (!map[s.material]) map[s.material] = { material: s.material, unit: s.unit, in: 0, out: 0 };
      if (s.type === 'receipt') map[s.material].in += Number(s.qty || 0);
      else map[s.material].out += Number(s.qty || 0);
    });
    return Object.values(map).map(m => ({ ...m, balance: m.in - m.out }));
  }, [stockLedger]);

  // BOQ vs Stock
  const boqVsStock = useMemo(() => {
    return boq.map(b => {
      const stock = consolidated.find(s => s.material?.toLowerCase() === b.item?.toLowerCase());
      const stockQty = stock?.balance || 0;
      const reqQty = Number(b.estimatedQty || 0);
      return { ...b, stockQty, reqQty, shortage: reqQty > stockQty, excess: stockQty > reqQty * 1.1 };
    });
  }, [boq, consolidated]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#071437' }}>Stock Ledger</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['ledger', 'Ledger'], ['consolidated', 'Consolidated'], ['boqvs', 'BOQ vs Stock']].map(([v, l]) => (
            <button key={v} onClick={() => setViewMode(v)} style={{ padding: '5px 14px', borderRadius: 7, fontSize: 11, fontWeight: viewMode === v ? 700 : 400, color: viewMode === v ? '#7239EA' : '#4B5675', background: viewMode === v ? '#F5F0FF' : '#FCFCFC', border: '1px solid ' + (viewMode === v ? '#EDE4FF' : 'transparent'), cursor: 'pointer' }}>{l}</button>
          ))}
        </div>
      </div>

      {viewMode === 'ledger' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F1F4', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Date</Th><Th>Material</Th><Th>Type</Th><Th>Qty</Th><Th>Unit</Th><Th>GRN Ref</Th><Th>Project</Th></tr></thead>
            <tbody>
              {stockLedger.map(s => (
                <tr key={s.id}>
                  <Td>{s.date}</Td>
                  <Td style={{ fontWeight: 500 }}>{s.material}</Td>
                  <Td><Badge label={s.type} color={s.type === 'receipt' ? '#17C653' : '#F8285A'} /></Td>
                  <Td style={{ fontWeight: 600, color: s.type === 'receipt' ? '#17C653' : '#F8285A' }}>{s.type === 'issue' ? '-' : '+'}{s.qty} {s.unit}</Td>
                  <Td>{s.unit}</Td>
                  <Td style={{ fontSize: 11 }}>{s.grnNo || '—'}</Td>
                  <Td>{s.projectId ? projects.find(p => String(p.id) === String(s.projectId))?.name || '—' : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          {stockLedger.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#78829D', fontSize: 13 }}>No stock entries yet. GRN entries auto-populate here.</div>}
        </div>
      )}

      {viewMode === 'consolidated' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F1F4', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Material</Th><Th>Total In</Th><Th>Total Out</Th><Th>Balance</Th><Th>Unit</Th><Th>Status</Th></tr></thead>
            <tbody>
              {consolidated.map((m, i) => (
                <tr key={i}>
                  <Td style={{ fontWeight: 600 }}>{m.material}</Td>
                  <Td style={{ color: '#17C653', fontWeight: 600 }}>{m.in}</Td>
                  <Td style={{ color: '#F8285A', fontWeight: 600 }}>{m.out}</Td>
                  <Td style={{ fontWeight: 800, color: m.balance < 0 ? '#F8285A' : m.balance < 10 ? '#F6C000' : '#17C653' }}>{m.balance}</Td>
                  <Td>{m.unit}</Td>
                  <Td>{m.balance < 0 ? <Badge label="Deficit" color="#F8285A" /> : m.balance < 10 ? <Badge label="Low" color="#F6C000" /> : <Badge label="OK" color="#17C653" />}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          {consolidated.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#78829D', fontSize: 13 }}>No stock data.</div>}
        </div>
      )}

      {viewMode === 'boqvs' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F1F4', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Material</Th><Th>BOQ Required</Th><Th>Stock Available</Th><Th>Unit</Th><Th>Status</Th><Th>Action on Excess</Th></tr></thead>
            <tbody>
              {boqVsStock.map((b, i) => (
                <tr key={i}>
                  <Td style={{ fontWeight: 500 }}>{b.item}</Td>
                  <Td>{b.reqQty}</Td>
                  <Td style={{ fontWeight: 700, color: b.shortage ? '#F8285A' : '#17C653' }}>{b.stockQty}</Td>
                  <Td>{b.unit}</Td>
                  <Td>{b.shortage ? <Badge label={`Short by ${b.reqQty - b.stockQty}`} color="#F8285A" /> : b.excess ? <Badge label={`Excess ${b.stockQty - b.reqQty}`} color="#F6C000" /> : <Badge label="OK" color="#17C653" />}</Td>
                  <Td style={{ fontSize: 11, color: '#78829D' }}>{b.excess ? 'Return / Transfer to another project / Write-off' : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          {boqVsStock.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#78829D', fontSize: 13 }}>Add BOQ items to compare with stock.</div>}
        </div>
      )}
    </div>
  );
}

// ── WORK ORDERS ───────────────────────────────────────────────────────────
function WorkOrdersTab({ viewOnly }) {
  const { workOrders, setWorkOrders, vendors, projects, addToast, user } = useAppStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ projectId: '', vendorId: '', vendorName: '', workDescription: '', startDate: '', endDate: '', contractValue: '', advancePaid: '', retentionPct: 5, tdsSection: '194C', status: 'draft', measurementBook: [] });

  function saveWO() {
    if (!form.workDescription || !form.projectId) { addToast('Description and project required', 'error'); return; }
    const woNo = `WO/${new Date().getFullYear()}/${String(workOrders.length + 1).padStart(3, '0')}`;
    const tds = Number(form.contractValue || 0) * (form.tdsSection === '194C' ? 0.01 : 0.1);
    setWorkOrders(prev => [...prev, { ...form, id: Date.now(), woNo, tdsAmount: tds, createdBy: user?.full_name, createdAt: new Date().toISOString() }]);
    addToast('Work order created'); setModal(false);
  }

  const STATUS_COLORS = { draft: '#4B5675', active: '#17C653', completed: '#1B84FF', cancelled: '#F8285A' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#071437' }}>Work Orders</div>
        {!viewOnly && <Btn onClick={() => { setForm({ projectId: '', vendorId: '', vendorName: '', workDescription: '', startDate: '', endDate: '', contractValue: '', advancePaid: '', retentionPct: 5, tdsSection: '194C', status: 'draft', measurementBook: [] }); setModal(true); }} small><Plus size={12} /> New Work Order</Btn>}
      </div>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F1F4', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>WO No</Th><Th>Contractor</Th><Th>Description</Th><Th>Contract Value</Th><Th>TDS (194C)</Th><Th>Retention</Th><Th>Status</Th></tr></thead>
          <tbody>
            {workOrders.map(w => (
              <tr key={w.id}>
                <Td style={{ fontWeight: 700, fontSize: 11 }}>{w.woNo}</Td>
                <Td>{w.vendorName}</Td>
                <Td style={{ maxWidth: 200 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.workDescription}</div></Td>
                <Td style={{ fontWeight: 600 }}>₹{Number(w.contractValue || 0).toLocaleString('en-IN')}</Td>
                <Td style={{ color: '#F8285A', fontWeight: 600 }}>₹{Number(w.tdsAmount || 0).toLocaleString('en-IN')}</Td>
                <Td>{w.retentionPct || 5}%</Td>
                <Td><Badge label={w.status} color={STATUS_COLORS[w.status] || '#4B5675'} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
        {workOrders.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#78829D', fontSize: 13 }}>No work orders yet.</div>}
      </div>

      {modal && (
        <ModalOverlay onClose={() => setModal(false)} title="New Work Order" wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <FormField label="Project *" value={form.projectId} onChange={v => setForm(f => ({ ...f, projectId: v }))} options={[{ value: '', label: '— Select —' }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
            <FormField label="Contractor" value={form.vendorName} onChange={v => setForm(f => ({ ...f, vendorName: v }))} />
            <FormField label="Start Date" value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} type="date" />
            <FormField label="End Date" value={form.endDate} onChange={v => setForm(f => ({ ...f, endDate: v }))} type="date" />
            <FormField label="Contract Value (₹)" value={form.contractValue} onChange={v => setForm(f => ({ ...f, contractValue: v }))} type="number" />
            <FormField label="Advance Paid (₹)" value={form.advancePaid} onChange={v => setForm(f => ({ ...f, advancePaid: v }))} type="number" />
            <FormField label="Retention (%)" value={form.retentionPct} onChange={v => setForm(f => ({ ...f, retentionPct: Number(v) }))} type="number" />
            <FormField label="TDS Section" value={form.tdsSection} onChange={v => setForm(f => ({ ...f, tdsSection: v }))} options={['194C', '194J']} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#252F4A', display: 'block', marginBottom: 4 }}>Work Description *</label>
            <textarea value={form.workDescription} onChange={e => setForm(f => ({ ...f, workDescription: e.target.value }))} rows={3} style={{ width: '100%', padding: '7px 10px', border: '1px solid #F1F1F4', borderRadius: 8, fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn onClick={() => setModal(false)} color="#4B5675" small>Cancel</Btn>
            <Btn onClick={saveWO} small>Create Work Order</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── LABOUR REPORT ─────────────────────────────────────────────────────────
function LabourTab({ viewOnly }) {
  const { labourReports, setLabourReports, projects, addToast } = useAppStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], projectId: '', supervisor: '', skilled: 0, semiskilled: 0, unskilled: 0, wages: '', category: 'Civil', remarks: '' });

  function saveReport() {
    if (!form.projectId) { addToast('Project required', 'error'); return; }
    setLabourReports(prev => [...prev, { ...form, id: Date.now(), total: Number(form.skilled) + Number(form.semiskilled) + Number(form.unskilled) }]);
    addToast('Labour report saved'); setModal(false);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#071437' }}>Labour Report</div>
        {!viewOnly && <Btn onClick={() => { setForm({ date: new Date().toISOString().split('T')[0], projectId: '', supervisor: '', skilled: 0, semiskilled: 0, unskilled: 0, wages: '', category: 'Civil', remarks: '' }); setModal(true); }} small><Plus size={12} /> Add Report</Btn>}
      </div>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F1F4', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>Date</Th><Th>Project</Th><Th>Supervisor</Th><Th>Skilled</Th><Th>Semi-Skilled</Th><Th>Unskilled</Th><Th>Total</Th><Th>Wages (₹)</Th></tr></thead>
          <tbody>
            {labourReports.map(r => {
              const proj = projects.find(p => String(p.id) === String(r.projectId));
              return (
                <tr key={r.id}>
                  <Td>{r.date}</Td>
                  <Td style={{ fontWeight: 500 }}>{proj?.name || '—'}</Td>
                  <Td>{r.supervisor}</Td>
                  <Td style={{ fontWeight: 600, color: '#1B84FF' }}>{r.skilled}</Td>
                  <Td>{r.semiskilled}</Td>
                  <Td>{r.unskilled}</Td>
                  <Td style={{ fontWeight: 700 }}>{r.total || (Number(r.skilled) + Number(r.semiskilled) + Number(r.unskilled))}</Td>
                  <Td style={{ fontWeight: 600, color: '#17C653' }}>₹{Number(r.wages || 0).toLocaleString('en-IN')}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {labourReports.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#78829D', fontSize: 13 }}>No labour reports yet.</div>}
      </div>
      {modal && (
        <ModalOverlay onClose={() => setModal(false)} title="Add Labour Report">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" />
            <FormField label="Project *" value={form.projectId} onChange={v => setForm(f => ({ ...f, projectId: v }))} options={[{ value: '', label: '— Select —' }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
            <FormField label="Supervisor" value={form.supervisor} onChange={v => setForm(f => ({ ...f, supervisor: v }))} />
            <FormField label="Category" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} options={['Civil', 'Electrical', 'Plumbing', 'Finishing', 'Steel', 'Misc']} />
            <FormField label="Skilled Workers" value={form.skilled} onChange={v => setForm(f => ({ ...f, skilled: Number(v) }))} type="number" />
            <FormField label="Semi-Skilled" value={form.semiskilled} onChange={v => setForm(f => ({ ...f, semiskilled: Number(v) }))} type="number" />
            <FormField label="Unskilled" value={form.unskilled} onChange={v => setForm(f => ({ ...f, unskilled: Number(v) }))} type="number" />
            <FormField label="Wages Paid (₹)" value={form.wages} onChange={v => setForm(f => ({ ...f, wages: v }))} type="number" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Btn onClick={() => setModal(false)} color="#4B5675" small>Cancel</Btn>
            <Btn onClick={saveReport} small>Save Report</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── SITE PHOTOS ───────────────────────────────────────────────────────────
function SitePhotosTab({ viewOnly }) {
  const { sitePhotos, setSitePhotos, projects, addToast, user } = useAppStore();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const [form, setForm] = useState({ projectId: '', caption: '', date: new Date().toISOString().split('T')[0], category: 'Progress' });

  async function uploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1];
        const fileName = `site_${Date.now()}_${file.name}`;
        let savedPath = '';
        if (window.vgERP) {
          const res = await window.vgERP.photo.save(base64, fileName);
          if (res.ok) savedPath = res.path;
        }
        setSitePhotos(prev => [...prev, { ...form, id: Date.now(), fileName, base64Preview: ev.target.result, savedPath, uploadedBy: user?.full_name, uploadedAt: new Date().toISOString() }]);
        addToast('Photo uploaded');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (e) { addToast('Upload failed', 'error'); setUploading(false); }
  }

  const CATEGORIES = ['Progress', 'Defect', 'Safety', 'Material', 'Quality', 'Event'];
  const CATEGORY_COLORS = { Progress: '#17C653', Defect: '#F8285A', Safety: '#F6C000', Material: '#1B84FF', Quality: '#7239EA', Event: '#0E9F8A' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#071437' }}>Site Photos Log</div>
        {!viewOnly && (
          <div style={{ display: 'flex', gap: 8 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadPhoto} />
            <Btn onClick={() => fileRef.current?.click()} disabled={uploading} small><Camera size={12} /> {uploading ? 'Uploading…' : 'Upload Photo'}</Btn>
          </div>
        )}
      </div>

      {!viewOnly && (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #F1F1F4', padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: 10 }}>
            <FormField label="Project" value={form.projectId} onChange={v => setForm(f => ({ ...f, projectId: v }))} options={[{ value: '', label: 'All' }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
            <FormField label="Date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" />
            <FormField label="Category" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} options={CATEGORIES} />
            <FormField label="Caption" value={form.caption} onChange={v => setForm(f => ({ ...f, caption: v }))} />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {sitePhotos.map(p => {
          const proj = projects.find(pr => String(pr.id) === String(p.projectId));
          return (
            <div key={p.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #F1F1F4', overflow: 'hidden' }}>
              <div style={{ height: 140, background: p.base64Preview ? `url(${p.base64Preview}) center/cover no-repeat` : '#FCFCFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!p.base64Preview && <Camera size={32} style={{ color: '#DBDFE9' }} />}
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#071437', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.caption || 'No caption'}</div>
                <div style={{ fontSize: 10, color: '#78829D', marginTop: 2 }}>{proj?.name || '—'} · {p.date}</div>
                {p.category && <Badge label={p.category} color={CATEGORY_COLORS[p.category] || '#4B5675'} />}
              </div>
            </div>
          );
        })}
        {sitePhotos.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: 48, textAlign: 'center', color: '#78829D', fontSize: 13, background: '#fff', borderRadius: 12, border: '1px solid #F1F1F4' }}>
            <Camera size={40} style={{ color: '#DBDFE9', marginBottom: 12 }} />
            <div>No site photos yet. Click Upload Photo to add.</div>
          </div>
        )}
      </div>
    </div>
  );
}
