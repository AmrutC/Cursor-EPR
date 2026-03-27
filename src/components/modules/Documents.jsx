import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { fmtDate } from '../../utils';
import { FileText, Download, Mail, MessageSquare, CheckCircle2, Clock } from 'lucide-react';

const DOC_TYPES = [
  { code:'BKG', label:'Booking Acknowledgement', desc:'Sent on booking amount receipt. Confirms flat number, amount, and date.', icon:'📋', format:'Word' },
  { code:'ALT', label:'Allotment Letter',         desc:'Issued after agreement execution. Full flat details and payment schedule.', icon:'📄', format:'Word' },
  { code:'DMD', label:'Demand Notice',            desc:'Milestone-wise payment demand. Shows base amount, GST, total due, due date.', icon:'📬', format:'PDF' },
  { code:'RCP', label:'Payment Receipt',          desc:'Issued on each payment. Shows base amount, GST breakdown, amount in words.', icon:'🧾', format:'PDF' },
  { code:'AGR', label:'Sale Agreement Draft',     desc:'Full agreement draft with all allottee details and payment schedule.', icon:'📝', format:'Word' },
  { code:'POS', label:'Possession Letter',        desc:'Physical handover confirmation with possession date.', icon:'🔑', format:'Word' },
  { code:'NOC', label:'No Dues Certificate',      desc:'Confirms nil balance. Generated only when all milestones are Paid.', icon:'✅', format:'Word' },
  { code:'CXL', label:'Cancellation Letter',      desc:'Issued after Director approval. Triggers unit status reset.', icon:'❌', format:'Word' },
];

const DEMO_ALLOTTEES = [];
const DEMO_LOG = [];
const DOC_TYPE_COLORS = {
  BKG:{bg:'#E1F0FF',text:'var(--c-primary)'}, ALT:{bg:'#E4FFF8',text:'var(--c-teal)'},
  DMD:{bg:'var(--c-warning-light)',text:'var(--t-secondary)'}, RCP:{bg:'var(--c-success-light)',text:'var(--c-success)'},
  AGR:{bg:'#F1E8FF',text:'var(--c-info)'}, POS:{bg:'#E1F0FF',text:'var(--c-primary)'},
  NOC:{bg:'var(--c-success-light)',text:'var(--c-success)'}, CXL:{bg:'var(--c-danger-light)',text:'#7F1D1D'},
};

export default function Documents() {
  const { addToast } = useAppStore();
  const [tab, setTab] = useState('generate');
  const [genModal, setGenModal] = useState(null);
  const [selAllottee, setSelAllottee] = useState('');
  const [log, setLog] = useState(DEMO_LOG);

  function generate(docType) {
    if (!selAllottee) { alert('Please select an allottee first.'); return; }
    const allottee = DEMO_ALLOTTEES.find(a=>a.booking_no===selAllottee);
    const docNo = `${docType.code}/VEH/26-27/${String(log.length+1).padStart(3,'0')}`;
    setLog(l=>[{id:Date.now(),doc_no:docNo,type:docType.code,allottee:allottee.allottee,flat:allottee.flat,date:new Date().toISOString().slice(0,10),emailed:false,shared:false},...l]);
    addToast(`${docType.label} generated: ${docNo}`,'success');
    setGenModal(null);
  }

  const sel = { width:'100%', border:'1px solid var(--border-md)', borderRadius:8, padding:'7px 10px', fontSize:13, color:'var(--t-primary)', background:'#fff', outline:'none', fontFamily:'Inter,system-ui,sans-serif', cursor:'pointer' };

  return (
    <div>
      {/* Tabs */}
      <div style={{display:'flex',gap:3,background:'var(--bg-subtle)',borderRadius:10,padding:3,marginBottom:16,width:'fit-content'}}>
        {[['generate','Generate Documents'],['log','Document Log']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:'6px 20px',borderRadius:7,fontSize:12.5,fontWeight:tab===id?700:500,color:tab===id?'var(--c-dark)':'var(--t-secondary)',background:tab===id?'#fff':'transparent',cursor:'pointer',boxShadow:tab===id?'0 1px 3px rgba(0,0,0,0.1)':'',border:'none'}}>
            {label}
          </button>
        ))}
      </div>

      {tab==='generate'&&(<>
        {/* Allottee selector */}
        <div style={{background:'#EAF0F8',border:'1px solid #C5D5E8',borderRadius:12,padding:'14px 18px',marginBottom:18,display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
          <div style={{fontSize:12.5,fontWeight:700,color:'var(--c-dark)',flexShrink:0}}>Select Allottee:</div>
          <select style={{...sel,width:320}} value={selAllottee} onChange={e=>setSelAllottee(e.target.value)}>
            <option value="">— Choose allottee & flat —</option>
            {DEMO_ALLOTTEES.map(a=><option key={a.booking_no} value={a.booking_no}>{a.flat} — {a.allottee} ({a.project})</option>)}
          </select>
          {selAllottee&&(
            <div style={{fontSize:12,color:'var(--c-primary)',fontWeight:600}}>
              {DEMO_ALLOTTEES.find(a=>a.booking_no===selAllottee)?.status} · {selAllottee}
            </div>
          )}
        </div>

        {/* Document type grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {DOC_TYPES.map(d=>{
            const c=DOC_TYPE_COLORS[d.code]||{bg:'var(--bg-subtle)',text:'var(--t-primary)'};
            return(
              <div key={d.code} style={{background:'#fff',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.04)',display:'flex',flexDirection:'column'}}>
                {/* Header */}
                <div style={{background:c.bg,padding:'14px 16px',borderBottom:`1px solid ${c.bg}`}}>
                  <div style={{fontSize:20,marginBottom:6}}>{d.icon}</div>
                  <div style={{fontSize:10,fontWeight:800,color:c.text,textTransform:'uppercase',letterSpacing:'0.6px'}}>{d.code}</div>
                  <div style={{fontSize:13,fontWeight:700,color:c.text,marginTop:2,lineHeight:1.3}}>{d.label}</div>
                </div>
                {/* Body */}
                <div style={{padding:'12px 16px',flex:1,display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{fontSize:11.5,color:'var(--t-secondary)',lineHeight:1.5,flex:1}}>{d.desc}</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:10,fontWeight:700,color:'var(--t-secondary)',background:'var(--bg-subtle)',padding:'2px 8px',borderRadius:10}}>{d.format}</span>
                    <button onClick={()=>setGenModal(d)}
                      style={{background:c.bg,border:`1px solid ${c.text}30`,borderRadius:8,padding:'5px 12px',cursor:'pointer',fontSize:11.5,fontWeight:700,color:c.text,display:'flex',alignItems:'center',gap:5}}>
                      <FileText size={11}/> Generate
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>)}

      {tab==='log'&&(
        <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
          <div style={{padding:'13px 18px',borderBottom:'1px solid var(--bg-subtle)',fontSize:12,fontWeight:700,color:'var(--c-dark)',textTransform:'uppercase',letterSpacing:'0.5px'}}>
            Document Generation Log
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'var(--bg-subtle)',borderBottom:'2px solid var(--border)'}}>
              {['Document No.','Type','Allottee','Flat','Generated On','Emailed','WhatsApp','Actions'].map(h=>(
                <th key={h} style={{padding:'9px 14px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--t-secondary)',textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {log.map((l,i)=>{
                const c=DOC_TYPE_COLORS[l.type]||{bg:'var(--bg-subtle)',text:'var(--t-primary)'};
                return(
                  <tr key={l.id} style={{borderBottom:'1px solid var(--bg-subtle)',background:i%2===0?'#fff':'#FAFAFA'}}>
                    <td style={{padding:'9px 14px',fontSize:12,fontFamily:'monospace',fontWeight:700,color:'var(--c-dark)'}}>{l.doc_no}</td>
                    <td style={{padding:'9px 14px'}}>
                      <span style={{background:c.bg,color:c.text,fontSize:10.5,fontWeight:700,padding:'2px 8px',borderRadius:12}}>{l.type}</span>
                    </td>
                    <td style={{padding:'9px 14px',fontSize:13,fontWeight:600,color:'var(--t-primary)'}}>{l.allottee}</td>
                    <td style={{padding:'9px 14px',fontSize:13,fontWeight:700,color:'var(--c-primary)'}}>{l.flat}</td>
                    <td style={{padding:'9px 14px',fontSize:12.5,color:'var(--t-primary)'}}>{fmtDate(l.date)}</td>
                    <td style={{padding:'9px 14px',textAlign:'center'}}>
                      {l.emailed?<CheckCircle2 size={14} style={{color:'var(--c-success)'}}/>:<span style={{color:'var(--t-muted)',fontSize:11}}>—</span>}
                    </td>
                    <td style={{padding:'9px 14px',textAlign:'center'}}>
                      {l.shared?<CheckCircle2 size={14} style={{color:'var(--c-success)'}}/>:<span style={{color:'var(--t-muted)',fontSize:11}}>—</span>}
                    </td>
                    <td style={{padding:'9px 14px'}}>
                      <div style={{display:'flex',gap:5}}>
                        <button style={{background:'var(--bg-subtle)',border:'1px solid var(--border)',borderRadius:6,padding:'3px 9px',cursor:'pointer',fontSize:10.5,fontWeight:600,color:'var(--t-primary)',display:'flex',alignItems:'center',gap:4}}>
                          <Download size={10}/> PDF
                        </button>
                        <button onClick={()=>addToast('Email sent to allottee.','success')} style={{background:'#E1F0FF',border:'1px solid #B5D8FF',borderRadius:6,padding:'3px 9px',cursor:'pointer',fontSize:10.5,fontWeight:600,color:'var(--c-primary)',display:'flex',alignItems:'center',gap:4}}>
                          <Mail size={10}/> Email
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate confirm modal */}
      {genModal&&(
        <Modal open={!!genModal} onClose={()=>setGenModal(null)} title={`Generate ${genModal.label}`}
          footer={<>
            <button onClick={()=>setGenModal(null)} className="btn-secondary" style={{fontSize:13}}>Cancel</button>
            <button onClick={()=>generate(genModal)} className="btn-primary" style={{fontSize:13}}>Generate Document</button>
          </>}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{background:'#EAF0F8',borderRadius:10,padding:'12px 14px'}}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--c-dark)',marginBottom:4}}>Generating: {genModal.code} — {genModal.label}</div>
              <div style={{fontSize:12,color:'var(--t-secondary)'}}>{genModal.desc}</div>
              <div style={{fontSize:11.5,color:'var(--t-secondary)',marginTop:4}}>Format: {genModal.format}</div>
            </div>
            {selAllottee?(
              <div style={{background:'var(--bg-subtle)',borderRadius:10,padding:'12px 14px'}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--t-secondary)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>For Allottee</div>
                {(() => { const a=DEMO_ALLOTTEES.find(x=>x.booking_no===selAllottee);
                  return <div><div style={{fontSize:14,fontWeight:700,color:'var(--c-dark)'}}>{a?.allottee}</div><div style={{fontSize:12,color:'var(--t-secondary)',marginTop:2}}>{a?.flat} · {a?.project} · {selAllottee}</div></div>;
                })()}
              </div>
            ):(
              <div style={{background:'var(--c-warning-light)',border:'1px solid var(--c-warning)',borderRadius:10,padding:'12px 14px',fontSize:12.5,fontWeight:600,color:'var(--t-secondary)'}}>
                ⚠ No allottee selected. Go back and select an allottee first.
              </div>
            )}
            <div style={{fontSize:12,color:'var(--t-secondary)',lineHeight:1.6}}>
              The document will be saved to <strong style={{fontFamily:'monospace',color:'var(--c-dark)'}}>OneDrive/documents/{genModal.code}/</strong> and recorded in the Document Log.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
