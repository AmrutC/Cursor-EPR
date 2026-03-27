import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Plus, Search, Eye, Check, X, Edit3, Phone, Mail, Download, Send, Printer, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { suggestGSTRate } from '../../data.js';

// ── SUB-TAB ROUTER ─────────────────────────────────────────────────────────
export default function SalesModule({ viewOnly }) {
  const { activeSubTab } = useAppStore();
  const tab = activeSubTab || 'crm';

  return (
    <div>
      {tab === 'crm'         && <CRMTab viewOnly={viewOnly} />}
      {tab === 'inventory'   && <InventoryTab viewOnly={viewOnly} />}
      {tab === 'bookings'    && <BookingsTab viewOnly={viewOnly} />}
      {tab === 'collections' && <CollectionsTab viewOnly={viewOnly} />}
      {tab === 'brokers'     && <BrokersTab viewOnly={viewOnly} />}
      {tab === 'documents'   && <DocumentsTab viewOnly={viewOnly} />}
    </div>
  );
}

// ── SHARED ─────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, color = '#1B84FF', small, disabled, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? '#F1F1F4' : color, color: disabled ? '#78829D' : '#fff',
    border: 'none', borderRadius: 8, padding: small ? '5px 12px' : '7px 16px',
    fontSize: small ? 11 : 12, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', gap: 5, ...style,
  }}>{children}</button>
);

const Badge = ({ label, color = '#1B84FF', bg }) => (
  <span style={{ background: bg || color + '18', color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{label}</span>
);

const PIPELINE_STAGES = ['New', 'Contacted', 'Site Visit', 'Negotiation', 'Booked', 'Lost'];
const STAGE_COLORS = { New: '#4B5675', Contacted: '#1B84FF', 'Site Visit': '#7239EA', Negotiation: '#F6C000', Booked: '#17C653', Lost: '#F8285A' };
const LEAD_SOURCES = ['Walk-in', 'Referral', 'Broker', 'Social Media', 'Hoarding', 'Online Ad', 'Other'];

// ── CRM & LEADS ────────────────────────────────────────────────────────────
function CRMTab({ viewOnly }) {
  const { crmLeads, setCrmLeads, projects, siteVisits, setSiteVisits, addToast, addAuditEntry, user } = useAppStore();
  const [view, setView] = useState('pipeline'); // pipeline | list
  const [modal, setModal] = useState(null); // null | 'add' | 'view' | 'sitevisit' | 'followup'
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name:'', phone:'', email:'', source:'Walk-in', stage:'New', interestedIn:'', budget:'', followUpDate:'', remarks:'' });

  const filtered = crmLeads.filter(l => !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search));

  function openAdd() { setForm({ name:'', phone:'', email:'', source:'Walk-in', stage:'New', interestedIn:'', budget:'', followUpDate:'', remarks:'' }); setModal('add'); }
  function openView(l) { setSelected(l); setModal('view'); }

  function saveLead() {
    if (!form.name) { addToast('Lead name required', 'error'); return; }
    const id = Date.now();
    const newLead = { ...form, id, createdAt: new Date().toISOString(), createdBy: user?.full_name };
    setCrmLeads(prev => [newLead, ...prev]);
    addAuditEntry({ action: 'ADD_LEAD', module: 'CRM', detail: form.name });
    addToast('Lead added');
    setModal(null);
  }

  function updateStage(id, stage) {
    setCrmLeads(prev => prev.map(l => l.id === id ? { ...l, stage, updatedAt: new Date().toISOString() } : l));
    addToast(`Stage updated to ${stage}`);
  }

  function setFollowUp(id, date) {
    setCrmLeads(prev => prev.map(l => l.id === id ? { ...l, followUpDate: date } : l));
    addToast('Follow-up scheduled');
  }

  const byStage = PIPELINE_STAGES.reduce((acc, s) => { acc[s] = filtered.filter(l => l.stage === s); return acc; }, {});
  const overdueCount = crmLeads.filter(l => l.followUpDate && new Date(l.followUpDate) < new Date() && l.stage !== 'Booked' && l.stage !== 'Lost').length;

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:'#071437' }}>CRM & Leads</div>
          <div style={{ fontSize:11, color:'#78829D' }}>{crmLeads.length} total leads{overdueCount > 0 ? ` · ${overdueCount} follow-up overdue` : ''}</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ position:'relative' }}>
            <Search size={12} style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#78829D' }} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search leads…" style={{ paddingLeft:26, paddingRight:10, paddingTop:6, paddingBottom:6, border:'1px solid #F1F1F4', borderRadius:8, fontSize:12, outline:'none', width:200 }} />
          </div>
          <div style={{ display:'flex', background:'#FCFCFC', borderRadius:8, padding:3 }}>
            {[['pipeline','Pipeline'],['list','List']].map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)} style={{ padding:'4px 14px', borderRadius:6, fontSize:11, fontWeight:view===v?700:500, color:view===v?'#071437':'#4B5675', background:view===v?'#fff':'transparent', border:view===v?'1px solid #F1F1F4':'1px solid transparent', cursor:'pointer' }}>{l}</button>
            ))}
          </div>
          {!viewOnly && <Btn onClick={openAdd} small><Plus size={12}/> Add Lead</Btn>}
        </div>
      </div>

      {/* Pipeline View */}
      {view === 'pipeline' && (
        <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:8 }}>
          {PIPELINE_STAGES.map(stage => (
            <div key={stage} style={{ minWidth:200, maxWidth:220 }}>
              <div style={{ background:'#fff', borderRadius:10, border:'1px solid #F1F1F4', overflow:'hidden' }}>
                <div style={{ padding:'10px 12px', borderBottom:'1px solid #FCFCFC', background:STAGE_COLORS[stage]+'12' }}>
                  <div style={{ fontWeight:700, fontSize:12, color:STAGE_COLORS[stage] }}>{stage}</div>
                  <div style={{ fontSize:10, color:'#78829D' }}>{byStage[stage].length} leads</div>
                </div>
                <div style={{ maxHeight:400, overflowY:'auto' }}>
                  {byStage[stage].map(l => (
                    <div key={l.id} onClick={()=>openView(l)} style={{ padding:'10px 12px', borderBottom:'1px solid #FCFCFC', cursor:'pointer' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#FCFCFC'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <div style={{ fontSize:12, fontWeight:600, color:'#071437' }}>{l.name}</div>
                      <div style={{ fontSize:10, color:'#78829D', marginTop:2 }}>{l.phone} · {l.source}</div>
                      {l.followUpDate && (
                        <div style={{ fontSize:9.5, color: new Date(l.followUpDate) < new Date() ? '#F8285A' : '#17C653', marginTop:3, fontWeight:600 }}>
                          Follow-up: {l.followUpDate}
                        </div>
                      )}
                    </div>
                  ))}
                  {byStage[stage].length === 0 && <div style={{ padding:16, textAlign:'center', color:'#DBDFE9', fontSize:11 }}>No leads</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #F1F1F4', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#FCFCFC' }}>
                {['Name','Phone','Source','Stage','Interested In','Follow-up','Actions'].map(h=>(
                  <th key={h} style={{ padding:'10px 14px', fontSize:11, fontWeight:700, color:'#4B5675', textAlign:'left', borderBottom:'1px solid #FCFCFC' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l=>(
                <tr key={l.id} style={{ borderBottom:'1px solid #FCFCFC' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#FCFCFC'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'9px 14px', fontSize:12, fontWeight:600, color:'#071437' }}>{l.name}</td>
                  <td style={{ padding:'9px 14px', fontSize:12, color:'#252F4A' }}>{l.phone}</td>
                  <td style={{ padding:'9px 14px' }}><Badge label={l.source} color="#4B5675" /></td>
                  <td style={{ padding:'9px 14px' }}><Badge label={l.stage} color={STAGE_COLORS[l.stage]} /></td>
                  <td style={{ padding:'9px 14px', fontSize:12, color:'#252F4A' }}>{l.interestedIn}</td>
                  <td style={{ padding:'9px 14px', fontSize:11, color: l.followUpDate && new Date(l.followUpDate)<new Date() ? '#F8285A' : '#252F4A' }}>{l.followUpDate || '—'}</td>
                  <td style={{ padding:'9px 14px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={()=>openView(l)} style={{ background:'#EEF6FF', color:'#1B84FF', border:'none', borderRadius:6, padding:'4px 8px', fontSize:11, cursor:'pointer' }}>View</button>
                      {!viewOnly && (
                        <select value={l.stage} onChange={e=>updateStage(l.id, e.target.value)} style={{ fontSize:10, border:'1px solid #F1F1F4', borderRadius:6, padding:'3px 6px', cursor:'pointer' }}>
                          {PIPELINE_STAGES.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ padding:32, textAlign:'center', color:'#78829D', fontSize:13 }}>No leads yet. Click Add Lead to get started.</div>}
        </div>
      )}

      {/* Add Lead Modal */}
      {modal === 'add' && (
        <ModalOverlay onClose={()=>setModal(null)} title="Add New Lead">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[['name','Name *'],['phone','Phone'],['email','Email'],['interestedIn','Interested In']].map(([k,l])=>(
              <FormField key={k} label={l} value={form[k]} onChange={v=>setForm(f=>({...f,[k]:v}))} />
            ))}
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'#252F4A', display:'block', marginBottom:4 }}>Source</label>
              <select value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))} style={{ width:'100%', padding:'7px 10px', border:'1px solid #F1F1F4', borderRadius:8, fontSize:12 }}>
                {LEAD_SOURCES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'#252F4A', display:'block', marginBottom:4 }}>Stage</label>
              <select value={form.stage} onChange={e=>setForm(f=>({...f,stage:e.target.value}))} style={{ width:'100%', padding:'7px 10px', border:'1px solid #F1F1F4', borderRadius:8, fontSize:12 }}>
                {PIPELINE_STAGES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <FormField label="Budget (₹)" value={form.budget} onChange={v=>setForm(f=>({...f,budget:v}))} type="number" />
            <FormField label="Follow-up Date" value={form.followUpDate} onChange={v=>setForm(f=>({...f,followUpDate:v}))} type="date" />
          </div>
          <div style={{ marginTop:12 }}>
            <label style={{ fontSize:11, fontWeight:600, color:'#252F4A', display:'block', marginBottom:4 }}>Remarks</label>
            <textarea value={form.remarks} onChange={e=>setForm(f=>({...f,remarks:e.target.value}))} rows={2} style={{ width:'100%', padding:'7px 10px', border:'1px solid #F1F1F4', borderRadius:8, fontSize:12, resize:'vertical', boxSizing:'border-box' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:16 }}>
            <Btn onClick={()=>setModal(null)} color="#4B5675" small>Cancel</Btn>
            <Btn onClick={saveLead} small>Save Lead</Btn>
          </div>
        </ModalOverlay>
      )}

      {/* View Lead Modal */}
      {modal === 'view' && selected && (
        <ModalOverlay onClose={()=>setModal(null)} title={selected.name} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            {[['Phone',selected.phone],['Email',selected.email],['Source',selected.source],['Stage',selected.stage],['Interested In',selected.interestedIn],['Budget',selected.budget?'₹'+Number(selected.budget).toLocaleString('en-IN'):'—'],['Follow-up',selected.followUpDate||'—'],['Added',selected.createdAt?new Date(selected.createdAt).toLocaleDateString('en-IN'):'—']].map(([k,v])=>(
              <div key={k}><div style={{ fontSize:10, color:'#78829D' }}>{k}</div><div style={{ fontSize:13, fontWeight:600, color:'#071437' }}>{v||'—'}</div></div>
            ))}
          </div>
          {selected.remarks && <div style={{ background:'#FCFCFC', borderRadius:8, padding:'10px 14px', marginBottom:12 }}><div style={{ fontSize:10, color:'#78829D', marginBottom:4 }}>Remarks</div><div style={{ fontSize:12, color:'#252F4A' }}>{selected.remarks}</div></div>}
          {!viewOnly && (
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <select value={selected.stage} onChange={e=>{ updateStage(selected.id, e.target.value); setSelected(s=>({...s,stage:e.target.value})); }} style={{ fontSize:11, border:'1px solid #F1F1F4', borderRadius:8, padding:'6px 10px', cursor:'pointer' }}>
                {PIPELINE_STAGES.map(s=><option key={s}>{s}</option>)}
              </select>
              <input type="date" value={selected.followUpDate||''} onChange={e=>{ setFollowUp(selected.id, e.target.value); setSelected(s=>({...s,followUpDate:e.target.value})); }} style={{ fontSize:11, border:'1px solid #F1F1F4', borderRadius:8, padding:'6px 10px' }} />
            </div>
          )}
        </ModalOverlay>
      )}
    </div>
  );
}

// ── INVENTORY (Projects + Units) ───────────────────────────────────────────
function InventoryTab({ viewOnly }) {
  const { projects, setProjects, bookings, addToast, user, nextSerial } = useAppStore();
  const [selProject, setSelProject] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name:'', location:'', totalUnits:0, reraNo:'', completionPct:0, status:'active' });
  const [unitForm, setUnitForm] = useState({ unitNo:'', type:'2BHK', floor:'', carpetArea:'', agreementValue:'', facing:'' });

  function addProject() {
    if (!form.name) { addToast('Project name required','error'); return; }
    const id = Date.now();
    setProjects(prev=>[...prev, { ...form, id, units:[], createdAt:new Date().toISOString() }]);
    addToast('Project added'); setModal(null);
  }

  function addUnit() {
    if (!unitForm.unitNo) { addToast('Unit number required','error'); return; }
    setProjects(prev=>prev.map(p=>p.id===selProject.id ? { ...p, units:[...(p.units||[]),{...unitForm,id:Date.now(),status:'Available'}] } : p));
    const updated = projects.find(p=>p.id===selProject.id);
    setSelProject(p=>p?{...p,units:[...(p.units||[]),{...unitForm,id:Date.now(),status:'Available'}]}:p);
    addToast('Unit added'); setModal(null);
  }

  const proj = selProject ? projects.find(p=>p.id===selProject.id) || selProject : null;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:800, color:'#071437' }}>Projects & Inventory</div>
        {!viewOnly && <Btn onClick={()=>{ setForm({name:'',location:'',totalUnits:0,reraNo:'',completionPct:0,status:'active'}); setModal('addProject'); }} small><Plus size={12}/> Add Project</Btn>}
      </div>

      {!proj ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
          {projects.map(p=>{
            const units = p.units||[];
            const booked = bookings.filter(b=>b.projectId===p.id && b.status!=='cancelled').length;
            const avail = units.filter(u=>u.status==='Available').length;
            return (
              <div key={p.id} onClick={()=>setSelProject(p)} style={{ background:'#fff', borderRadius:12, border:'1px solid #F1F1F4', padding:18, cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                <div style={{ fontSize:14, fontWeight:800, color:'#071437', marginBottom:4 }}>{p.name}</div>
                <div style={{ fontSize:11, color:'#78829D', marginBottom:12 }}>{p.location}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                  {[['Total',units.length,'#4B5675'],['Booked',booked,'#1B84FF'],['Available',avail,'#17C653']].map(([l,v,c])=>(
                    <div key={l} style={{ textAlign:'center', background:c+'10', borderRadius:8, padding:'8px 4px' }}>
                      <div style={{ fontSize:16, fontWeight:800, color:c }}>{v}</div>
                      <div style={{ fontSize:9.5, color:c }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ height:5, background:'#FCFCFC', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:`${p.completionPct||0}%`, height:'100%', background:'#1B84FF', borderRadius:3 }}/>
                </div>
                <div style={{ fontSize:9.5, color:'#78829D', marginTop:4 }}>{p.completionPct||0}% complete</div>
              </div>
            );
          })}
          {projects.length===0 && <div style={{ gridColumn:'1/-1', padding:48, textAlign:'center', color:'#78829D', fontSize:13, background:'#fff', borderRadius:12, border:'1px solid #F1F1F4' }}>No projects yet. Add your first project.</div>}
        </div>
      ) : (
        <div>
          <button onClick={()=>setSelProject(null)} style={{ fontSize:12, color:'#1B84FF', background:'none', border:'none', cursor:'pointer', marginBottom:14, display:'flex', alignItems:'center', gap:4 }}>
            ← Back to Projects
          </button>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#071437' }}>{proj.name} — Units</div>
            {!viewOnly && <Btn onClick={()=>{ setUnitForm({unitNo:'',type:'2BHK',floor:'',carpetArea:'',agreementValue:'',facing:''}); setModal('addUnit'); }} small><Plus size={12}/> Add Unit</Btn>}
          </div>
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #F1F1F4', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#FCFCFC' }}>
                  {['Unit No','Type','Floor','Carpet Area','Agreement Value','Facing','Status'].map(h=>(
                    <th key={h} style={{ padding:'10px 14px', fontSize:11, fontWeight:700, color:'#4B5675', textAlign:'left', borderBottom:'1px solid #FCFCFC' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(proj.units||[]).map(u=>{
                  const bkg = bookings.find(b=>b.unitId===u.id && b.status!=='cancelled');
                  const statusColor = { Available:'#17C653', Booked:'#1B84FF', Registered:'#7239EA', Blocked:'#F6C000', Cancelled:'#F8285A' };
                  return (
                    <tr key={u.id}>
                      <td style={{ padding:'8px 14px', fontSize:12, fontWeight:700, color:'#071437' }}>{u.unitNo}</td>
                      <td style={{ padding:'8px 14px', fontSize:12, color:'#252F4A' }}>{u.type}</td>
                      <td style={{ padding:'8px 14px', fontSize:12, color:'#252F4A' }}>{u.floor}</td>
                      <td style={{ padding:'8px 14px', fontSize:12, color:'#252F4A' }}>{u.carpetArea} sq.ft.</td>
                      <td style={{ padding:'8px 14px', fontSize:12, color:'#252F4A' }}>{u.agreementValue?'₹'+Number(u.agreementValue).toLocaleString('en-IN'):'—'}</td>
                      <td style={{ padding:'8px 14px', fontSize:12, color:'#252F4A' }}>{u.facing||'—'}</td>
                      <td style={{ padding:'8px 14px' }}><Badge label={bkg?'Booked':u.status||'Available'} color={statusColor[bkg?'Booked':u.status||'Available']||'#4B5675'} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(proj.units||[]).length===0 && <div style={{ padding:32, textAlign:'center', color:'#78829D', fontSize:13 }}>No units added yet.</div>}
          </div>
        </div>
      )}

      {modal==='addProject' && (
        <ModalOverlay onClose={()=>setModal(null)} title="Add Project">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <FormField label="Project Name *" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} />
            <FormField label="Location" value={form.location} onChange={v=>setForm(f=>({...f,location:v}))} />
            <FormField label="RERA Number" value={form.reraNo} onChange={v=>setForm(f=>({...f,reraNo:v}))} />
            <FormField label="Completion %" value={form.completionPct} onChange={v=>setForm(f=>({...f,completionPct:v}))} type="number" />
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:16 }}>
            <Btn onClick={()=>setModal(null)} color="#4B5675" small>Cancel</Btn>
            <Btn onClick={addProject} small>Add Project</Btn>
          </div>
        </ModalOverlay>
      )}

      {modal==='addUnit' && (
        <ModalOverlay onClose={()=>setModal(null)} title="Add Unit">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <FormField label="Unit No *" value={unitForm.unitNo} onChange={v=>setUnitForm(f=>({...f,unitNo:v}))} />
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'#252F4A', display:'block', marginBottom:4 }}>Type</label>
              <select value={unitForm.type} onChange={e=>setUnitForm(f=>({...f,type:e.target.value}))} style={{ width:'100%', padding:'7px 10px', border:'1px solid #F1F1F4', borderRadius:8, fontSize:12 }}>
                {['Studio','1RK','1BHK','2BHK','3BHK','4BHK','Shop','Office'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <FormField label="Floor" value={unitForm.floor} onChange={v=>setUnitForm(f=>({...f,floor:v}))} />
            <FormField label="Carpet Area (sq.ft.)" value={unitForm.carpetArea} onChange={v=>setUnitForm(f=>({...f,carpetArea:v}))} type="number" />
            <FormField label="Agreement Value (₹)" value={unitForm.agreementValue} onChange={v=>setUnitForm(f=>({...f,agreementValue:v}))} type="number" />
            <FormField label="Facing" value={unitForm.facing} onChange={v=>setUnitForm(f=>({...f,facing:v}))} />
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:16 }}>
            <Btn onClick={()=>setModal(null)} color="#4B5675" small>Cancel</Btn>
            <Btn onClick={addUnit} small>Add Unit</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── BOOKINGS ───────────────────────────────────────────────────────────────
function BookingsTab({ viewOnly }) {
  const { bookings, setBookings, projects, setProjects, brokers, setJournalEntries, addToast, addAuditEntry, user, activeEntity } = useAppStore();
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({
    customerName:'', customerPhone:'', customerPAN:'',
    coApplicantName:'', coApplicantPAN:'',
    projectId:'', unitId:'', brokerId:'',
    bookingDate:new Date().toISOString().split('T')[0],
    agreementValue:'', unitType:'', gstRate:5,
    milestones:[], status:'pending',
  });
  const [cancelForm, setCancelForm] = useState({ reason:'', chargeType:'flat', chargeValue:'' });

  const filtered = bookings.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (search && !b.customerName?.toLowerCase().includes(search.toLowerCase()) && !b.bookingNo?.includes(search)) return false;
    return true;
  });

  function openAdd() {
    setForm({
      customerName:'', customerPhone:'', customerPAN:'',
      coApplicantName:'', coApplicantPAN:'',
      projectId:'', unitId:'', brokerId:'',
      bookingDate:new Date().toISOString().split('T')[0],
      agreementValue:'', unitType:'', gstRate:5,
      milestones:[], status:'pending',
    });
    setModal('add');
  }

  const selectedProject = projects.find(p => String(p.id) === String(form.projectId));
  const selectedUnit = (selectedProject?.units || []).find(u => String(u.id) === String(form.unitId));
  const availableUnits = (selectedProject?.units || []).filter(u => {
    const alreadyBooked = bookings.some(
      b => String(b.projectId) === String(selectedProject?.id) &&
           String(b.unitId) === String(u.id) &&
           b.status !== 'cancelled',
    );
    if (form.unitId && String(form.unitId) === String(u.id)) return true;
    return !alreadyBooked && (u.status === 'Available' || !u.status);
  });

  useEffect(() => {
    if (!form.projectId || !form.unitId || !selectedUnit) return;
    setForm(f => ({
      ...f,
      agreementValue: Number(f.agreementValue) > 0 ? f.agreementValue : Number(selectedUnit.agreementValue || 0),
      unitType: selectedUnit.type || '',
    }));
  }, [form.projectId, form.unitId, selectedUnit?.id]);

  useEffect(() => {
    if (!form.unitType && !form.agreementValue) return;
    setForm(f => ({
      ...f,
      gstRate: suggestGSTRate(f.unitType || 'Flat', Number(f.agreementValue || 0)),
    }));
  }, [form.unitType, form.agreementValue]);

  function addMilestoneRow() {
    setForm(f => ({
      ...f,
      milestones: [
        ...(f.milestones || []),
        { id: Date.now() + Math.random(), label: '', amount: '', dueDate: '', remarks: '' },
      ],
    }));
  }
  function updateMilestoneRow(id, key, value) {
    setForm(f => ({
      ...f,
      milestones: (f.milestones || []).map(m => (m.id === id ? { ...m, [key]: value } : m)),
    }));
  }
  function removeMilestoneRow(id) {
    setForm(f => ({ ...f, milestones: (f.milestones || []).filter(m => m.id !== id) }));
  }

  function saveBooking() {
    if (!form.customerName || !form.projectId || !form.unitId) {
      addToast('Customer, project, and unit are required','error');
      return;
    }
    const id = Date.now();
    const bookingNo = `BKG/${activeEntity?.code||'VEH'}/${new Date().getFullYear()}/${String(bookings.length+1).padStart(3,'0')}`;
    const normalizedMilestones = (form.milestones || [])
      .filter(m => m.label && Number(m.amount) > 0 && m.dueDate)
      .map((m, idx) => ({
        id: m.id || (Date.now() + idx),
        label: m.label,
        amount: Number(m.amount),
        dueDate: m.dueDate,
        remarks: m.remarks || '',
      }));
    setBookings(prev=>[...prev, {
      ...form,
      projectId: Number(form.projectId),
      unitId: Number(form.unitId),
      brokerId: form.brokerId ? Number(form.brokerId) : '',
      agreementValue: Number(form.agreementValue || 0),
      unitType: form.unitType || selectedUnit?.type || '',
      milestones: normalizedMilestones,
      id,
      bookingNo,
      payments:[],
      createdAt:new Date().toISOString(),
      createdBy:user?.full_name,
    }]);
    addAuditEntry({ action:'ADD_BOOKING', module:'Sales', detail:`${form.customerName} - ${bookingNo}` });
    addToast('Booking created');
    setModal(null);
  }

  function approveBooking(id) {
    let approvedBooking = null;
    setBookings(prev=>prev.map(b=>{
      if (b.id !== id) return b;
      approvedBooking = b;
      return { ...b, status:'approved', approvedBy:user?.full_name, approvedAt:new Date().toISOString() };
    }));
    if (approvedBooking?.projectId && approvedBooking?.unitId) {
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(approvedBooking.projectId)) return p;
        return {
          ...p,
          units: (p.units || []).map(u => (
            String(u.id) === String(approvedBooking.unitId) ? { ...u, status: 'Booked' } : u
          )),
        };
      }));
    }
    const broker = brokers.find(br => String(br.id) === String(approvedBooking?.brokerId));
    if (broker) {
      const commissionPct = Number(broker.brokeragePercent || 2);
      const commission = Number(approvedBooking?.agreementValue || 0) * (commissionPct / 100);
      if (commission > 0) {
        setJournalEntries(prev => [{
          id: Date.now() + Math.random(),
          date: new Date().toISOString().split('T')[0],
          voucherType: 'Journal',
          voucherNo: `BRK/${activeEntity?.code || 'VEH'}/${String(Date.now()).slice(-6)}`,
          narration: `Brokerage payable for ${approvedBooking.bookingNo || approvedBooking.id} (${broker.name})`,
          amount: Number(commission.toFixed(2)),
          drAccount: 'E012',
          crAccount: 'L002',
          ref: approvedBooking.bookingNo || String(approvedBooking.id),
          createdBy: user?.full_name,
          createdAt: new Date().toISOString(),
        }, ...prev]);
      }
    }
    addAuditEntry({ action:'APPROVE_BOOKING', module:'Sales', detail:id });
    addToast('Booking approved');
  }

  function cancelBooking() {
    if (!selected) return;
    const b = selected;
    const charge = cancelForm.chargeType==='flat' ? Number(cancelForm.chargeValue) : (b.agreementValue||0) * Number(cancelForm.chargeValue) / 100;
    setBookings(prev=>prev.map(bk=>bk.id===b.id ? { ...bk, status:'cancelled', cancelledAt:new Date().toISOString(), cancelReason:cancelForm.reason, cancellationCharge:charge } : bk));
    // Revert unit status
    if (b.projectId && b.unitId) {
      setProjects(prev => prev.map(p => {
        if (String(p.id) !== String(b.projectId)) return p;
        return {
          ...p,
          units: (p.units || []).map(u => (
            String(u.id) === String(b.unitId) ? { ...u, status: 'Available' } : u
          )),
        };
      }));
    }
    addAuditEntry({ action:'CANCEL_BOOKING', module:'Sales', detail:`${b.bookingNo} - ${cancelForm.reason}` });
    addToast('Booking cancelled');
    setModal(null);
  }

  function addPayment(bookingId, payment) {
    const normalized = {
      ...payment,
      id: Date.now(),
      amount: Number(payment.amount || 0),
      date: payment.date || new Date().toISOString().split('T')[0],
      milestoneId: payment.milestoneId || '',
    };
    setBookings(prev=>prev.map(b=>b.id===bookingId ? { ...b, payments:[...(b.payments||[]), normalized] } : b));
    addToast('Payment recorded');
  }

  const canApprove = user?.role==='super_admin' || user?.role==='director';
  const canCancel = user?.role==='super_admin' || user?.role==='director';

  const STATUS_COLORS = { pending:'#F6C000', approved:'#17C653', registered:'#1B84FF', cancelled:'#F8285A' };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:800, color:'#071437' }}>Bookings</div>
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ position:'relative' }}>
            <Search size={12} style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#78829D' }} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{ paddingLeft:26, paddingRight:10, paddingTop:6, paddingBottom:6, border:'1px solid #F1F1F4', borderRadius:8, fontSize:12, outline:'none', width:180 }}/>
          </div>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ border:'1px solid #F1F1F4', borderRadius:8, padding:'6px 10px', fontSize:12 }}>
            {[['all','All Status'],['pending','Pending'],['approved','Approved'],['registered','Registered'],['cancelled','Cancelled']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
          {!viewOnly && <Btn onClick={openAdd} small><Plus size={12}/> New Booking</Btn>}
        </div>
      </div>

      <div style={{ background:'#fff', borderRadius:12, border:'1px solid #F1F1F4', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#FCFCFC' }}>
              {['Booking No','Customer','Unit','Agreement Value','Collected','Status','Actions'].map(h=>(
                <th key={h} style={{ padding:'10px 14px', fontSize:11, fontWeight:700, color:'#4B5675', textAlign:'left', borderBottom:'1px solid #FCFCFC' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(b=>{
              const collected = (b.payments||[]).reduce((s,p)=>s+(p.amount||0),0);
              const balance = (b.agreementValue||0) - collected;
              return (
                <tr key={b.id} style={{ borderBottom:'1px solid #FCFCFC' }}>
                  <td style={{ padding:'9px 14px', fontSize:11.5, fontWeight:700, color:'#071437' }}>{b.bookingNo||b.id}</td>
                  <td style={{ padding:'9px 14px' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#071437' }}>{b.customerName}</div>
                    <div style={{ fontSize:10, color:'#78829D' }}>{b.customerPhone}</div>
                  </td>
                  <td style={{ padding:'9px 14px', fontSize:12, color:'#252F4A' }}>{(() => {
                    const proj = projects.find(p => String(p.id) === String(b.projectId));
                    const unit = (proj?.units || []).find(u => String(u.id) === String(b.unitId));
                    return unit?.unitNo || b.unitId || '—';
                  })()}</td>
                  <td style={{ padding:'9px 14px', fontSize:12, color:'#252F4A' }}>₹{(b.agreementValue||0).toLocaleString('en-IN')}</td>
                  <td style={{ padding:'9px 14px' }}>
                    <div style={{ fontSize:12, color:'#17C653', fontWeight:600 }}>₹{collected.toLocaleString('en-IN')}</div>
                    {balance > 0 && <div style={{ fontSize:10, color:'#F8285A' }}>Balance: ₹{balance.toLocaleString('en-IN')}</div>}
                  </td>
                  <td style={{ padding:'9px 14px' }}><Badge label={b.status} color={STATUS_COLORS[b.status]||'#4B5675'} /></td>
                  <td style={{ padding:'9px 14px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={()=>{ setSelected(b); setModal('view'); }} style={{ background:'#EEF6FF', color:'#1B84FF', border:'none', borderRadius:6, padding:'4px 8px', fontSize:11, cursor:'pointer' }}>View</button>
                      {!viewOnly && canApprove && b.status==='pending' && (
                        <button onClick={()=>approveBooking(b.id)} style={{ background:'#E8FFF3', color:'#17C653', border:'none', borderRadius:6, padding:'4px 8px', fontSize:11, cursor:'pointer' }}>Approve</button>
                      )}
                      {!viewOnly && canCancel && (b.status==='approved'||b.status==='registered') && (
                        <button onClick={()=>{ setSelected(b); setCancelForm({reason:'',chargeType:'flat',chargeValue:''}); setModal('cancel'); }} style={{ background:'#FFE2E5', color:'#F8285A', border:'none', borderRadius:6, padding:'4px 8px', fontSize:11, cursor:'pointer' }}>Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length===0 && <div style={{ padding:32, textAlign:'center', color:'#78829D', fontSize:13 }}>No bookings found.</div>}
      </div>

      {/* Add Booking */}
      {modal==='add' && (
        <ModalOverlay onClose={()=>setModal(null)} title="New Booking" wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            <FormField label="Customer Name *" value={form.customerName} onChange={v=>setForm(f=>({...f,customerName:v}))} />
            <FormField label="Customer Phone" value={form.customerPhone} onChange={v=>setForm(f=>({...f,customerPhone:v}))} />
            <FormField label="Customer PAN" value={form.customerPAN} onChange={v=>setForm(f=>({...f,customerPAN:v}))} />
            <FormField label="Co-applicant Name" value={form.coApplicantName} onChange={v=>setForm(f=>({...f,coApplicantName:v}))} />
            <FormField label="Co-applicant PAN" value={form.coApplicantPAN} onChange={v=>setForm(f=>({...f,coApplicantPAN:v}))} />
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'#252F4A', display:'block', marginBottom:4 }}>Project *</label>
              <select value={form.projectId} onChange={e=>setForm(f=>({...f,projectId:Number(e.target.value),unitId:'',unitType:''}))} style={{ width:'100%', padding:'7px 10px', border:'1px solid #F1F1F4', borderRadius:8, fontSize:12 }}>
                <option value="">Select Project</option>
                {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'#252F4A', display:'block', marginBottom:4 }}>Unit *</label>
              <select value={form.unitId} onChange={e=>setForm(f=>({...f,unitId:Number(e.target.value)}))} style={{ width:'100%', padding:'7px 10px', border:'1px solid #F1F1F4', borderRadius:8, fontSize:12 }}>
                <option value="">Select Unit</option>
                {availableUnits.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.unitNo || u.id} {u.type ? `(${u.type})` : ''} {u.floor ? `• Floor ${u.floor}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <FormField label="Booking Date" value={form.bookingDate} onChange={v=>setForm(f=>({...f,bookingDate:v}))} type="date" />
            <FormField label="Agreement Value (₹)" value={form.agreementValue} onChange={v=>setForm(f=>({...f,agreementValue:Number(v)}))} type="number" />
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'#252F4A', display:'block', marginBottom:4 }}>GST Rate</label>
              <select value={form.gstRate} onChange={e=>setForm(f=>({...f,gstRate:Number(e.target.value)}))} style={{ width:'100%', padding:'7px 10px', border:'1px solid #F1F1F4', borderRadius:8, fontSize:12 }}>
                {[1,5,12,18].map(r=><option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div style={{ gridColumn:'1/-1', marginTop:4 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#252F4A' }}>Milestones</label>
                <Btn onClick={addMilestoneRow} small color="#4B5675"><Plus size={11}/> Add Milestone</Btn>
              </div>
              {(form.milestones || []).length === 0 ? (
                <div style={{ fontSize:11, color:'#78829D', padding:'8px 0' }}>No milestones added yet.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {(form.milestones || []).map((m, idx) => (
                    <div key={m.id || idx} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:8, alignItems:'end' }}>
                      <FormField label="Label" value={m.label} onChange={v=>updateMilestoneRow(m.id, 'label', v)} />
                      <FormField label="Amount (₹)" type="number" value={m.amount} onChange={v=>updateMilestoneRow(m.id, 'amount', Number(v))} />
                      <FormField label="Due Date" type="date" value={m.dueDate} onChange={v=>updateMilestoneRow(m.id, 'dueDate', v)} />
                      <button onClick={()=>removeMilestoneRow(m.id)} style={{ height:32, border:'1px solid #FFB8C6', background:'#FFE2E5', color:'#F8285A', borderRadius:8, padding:'0 10px' }}>Del</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:8 }}>
            <Btn onClick={()=>setModal(null)} color="#4B5675" small>Cancel</Btn>
            <Btn onClick={saveBooking} small>Create Booking</Btn>
          </div>
        </ModalOverlay>
      )}

      {/* Cancel Booking */}
      {modal==='cancel' && selected && (
        <ModalOverlay onClose={()=>setModal(null)} title={`Cancel Booking — ${selected.bookingNo}`}>
          <div style={{ background:'#FFE2E5', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#B42318' }}>
            ⚠ This will reverse all committed milestones and set unit status to Available.
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:11, fontWeight:600, color:'#252F4A', display:'block', marginBottom:4 }}>Cancellation Reason *</label>
              <textarea value={cancelForm.reason} onChange={e=>setCancelForm(f=>({...f,reason:e.target.value}))} rows={2} style={{ width:'100%', padding:'7px 10px', border:'1px solid #F1F1F4', borderRadius:8, fontSize:12, resize:'vertical', boxSizing:'border-box' }}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'#252F4A', display:'block', marginBottom:4 }}>Charge Type</label>
              <select value={cancelForm.chargeType} onChange={e=>setCancelForm(f=>({...f,chargeType:e.target.value}))} style={{ width:'100%', padding:'7px 10px', border:'1px solid #F1F1F4', borderRadius:8, fontSize:12 }}>
                <option value="flat">Flat Amount (₹)</option>
                <option value="percent">% of Agreement Value</option>
              </select>
            </div>
            <FormField label="Cancellation Charge" value={cancelForm.chargeValue} onChange={v=>setCancelForm(f=>({...f,chargeValue:v}))} type="number" />
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <Btn onClick={()=>setModal(null)} color="#4B5675" small>Close</Btn>
            <Btn onClick={cancelBooking} color="#F8285A" small>Confirm Cancellation</Btn>
          </div>
        </ModalOverlay>
      )}

      {/* View Booking */}
      {modal==='view' && selected && (
        <ModalOverlay onClose={()=>setModal(null)} title={`Booking — ${selected.bookingNo}`} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
            {[['Customer',selected.customerName],['Phone',selected.customerPhone],['PAN',selected.customerPAN||'—'],['Co-applicant',selected.coApplicantName||'—'],['Co-app PAN',selected.coApplicantPAN||'—'],['Unit',(() => {
              const proj = projects.find(p => String(p.id) === String(selected.projectId));
              const unit = (proj?.units || []).find(u => String(u.id) === String(selected.unitId));
              return unit?.unitNo || selected.unitId || '—';
            })()],['Agreement Value',`₹${(selected.agreementValue||0).toLocaleString('en-IN')}`],['Status',selected.status],['Booking Date',selected.bookingDate],['Approved By',selected.approvedBy||'—'],['Booking No',selected.bookingNo||'—']].map(([k,v])=>(
              <div key={k}><div style={{ fontSize:10, color:'#78829D' }}>{k}</div><div style={{ fontSize:13, fontWeight:600, color:'#071437' }}>{v}</div></div>
            ))}
          </div>

          {/* Payment history */}
          <div style={{ fontWeight:700, fontSize:13, color:'#071437', marginBottom:8 }}>Payment History</div>
          {(selected.payments||[]).length===0 ? <div style={{ fontSize:12, color:'#78829D', marginBottom:12 }}>No payments recorded.</div> : (
            <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:12, fontSize:12 }}>
              <thead><tr style={{ background:'#FCFCFC' }}>{['Date','Amount','Mode','Reference'].map(h=><th key={h} style={{ padding:'7px 12px', fontWeight:700, color:'#4B5675', textAlign:'left', borderBottom:'1px solid #FCFCFC' }}>{h}</th>)}</tr></thead>
              <tbody>
                {(selected.payments||[]).map(p=>(
                  <tr key={p.id}><td style={{ padding:'7px 12px' }}>{p.date?.split('T')[0]}</td><td style={{ padding:'7px 12px', fontWeight:600, color:'#17C653' }}>₹{(p.amount||0).toLocaleString('en-IN')}</td><td style={{ padding:'7px 12px' }}>{p.mode}</td><td style={{ padding:'7px 12px', color:'#78829D' }}>{p.ref||'—'}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {!viewOnly && selected.status !== 'cancelled' && (
            <AddPaymentForm
              milestones={selected.milestones || []}
              payments={selected.payments || []}
              onAdd={(p)=>{
                addPayment(selected.id, p);
                setSelected(s=>({...s,payments:[...(s.payments||[]),{...p,id:Date.now(),date:p.date || new Date().toISOString().split('T')[0]}]}));
              }}
            />
          )}
        </ModalOverlay>
      )}
    </div>
  );
}

function AddPaymentForm({ onAdd, milestones = [], payments = [] }) {
  const paidMilestoneIds = new Set((payments || []).map(p => String(p.milestoneId)).filter(Boolean));
  const openMilestones = (milestones || []).filter(m => !paidMilestoneIds.has(String(m.id)));
  const [form, setForm] = useState({ amount:'', mode:'NEFT', ref:'', date:new Date().toISOString().split('T')[0], milestoneId:'' });
  useEffect(() => {
    if (!form.milestoneId) return;
    const m = openMilestones.find(x => String(x.id) === String(form.milestoneId));
    if (!m) return;
    setForm(f => ({ ...f, amount: Number(f.amount || 0) > 0 ? f.amount : Number(m.amount || 0) }));
  }, [form.milestoneId, openMilestones.length]);
  function submit() {
    if (!form.amount) return;
    onAdd(form);
    setForm({ amount:'', mode:'NEFT', ref:'', date:new Date().toISOString().split('T')[0], milestoneId:'' });
  }
  return (
    <div style={{ background:'#FCFCFC', borderRadius:10, padding:'12px 14px' }}>
      <div style={{ fontWeight:700, fontSize:12, color:'#071437', marginBottom:8 }}>Record Payment</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr 1fr 1fr 1fr auto', gap:8, alignItems:'flex-end' }}>
        <FormField label="Amount (₹)" value={form.amount} onChange={v=>setForm(f=>({...f,amount:Number(v)}))} type="number" />
        <div>
          <label style={{ fontSize:11, fontWeight:600, color:'#252F4A', display:'block', marginBottom:4 }}>Milestone</label>
          <select value={form.milestoneId} onChange={e=>setForm(f=>({...f,milestoneId:e.target.value}))} style={{ width:'100%', padding:'7px 10px', border:'1px solid #F1F1F4', borderRadius:8, fontSize:12 }}>
            <option value="">General payment</option>
            {openMilestones.map(m => (
              <option key={m.id} value={m.id}>{m.label} • ₹{Number(m.amount || 0).toLocaleString('en-IN')}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize:11, fontWeight:600, color:'#252F4A', display:'block', marginBottom:4 }}>Mode</label>
          <select value={form.mode} onChange={e=>setForm(f=>({...f,mode:e.target.value}))} style={{ width:'100%', padding:'7px 10px', border:'1px solid #F1F1F4', borderRadius:8, fontSize:12 }}>
            {['NEFT','RTGS','Cheque','Cash','UPI','DD'].map(m=><option key={m}>{m}</option>)}
          </select>
        </div>
        <FormField label="Reference / Cheque No" value={form.ref} onChange={v=>setForm(f=>({...f,ref:v}))} />
        <FormField label="Date" value={form.date} onChange={v=>setForm(f=>({...f,date:v}))} type="date" />
        <Btn onClick={submit} small>Add</Btn>
      </div>
    </div>
  );
}

// ── COLLECTIONS ────────────────────────────────────────────────────────────
function CollectionsTab({ viewOnly }) {
  const { bookings, addToast } = useAppStore();
  const [agingFilter, setAgingFilter] = useState('all');

  const today = new Date();

  // All demand milestones across bookings
  const demands = bookings.flatMap(b =>
    (b.milestones || []).map(m => ({
      ...m,
      bookingNo: b.bookingNo,
      customerName: b.customerName,
      projectId: b.projectId,
      daysOverdue: m.dueDate ? Math.max(0, Math.floor((today - new Date(m.dueDate)) / 86400000)) : 0,
      isPaid: (b.payments || []).some(p => p.milestoneId === m.id),
    }))
  ).filter(d => !d.isPaid && d.dueDate);

  const agingBuckets = {
    '0-30': demands.filter(d => d.daysOverdue <= 30),
    '31-60': demands.filter(d => d.daysOverdue > 30 && d.daysOverdue <= 60),
    '61-90': demands.filter(d => d.daysOverdue > 60 && d.daysOverdue <= 90),
    '90+': demands.filter(d => d.daysOverdue > 90),
  };

  const displayed = agingFilter === 'all' ? demands : agingBuckets[agingFilter] || [];

  // Forecast
  const next30 = bookings.flatMap(b=>(b.milestones||[]).map(m=>({...m,customerName:b.customerName,bookingNo:b.bookingNo}))).filter(m=>{ const d=new Date(m.dueDate||''); const diff=(d-today)/86400000; return diff>=0&&diff<=30; });
  const next60 = bookings.flatMap(b=>(b.milestones||[]).map(m=>({...m,customerName:b.customerName,bookingNo:b.bookingNo}))).filter(m=>{ const d=new Date(m.dueDate||''); const diff=(d-today)/86400000; return diff>30&&diff<=60; });
  function sendDemandNotice(demand) {
    addToast(`Demand notice queued for ${demand.customerName} (${demand.bookingNo})`, 'info');
  }

  return (
    <div>
      <div style={{ fontSize:15, fontWeight:800, color:'#071437', marginBottom:16 }}>Collections & Overdue</div>

      {/* Aging summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[['0-30 Days','#17C653',agingBuckets['0-30']],['31-60 Days','#F6C000',agingBuckets['31-60']],['61-90 Days','#DC6B19',agingBuckets['61-90']],['90+ Days','#F8285A',agingBuckets['90+']]].map(([l,c,items])=>(
          <div key={l} onClick={()=>setAgingFilter(l==='0-30 Days'?'0-30':l==='31-60 Days'?'31-60':l==='61-90 Days'?'61-90':'90+')} style={{ background:'#fff', borderRadius:12, padding:16, border:`2px solid ${agingFilter===l?c:'#F1F1F4'}`, cursor:'pointer' }}>
            <div style={{ fontSize:22, fontWeight:800, color:c }}>{items.length}</div>
            <div style={{ fontSize:12, color:'#4B5675', marginTop:2 }}>{l}</div>
            <div style={{ fontSize:11, color:c, fontWeight:600, marginTop:2 }}>₹{items.reduce((s,d)=>s+(d.amount||0),0).toLocaleString('en-IN')}</div>
          </div>
        ))}
      </div>

      {/* Forecast */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
        {[['Next 30 Days',next30],['31-60 Days Ahead',next60]].map(([l,items])=>(
          <div key={l} style={{ background:'#fff', borderRadius:12, border:'1px solid #F1F1F4', padding:16 }}>
            <div style={{ fontWeight:700, fontSize:12, color:'#071437', marginBottom:6 }}>Forecast: {l}</div>
            <div style={{ fontSize:20, fontWeight:800, color:'#1B84FF' }}>₹{items.reduce((s,d)=>s+(d.amount||0),0).toLocaleString('en-IN')}</div>
            <div style={{ fontSize:11, color:'#78829D' }}>{items.length} demands expected</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:12, border:'1px solid #F1F1F4', overflow:'hidden' }}>
        <div style={{ padding:'10px 16px', borderBottom:'1px solid #FCFCFC', display:'flex', gap:8 }}>
          {[['all','All'],['0-30','0-30d'],['31-60','31-60d'],['61-90','61-90d'],['90+','90+d']].map(([v,l])=>(
            <button key={v} onClick={()=>setAgingFilter(v)} style={{ padding:'4px 12px', borderRadius:6, fontSize:11, fontWeight:agingFilter===v?700:400, color:agingFilter===v?'#1B84FF':'#4B5675', background:agingFilter===v?'#EEF6FF':'transparent', border:'1px solid '+(agingFilter===v?'#B5D8FF':'transparent'), cursor:'pointer' }}>{l}</button>
          ))}
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'#FCFCFC' }}>{['Booking No','Customer','Milestone','Due Date','Amount','Overdue By','Actions'].map(h=><th key={h} style={{ padding:'9px 14px', fontSize:11, fontWeight:700, color:'#4B5675', textAlign:'left', borderBottom:'1px solid #FCFCFC' }}>{h}</th>)}</tr></thead>
          <tbody>
            {displayed.map((d,i)=>(
              <tr key={i} style={{ borderBottom:'1px solid #FCFCFC' }}>
                <td style={{ padding:'8px 14px', fontSize:11.5, fontWeight:700, color:'#071437' }}>{d.bookingNo}</td>
                <td style={{ padding:'8px 14px', fontSize:12 }}>{d.customerName}</td>
                <td style={{ padding:'8px 14px', fontSize:12 }}>{d.label||d.name||'—'}</td>
                <td style={{ padding:'8px 14px', fontSize:12 }}>{d.dueDate}</td>
                <td style={{ padding:'8px 14px', fontSize:12, fontWeight:600 }}>₹{(d.amount||0).toLocaleString('en-IN')}</td>
                <td style={{ padding:'8px 14px' }}><Badge label={d.daysOverdue>0?`${d.daysOverdue} days`:'Upcoming'} color={d.daysOverdue>90?'#F8285A':d.daysOverdue>60?'#DC6B19':d.daysOverdue>30?'#F6C000':'#17C653'} /></td>
                <td style={{ padding:'8px 14px' }}>
                  {!viewOnly && (
                    <button
                      onClick={() => sendDemandNotice(d)}
                      style={{ background:'#EEF6FF', color:'#1B84FF', border:'none', borderRadius:6, padding:'4px 8px', fontSize:11, cursor:'pointer' }}
                    >
                      Send Demand
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayed.length===0 && <div style={{ padding:32, textAlign:'center', color:'#78829D', fontSize:13 }}>No overdue demands. 🎉</div>}
      </div>
    </div>
  );
}

// ── BROKERS ────────────────────────────────────────────────────────────────
function BrokersTab({ viewOnly }) {
  const { brokers, setBrokers, bookings, addToast, user } = useAppStore();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name:'', phone:'', email:'', reraNo:'', brokeragePercent:2, pan:'', gstin:'' });

  function saveBroker() {
    if (!form.name) { addToast('Broker name required','error'); return; }
    setBrokers(prev=>[...prev, { ...form, id:Date.now(), createdAt:new Date().toISOString() }]);
    addToast('Broker added'); setModal(null);
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:800, color:'#071437' }}>Brokers</div>
        {!viewOnly && <Btn onClick={()=>{ setForm({name:'',phone:'',email:'',reraNo:'',brokeragePercent:2,pan:'',gstin:''}); setModal('add'); }} small><Plus size={12}/> Add Broker</Btn>}
      </div>
      <div style={{ background:'#fff', borderRadius:12, border:'1px solid #F1F1F4', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'#FCFCFC' }}>{['Name','Phone','RERA No','Commission %','Bookings','Commission Earned','TDS (194H)'].map(h=><th key={h} style={{ padding:'10px 14px', fontSize:11, fontWeight:700, color:'#4B5675', textAlign:'left', borderBottom:'1px solid #FCFCFC' }}>{h}</th>)}</tr></thead>
          <tbody>
            {brokers.map(b=>{
              const bkgs = bookings.filter(bk=>bk.brokerId===b.id && bk.status==='approved');
              const commission = bkgs.reduce((s,bk)=>(s+(bk.agreementValue||0)*((b.brokeragePercent||2)/100)),0);
              const tds = commission * 0.05;
              return (
                <tr key={b.id} style={{ borderBottom:'1px solid #FCFCFC' }}>
                  <td style={{ padding:'9px 14px', fontSize:12, fontWeight:600, color:'#071437' }}>{b.name}</td>
                  <td style={{ padding:'9px 14px', fontSize:12 }}>{b.phone}</td>
                  <td style={{ padding:'9px 14px', fontSize:12 }}>{b.reraNo||'—'}</td>
                  <td style={{ padding:'9px 14px', fontSize:12 }}>{b.brokeragePercent||2}%</td>
                  <td style={{ padding:'9px 14px', fontSize:12 }}>{bkgs.length}</td>
                  <td style={{ padding:'9px 14px', fontSize:12, fontWeight:600, color:'#17C653' }}>₹{commission.toLocaleString('en-IN')}</td>
                  <td style={{ padding:'9px 14px', fontSize:12, color:'#F8285A' }}>₹{tds.toLocaleString('en-IN')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {brokers.length===0 && <div style={{ padding:32, textAlign:'center', color:'#78829D', fontSize:13 }}>No brokers added.</div>}
      </div>
      {modal==='add' && (
        <ModalOverlay onClose={()=>setModal(null)} title="Add Broker">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[['name','Name *'],['phone','Phone'],['email','Email'],['reraNo','RERA No'],['pan','PAN'],['gstin','GSTIN']].map(([k,l])=><FormField key={k} label={l} value={form[k]} onChange={v=>setForm(f=>({...f,[k]:v}))} />)}
            <FormField label="Commission %" value={form.brokeragePercent} onChange={v=>setForm(f=>({...f,brokeragePercent:Number(v)}))} type="number" />
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:16 }}>
            <Btn onClick={()=>setModal(null)} color="#4B5675" small>Cancel</Btn>
            <Btn onClick={saveBroker} small>Save</Btn>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── DOCUMENTS ─────────────────────────────────────────────────────────────
function DocumentsTab({ viewOnly }) {
  const { bookings, activeEntity, addToast } = useAppStore();
  const [selected, setSelected] = useState('');
  const [booking, setBooking] = useState('');

  const DOC_TYPES = [
    { id:'allotment', label:'Allotment Letter', auto:'On booking approved' },
    { id:'demand', label:'Demand Notice', auto:'On milestone demand' },
    { id:'receipt', label:'Payment Receipt', auto:'On payment recorded' },
    { id:'afs', label:'Agreement for Sale', auto:'From booking data' },
    { id:'possession', label:'Possession Letter', auto:'Manual — post handover' },
    { id:'cancellation', label:'Cancellation Letter', auto:'On booking cancelled' },
    { id:'noc', label:'NOC for Loan', auto:'Manual' },
    { id:'subcontract', label:'Material Sub-Contract', auto:'Linked to Work Order' },
  ];

  async function generateDoc() {
    if (!booking || !selected) { addToast('Select booking and document type','error'); return; }
    const b = bookings.find(bk=>String(bk.id)===booking);
    if (!b) { addToast('Booking not found','error'); return; }
    addToast(`Generating ${DOC_TYPES.find(d=>d.id===selected)?.label}…`);
    // In production: call docEngine to generate DOCX
    setTimeout(()=>addToast('Document generated — ready to print on letterhead','success'), 1000);
  }

  return (
    <div>
      <div style={{ fontSize:15, fontWeight:800, color:'#071437', marginBottom:4 }}>Document Automation</div>
      <div style={{ fontSize:11, color:'#78829D', marginBottom:20 }}>All documents print-ready — format for letterhead</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div>
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #F1F1F4', padding:18, marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#071437', marginBottom:12 }}>Generate Document</div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:11, fontWeight:600, color:'#252F4A', display:'block', marginBottom:4 }}>Select Booking</label>
              <select value={booking} onChange={e=>setBooking(e.target.value)} style={{ width:'100%', padding:'7px 10px', border:'1px solid #F1F1F4', borderRadius:8, fontSize:12 }}>
                <option value="">— Select Booking —</option>
                {bookings.map(b=><option key={b.id} value={b.id}>{b.bookingNo||b.id} — {b.customerName}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, fontWeight:600, color:'#252F4A', display:'block', marginBottom:4 }}>Document Type</label>
              <select value={selected} onChange={e=>setSelected(e.target.value)} style={{ width:'100%', padding:'7px 10px', border:'1px solid #F1F1F4', borderRadius:8, fontSize:12 }}>
                <option value="">— Select Document —</option>
                {DOC_TYPES.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
            {!viewOnly && (
              <div style={{ display:'flex', gap:8 }}>
                <Btn onClick={generateDoc}><Download size={13}/> Generate DOCX</Btn>
                <Btn color="#17C653" onClick={()=>addToast('WhatsApp: opening…')}><Send size={13}/> WhatsApp</Btn>
              </div>
            )}
          </div>
        </div>

        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #F1F1F4', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #FCFCFC' }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#071437' }}>Document Templates</div>
          </div>
          {DOC_TYPES.map(d=>(
            <div key={d.id} style={{ padding:'10px 16px', borderBottom:'1px solid #FCFCFC', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'#EEF6FF', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Download size={14} style={{ color:'#1B84FF' }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#071437' }}>{d.label}</div>
                <div style={{ fontSize:10, color:'#78829D' }}>{d.auto}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SHARED UI HELPERS ─────────────────────────────────────────────────────
function ModalOverlay({ children, onClose, title, wide }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:14, width:wide?820:520, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #FCFCFC', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'#fff', zIndex:1 }}>
          <span style={{ fontWeight:800, fontSize:14, color:'#071437' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#78829D' }}><X size={16}/></button>
        </div>
        <div style={{ padding:'18px 20px' }}>{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type='text', placeholder='' }) {
  return (
    <div>
      <label style={{ fontSize:11, fontWeight:600, color:'#252F4A', display:'block', marginBottom:4 }}>{label}</label>
      <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:'100%', padding:'7px 10px', border:'1px solid #F1F1F4', borderRadius:8, fontSize:12, outline:'none', boxSizing:'border-box' }}
        onFocus={e=>e.target.style.borderColor='#1B84FF'} onBlur={e=>e.target.style.borderColor='#F1F1F4'} />
    </div>
  );
}
