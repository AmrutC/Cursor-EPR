import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { inr, fmtDate } from '../../utils';
import { Download, Plus, Eye, Edit2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

const inp  = { width:'100%', border:'1px solid #DBDFE9', borderRadius:8, padding:'7px 10px', fontSize:13, color:'#252F4A', background:'#fff', outline:'none', fontFamily:'Inter,system-ui,sans-serif', boxSizing:'border-box' };
const inpE = { ...inp, border:'1px solid #F8285A', background:'#FFF5F8' };
const sel  = { ...inp, cursor:'pointer' };
const F = ({ label, required, error, children, span }) => (
  <div style={{ gridColumn:span?`span ${span}`:undefined }}>
    <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#4B5675', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>
      {label}{required&&<span style={{ color:'#F8285A', marginLeft:2 }}>*</span>}
    </label>
    {children}
    {error&&<div style={{ fontSize:11, color:'#F8285A', marginTop:3 }}>{error}</div>}
  </div>
);

const GST_RATES = [0,0.1,0.25,1,1.5,3,5,6,7.5,12,18,28];
const STATE_CODES = ['01-J&K','02-Himachal Pradesh','03-Punjab','04-Chandigarh','05-Uttarakhand','06-Haryana','07-Delhi','08-Rajasthan','09-Uttar Pradesh','10-Bihar','18-Assam','19-West Bengal','21-Odisha','22-Chhattisgarh','23-Madhya Pradesh','24-Gujarat','27-Maharashtra','29-Karnataka','30-Goa','32-Kerala','33-Tamil Nadu','36-Telangana'];
const SUPPLY_TYPES = ['CGST+SGST (Intra-state)','IGST (Inter-state)'];
const ITC_BLOCKED = ['Motor Vehicle','Food & Beverages','Construction / Works Contract','Personal Use','Insurance / Health','Travel Benefits'];
const RCM_SERVICES = ['GTA Freight','Legal Services','Security Services','Import of Service','Director Fees','Other'];

function fyString() {
  const y=new Date().getFullYear(), m=new Date().getMonth();
  const s=m>=3?y:y-1; return `${String(s).slice(2)}-${String(s+1).slice(2)}`;
}
function calcGST(taxable, rate, supplyType) {
  const total = Math.round(Number(taxable||0)*Number(rate||0)/100);
  const isIGST = (supplyType||'').includes('IGST');
  return { igst:isIGST?total:0, cgst:isIGST?0:Math.round(total/2), sgst:isIGST?0:Math.round(total/2), total };
}
function exportCSV(rows, filename) {
  if(!rows.length){alert('No data to export.');return;}
  const hdr=Object.keys(rows[0]);
  const csv=[hdr,...rows.map(r=>hdr.map(k=>`"${String(r[k]??'').replace(/"/g,'""')}"`))] .map(r=>r.join(',')).join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=filename; a.click();
}
let idCtr = Date.now();
const nextId = () => ++idCtr;

function Modal({ open, onClose, title, width=640, children, footer }) {
  if(!open) return null;
  return (
    <div style={{ position:'fixed',inset:0,zIndex:60,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.45)' }} onClick={onClose}/>
      <div style={{ position:'relative',background:'#fff',borderRadius:16,width:'100%',maxWidth:width,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding:'13px 20px',borderBottom:'1px solid #F1F1F4',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0 }}>
          <div style={{ fontSize:14,fontWeight:800,color:'#071437' }}>{title}</div>
          <button onClick={onClose} style={{ background:'#FCFCFC',border:'none',borderRadius:7,width:26,height:26,cursor:'pointer',color:'#4B5675',display:'flex',alignItems:'center',justifyContent:'center' }}><X size={13}/></button>
        </div>
        <div style={{ flex:1,overflowY:'auto',padding:'16px 20px' }}>{children}</div>
        {footer&&<div style={{ padding:'12px 20px',borderTop:'1px solid #F1F1F4',display:'flex',gap:8,justifyContent:'flex-end',flexShrink:0 }}>{footer}</div>}
      </div>
    </div>
  );
}
function EmptyState({ msg }) {
  return <div style={{ padding:'40px 20px',textAlign:'center',color:'#78829D',fontSize:13 }}>{msg}</div>;
}
function Badge({ v, green, amber, red }) {
  const bg = green?'#E8FFF3':amber?'#FFF8DD':red?'#FFE2E5':'#FCFCFC';
  const c  = green?'#17C653':amber?'#7A4E00':red?'#7F1D1D':'#252F4A';
  return <span style={{ background:bg,color:c,fontSize:10.5,fontWeight:700,padding:'2px 8px',borderRadius:10 }}>{v}</span>;
}

function SimpleTable({ rows, cols, getRow, onEdit, onDelete, onView }) {
  if(!rows.length) return <EmptyState msg="No entries. Click Add to begin."/>;
  const btnStyle = (bg,c) => ({ background:bg,border:'none',borderRadius:5,padding:'3px 7px',cursor:'pointer',color:c,display:'flex',alignItems:'center',justifyContent:'center' });
  return (
    <div style={{ background:'#fff',border:'1px solid #F1F1F4',borderRadius:14,overflow:'auto',boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
      <table style={{ width:'100%',borderCollapse:'collapse',minWidth:500 }}>
        <thead><tr style={{ background:'#FCFCFC',borderBottom:'2px solid #F1F1F4' }}>
          {[...cols,''].map(h=><th key={h} style={{ padding:'8px 12px',textAlign:'left',fontSize:9.5,fontWeight:700,color:'#4B5675',textTransform:'uppercase',letterSpacing:'0.4px',whiteSpace:'nowrap' }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.map((r,i)=>{
            const cells=getRow(r);
            return (
              <tr key={r.id||i} style={{ borderBottom:'1px solid #FCFCFC',background:i%2===0?'#fff':'#FAFAFA' }}>
                {cells.map((c,ci)=><td key={ci} style={{ padding:'8px 12px',fontSize:12,color:'#252F4A',whiteSpace:'nowrap',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis' }}>{c}</td>)}
                <td style={{ padding:'8px 10px',whiteSpace:'nowrap' }}>
                  <div style={{ display:'flex',gap:4 }}>
                    <button onClick={()=>onView(r)} style={btnStyle('#EAF0F8','#071437')}><Eye size={11}/></button>
                    <button onClick={()=>onEdit(r.id)} style={btnStyle('#FFF8DD','#7A4E00')}><Edit2 size={11}/></button>
                    <button onClick={()=>onDelete(r.id)} style={btnStyle('#FFE2E5','#7F1D1D')}><X size={11}/></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GSTTable({ autoRows, manualRows, onEdit, onDelete, onView }) {
  const cols = ['Date','Invoice No.','Party Name','Party GSTIN','Description','Taxable ₹','GST%','CGST ₹','SGST ₹','IGST ₹','Total ₹','Source'];
  const allRows = [...autoRows.map(r=>({...r,_s:'auto'})),...manualRows.map(r=>({...r,_s:'manual'}))];
  if(!allRows.length) return <EmptyState msg="No entries yet."/>;
  const money = v => typeof v==='number'?inr(v):v||'—';
  const btnStyle = (bg,c) => ({ background:bg,border:'none',borderRadius:5,padding:'3px 7px',cursor:'pointer',color:c,display:'flex',alignItems:'center',justifyContent:'center' });
  return (
    <div style={{ background:'#fff',border:'1px solid #F1F1F4',borderRadius:14,overflow:'auto',boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
      <table style={{ width:'100%',borderCollapse:'collapse',minWidth:1000 }}>
        <thead><tr style={{ background:'#FCFCFC',borderBottom:'2px solid #F1F1F4' }}>
          {[...cols,''].map(h=><th key={h} style={{ padding:'8px 10px',textAlign:['Taxable ₹','CGST ₹','SGST ₹','IGST ₹','Total ₹'].includes(h)?'right':'left',fontSize:9,fontWeight:700,color:'#4B5675',textTransform:'uppercase',letterSpacing:'0.4px',whiteSpace:'nowrap' }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {allRows.map((r,i)=>(
            <tr key={r.id||i} style={{ borderBottom:'1px solid #FCFCFC',background:r._s==='auto'?(i%2===0?'#FAFAFA':'#F5F8FC'):(i%2===0?'#fff':'#FFF8DD') }}>
              <td style={{ padding:'7px 10px',fontSize:11.5,color:'#252F4A',whiteSpace:'nowrap' }}>{r.date||r.invoice_date||'—'}</td>
              <td style={{ padding:'7px 10px',fontSize:11,fontFamily:'monospace',color:'#071437',whiteSpace:'nowrap' }}>{r.invoice_no||r['Receipt No.']||'—'}</td>
              <td style={{ padding:'7px 10px',fontSize:12,fontWeight:600,color:'#071437',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{r.party_name||r.customer_name||r['Customer Name']||'—'}</td>
              <td style={{ padding:'7px 10px',fontSize:11,fontFamily:'monospace',color:'#252F4A',whiteSpace:'nowrap' }}>{r.party_gstin||r.customer_gstin||r['Customer GSTIN']||'—'}</td>
              <td style={{ padding:'7px 10px',fontSize:11.5,color:'#252F4A',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{r.description||r.Description||'—'}</td>
              <td style={{ padding:'7px 10px',fontSize:12,fontFamily:'monospace',textAlign:'right',color:'#252F4A' }}>{money(r.taxable_value||r['Taxable Value'])}</td>
              <td style={{ padding:'7px 10px',fontSize:11.5,textAlign:'right',color:'#7A4E00',fontWeight:600 }}>{r.gst_rate||r['GST Rate']||'—'}{typeof(r.gst_rate||r['GST Rate'])==='number'?'%':''}</td>
              <td style={{ padding:'7px 10px',fontSize:12,fontFamily:'monospace',textAlign:'right',color:'#252F4A' }}>{money(r.cgst||r['CGST'])}</td>
              <td style={{ padding:'7px 10px',fontSize:12,fontFamily:'monospace',textAlign:'right',color:'#252F4A' }}>{money(r.sgst||r['SGST'])}</td>
              <td style={{ padding:'7px 10px',fontSize:12,fontFamily:'monospace',textAlign:'right',color:'#252F4A' }}>{money(r.igst||r['IGST'])}</td>
              <td style={{ padding:'7px 10px',fontSize:12.5,fontFamily:'monospace',textAlign:'right',fontWeight:800,color:'#071437' }}>{money(r.total_value||r['Total Value']||r['Total Received'])}</td>
              <td style={{ padding:'7px 10px' }}>
                {r._s==='auto'
                  ? <span style={{ fontSize:9,background:'#FCFCFC',color:'#78829D',padding:'2px 6px',borderRadius:4,fontWeight:600 }}>AUTO</span>
                  : <Badge v="Manual" amber/>
                }
              </td>
              <td style={{ padding:'7px 8px',whiteSpace:'nowrap' }}>
                <div style={{ display:'flex',gap:3 }}>
                  <button onClick={()=>onView(r)} style={btnStyle('#EAF0F8','#071437')}><Eye size={10}/></button>
                  {r._s==='manual'&&<>
                    <button onClick={()=>onEdit(r.id)} style={btnStyle('#FFF8DD','#7A4E00')}><Edit2 size={10}/></button>
                    <button onClick={()=>onDelete(r.id)} style={btnStyle('#FFE2E5','#7F1D1D')}><X size={10}/></button>
                  </>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GST() {
  const { activeEntity, bookings, vendors, gstData, setGstData } = useAppStore();
  const eid = activeEntity?.id;
  const safe = gstData || {};
  const salesInvoices      = safe.salesInvoices      || [];
  const purchaseInvoices   = safe.purchaseInvoices   || [];
  const creditNotesIssued  = safe.creditNotesIssued  || [];
  const creditNotesReceived= safe.creditNotesReceived|| [];
  const rcmTransactions    = safe.rcmTransactions    || [];
  const advancesReceived   = safe.advancesReceived   || [];
  const gstChallans        = safe.gstChallans        || [];
  const ewayBills          = safe.ewayBills          || [];

  function upd(section, fn) { setGstData(d=>({ ...d, [section]: typeof fn==='function'?fn(d[section]||[]):fn })); }

  const [tab, setTab]               = useState('gstr1');
  const [filterMonth, setFilterMonth] = useState('');
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState({});
  const [editId, setEditId]         = useState(null);
  const [viewItem, setViewItem]     = useState(null);
  const [errors, setErrors]         = useState({});
  const set = k => e => { setForm(f=>({...f,[k]:e.target.value})); setErrors(er=>({...er,[k]:''})); };

  const entityBookings = (bookings||[]).filter(b=>b.entity_id===eid&&b.approval_status==='Approved');
  const entityVendors  = (vendors||[]).filter(v=>v.entity_id===eid);

  // Auto GSTR-1 from payments
  const gstr1Auto = useMemo(()=>entityBookings.flatMap(b=>
    (b.milestones||[]).flatMap(m=>
      (m.payments||[]).filter(p=>Number(p.amount)>0).map(p=>{
        const gstRate=Number(b.gst_rate||5);
        const gstAmt=Math.round(Number(p.amount)*gstRate/(100+gstRate));
        const taxable=Number(p.amount)-gstAmt;
        return {
          id:'auto-'+p.receipt_no, date:p.date||'', invoice_no:p.receipt_no||'—',
          party_name:b.allottees?.[0]?.name||b.allottee||'',
          party_gstin:b.allottees?.[0]?.gstin||'Unregistered (B2C)',
          description:`Unit ${b.unit_no||b.flat||''} — ${m.name}`,
          hsn_sac:'9972', taxable_value:taxable, gst_rate:gstRate,
          cgst:Math.round(gstAmt/2), sgst:Math.round(gstAmt/2), igst:0, total_value:Number(p.amount),
          place_of_supply:'27-Maharashtra', source:'Auto',
        };
      })
    )
  ).filter(r=>!filterMonth||r.date.startsWith(filterMonth)),[entityBookings,filterMonth]);

  // Auto ITC from vendor bills
  const itcAuto = useMemo(()=>entityVendors.flatMap(v=>
    (v.bills||[]).filter(b=>b.gst_applicable&&b.gst_total>0).map(b=>({
      id:'auto-'+b.id, date:b.invoice_date||'', invoice_no:b.invoice_no||'',
      party_name:v.name, party_gstin:v.gstin||'',
      description:b.description||'', hsn_sac:b.hsn||'',
      taxable_value:b.taxable_value||0, gst_rate:b.gst_rate||18,
      cgst:b.cgst||0, sgst:b.sgst||0, igst:b.igst||0,
      total_value:b.total_bill||0, itc_eligible:'Yes',
      in_2b:b.in_2b||'Not Checked', payment_made:b.status==='Paid'?'Yes':'No',
    }))
  ),[entityVendors]);

  // Monthly liability
  const monthlyMap = useMemo(()=>{
    const map={};
    [...gstr1Auto,...salesInvoices].forEach(r=>{
      const ym=(r.date||'').slice(0,7); if(!ym)return;
      if(!map[ym])map[ym]={igst:0,cgst:0,sgst:0};
      map[ym].igst+=Number(r.igst||0);
      map[ym].cgst+=Number(r.cgst||0);
      map[ym].sgst+=Number(r.sgst||0);
    });
    return map;
  },[gstr1Auto,salesInvoices]);

  const totalOutput = Object.values(monthlyMap).reduce((s,r)=>s+r.igst+r.cgst+r.sgst,0);
  const totalITC    = [...itcAuto,...purchaseInvoices].reduce((s,r)=>s+Number(r.cgst||0)+Number(r.sgst||0)+Number(r.igst||0),0);
  const netPayable  = Math.max(0,totalOutput-totalITC);
  const formGST     = useMemo(()=>calcGST(form.taxable_value,form.gst_rate,form.supply_type),[form.taxable_value,form.gst_rate,form.supply_type]);

  function openAdd(section, defaults={}) {
    setForm({supply_type:'CGST+SGST (Intra-state)',gst_rate:5,itc_eligible:'Yes',payment_made:'No',in_2b:'Not Checked',...defaults});
    setEditId(null); setErrors({}); setModal(section);
  }
  function openEdit(section, item) { setForm({...item}); setEditId(item.id); setErrors({}); setModal(section); }
  function save(section, req=[]) {
    const errs={};
    req.forEach(k=>{ if(!String(form[k]||'').trim()) errs[k]='Required'; });
    if(Object.keys(errs).length){setErrors(errs);return;}
    const g=calcGST(form.taxable_value,form.gst_rate,form.supply_type);
    const item={...form,id:editId||nextId(),igst:form.igst??g.igst,cgst:form.cgst??g.cgst,sgst:form.sgst??g.sgst,total_value:Number(form.taxable_value||0)+g.total};
    if(editId) upd(section,arr=>arr.map(x=>x.id===editId?item:x));
    else upd(section,arr=>[item,...arr]);
    setModal(null); setForm({});
  }
  function del(section,id) { if(!confirm('Delete?'))return; upd(section,arr=>arr.filter(x=>x.id!==id)); }

  const P = { background:'#071437',color:'#fff',border:'none',borderRadius:8,padding:'7px 16px',cursor:'pointer',fontSize:12.5,fontWeight:700,display:'flex',alignItems:'center',gap:6 };
  const S = { background:'#FCFCFC',color:'#252F4A',border:'1px solid #F1F1F4',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:12.5,fontWeight:600,display:'flex',alignItems:'center',gap:6 };

  const TABS = [
    {id:'gstr1',label:'GSTR-1',sub:'Outward Sales'},
    {id:'gstr3b',label:'GSTR-3B',sub:'Monthly Summary'},
    {id:'purchase',label:'Purchase / ITC',sub:'Inward & ITC'},
    {id:'credit',label:'Credit Notes',sub:'Issued & Received'},
    {id:'rcm',label:'RCM',sub:'Reverse Charge'},
    {id:'advance',label:'Advances',sub:'Receipts'},
    {id:'challan',label:'GST Payments',sub:'PMT-06'},
    {id:'ewb',label:'E-Way Bills',sub:'EWB Register'},
  ];

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:14 }}>

      {/* KPIs */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:10 }}>
        {[
          ['Output GST',inr(totalOutput,true),'#FFF8DD','#F6C000','#7A4E00'],
          ['ITC Available',inr(totalITC,true),'#E8FFF3','#50CD89','#17C653'],
          ['Net Payable',inr(netPayable,true),'#FFE2E5','#FFB8C6','#7F1D1D'],
          ['Sales Invoices',String(gstr1Auto.length+salesInvoices.length),'#EAF0F8','#C5D5E8','#071437'],
          ['Purchase Invoices',String(itcAuto.length+purchaseInvoices.length),'#F1E8FF','#D4B9FF','#7239EA'],
          ['Challans Paid',String(gstChallans.length),'#E8FFF3','#50CD89','#17C653'],
        ].map(([l,v,bg,bdr,c])=>(
          <div key={l} style={{ background:bg,border:`1px solid ${bdr}`,borderRadius:12,padding:'12px 14px' }}>
            <div style={{ fontSize:9.5,fontWeight:700,color:c,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:18,fontWeight:800,color:c,fontFamily:'monospace' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex',gap:2,background:'#FCFCFC',borderRadius:12,padding:4,overflowX:'auto',flexShrink:0 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flexShrink:0,padding:'7px 14px',borderRadius:9,fontSize:11.5,fontWeight:tab===t.id?700:500,
            color:tab===t.id?'#071437':'#4B5675',background:tab===t.id?'#fff':'transparent',
            cursor:'pointer',border:tab===t.id?'1px solid #F1F1F4':'1px solid transparent',
            boxShadow:tab===t.id?'0 1px 3px rgba(0,0,0,0.07)':'',
          }}>
            <div>{t.label}</div>
            <div style={{ fontSize:9,color:'#78829D',marginTop:1 }}>{t.sub}</div>
          </button>
        ))}
      </div>

      {/* ── GSTR-1 ── */}
      {tab==='gstr1'&&(
        <div>
          <div style={{ display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center' }}>
            <div style={{ fontSize:12,color:'#4B5675',flex:1 }}>Auto-populated from Payments. Add manual invoices for direct/service sales.</div>
            <input style={{ ...sel,width:140 }} type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}/>
            <button style={S} onClick={()=>exportCSV([...gstr1Auto,...salesInvoices].map(r=>({'Date':r.date,'Invoice No':r.invoice_no,'Party':r.party_name,'GSTIN':r.party_gstin||'','Description':r.description||'','HSN':r.hsn_sac||'','Taxable':r.taxable_value||0,'GST%':r.gst_rate||0,'CGST':r.cgst||0,'SGST':r.sgst||0,'IGST':r.igst||0,'Total':r.total_value||0})),`GSTR1_${fyString()}.csv`)}><Download size={12}/>Export GSTR-1</button>
            <button style={P} onClick={()=>openAdd('salesInvoices',{invoice_date:new Date().toISOString().slice(0,10)})}><Plus size={12}/>Add Invoice</button>
          </div>
          <GSTTable autoRows={gstr1Auto} manualRows={salesInvoices}
            onEdit={id=>{const item=salesInvoices.find(x=>x.id===id);if(item)openEdit('salesInvoices',item);}}
            onDelete={id=>del('salesInvoices',id)} onView={setViewItem}/>
        </div>
      )}

      {/* ── GSTR-3B ── */}
      {tab==='gstr3b'&&(
        <div>
          <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:12,gap:8 }}>
            <button style={S} onClick={()=>exportCSV(Object.entries(monthlyMap).map(([ym,v])=>({Month:ym,IGST:v.igst,CGST:v.cgst,SGST:v.sgst,'Total Output':v.igst+v.cgst+v.sgst,'ITC Available':totalITC,'Net Payable':Math.max(0,v.igst+v.cgst+v.sgst-totalITC)})),`GSTR3B_${fyString()}.csv`)}><Download size={12}/>Export GSTR-3B</button>
          </div>
          {/* 3.1 Output */}
          <div style={{ background:'#fff',border:'1px solid #F1F1F4',borderRadius:14,overflow:'hidden',marginBottom:14 }}>
            <div style={{ background:'#071437',padding:'10px 16px' }}>
              <span style={{ fontSize:12,fontWeight:700,color:'#F6C000' }}>3.1 — Outward Taxable Supplies (Output Tax)</span>
            </div>
            {Object.keys(monthlyMap).length===0?<EmptyState msg="No output GST. Record payments in Payments module."/>:(
              <table style={{ width:'100%',borderCollapse:'collapse' }}>
                <thead><tr style={{ background:'#FCFCFC',borderBottom:'2px solid #F1F1F4' }}>
                  {['Month','IGST','CGST','SGST','Total Output Tax','Challan Paid','Net Payable'].map(h=>(
                    <th key={h} style={{ padding:'9px 14px',textAlign:h==='Month'?'left':'right',fontSize:10,fontWeight:700,color:'#4B5675',textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {Object.entries(monthlyMap).sort((a,b)=>b[0].localeCompare(a[0])).map(([ym,v],i)=>{
                    const paid=gstChallans.filter(c=>c.month===ym).reduce((s,c)=>s+Number(c.total_paid||0),0);
                    const net=Math.max(0,v.igst+v.cgst+v.sgst-paid);
                    return (
                      <tr key={ym} style={{ borderBottom:'1px solid #FCFCFC',background:i%2===0?'#fff':'#FAFAFA' }}>
                        <td style={{ padding:'9px 14px',fontSize:13,fontWeight:700,color:'#071437' }}>{ym}</td>
                        <td style={{ padding:'9px 14px',fontSize:12,fontFamily:'monospace',textAlign:'right' }}>{inr(v.igst)}</td>
                        <td style={{ padding:'9px 14px',fontSize:12,fontFamily:'monospace',textAlign:'right' }}>{inr(v.cgst)}</td>
                        <td style={{ padding:'9px 14px',fontSize:12,fontFamily:'monospace',textAlign:'right' }}>{inr(v.sgst)}</td>
                        <td style={{ padding:'9px 14px',fontSize:13,fontWeight:800,fontFamily:'monospace',textAlign:'right',color:'#7A4E00' }}>{inr(v.igst+v.cgst+v.sgst)}</td>
                        <td style={{ padding:'9px 14px',fontSize:12,fontFamily:'monospace',textAlign:'right',color:'#17C653' }}>{inr(paid)}</td>
                        <td style={{ padding:'9px 14px',fontSize:13,fontWeight:800,fontFamily:'monospace',textAlign:'right',color:net>0?'#F8285A':'#17C653' }}>{net>0?inr(net):'NIL'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {/* 4 ITC */}
          <div style={{ background:'#fff',border:'1px solid #F1F1F4',borderRadius:14,overflow:'hidden' }}>
            <div style={{ background:'#17C653',padding:'10px 16px' }}>
              <span style={{ fontSize:12,fontWeight:700,color:'#fff' }}>4 — ITC Summary (Input Tax Credit)</span>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,padding:'16px' }}>
              {[['Total Output GST',inr(totalOutput),'#FFF8DD','#7A4E00'],['ITC Available',inr(totalITC),'#E8FFF3','#17C653'],['Net Cash Payable',inr(netPayable),'#FFE2E5','#F8285A']].map(([l,v,bg,c])=>(
                <div key={l} style={{ background:bg,borderRadius:10,padding:'12px 14px' }}>
                  <div style={{ fontSize:9.5,fontWeight:700,color:c,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4 }}>{l}</div>
                  <div style={{ fontSize:18,fontWeight:800,color:c,fontFamily:'monospace' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PURCHASE / ITC ── */}
      {tab==='purchase'&&(
        <div>
          <div style={{ display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center' }}>
            <div style={{ fontSize:12,color:'#4B5675',flex:1 }}>Auto from Vendor Bills. Add direct purchases manually.</div>
            <button style={S} onClick={()=>exportCSV([...itcAuto,...purchaseInvoices].map(r=>({'Date':r.date,'Invoice No':r.invoice_no,'Supplier':r.party_name,'GSTIN':r.party_gstin||'','Description':r.description||'','Taxable':r.taxable_value||0,'CGST':r.cgst||0,'SGST':r.sgst||0,'IGST':r.igst||0,'Total':r.total_value||0,'ITC Eligible':r.itc_eligible||'Yes','In 2B':r.in_2b||'','Payment Made':r.payment_made||''})),`Purchase_Register_${fyString()}.csv`)}><Download size={12}/>Export Purchase Register</button>
            <button style={P} onClick={()=>openAdd('purchaseInvoices',{invoice_date:new Date().toISOString().slice(0,10),itc_eligible:'Yes',payment_made:'No',in_2b:'Not Checked'})}><Plus size={12}/>Add Purchase Invoice</button>
          </div>
          <GSTTable autoRows={itcAuto} manualRows={purchaseInvoices}
            onEdit={id=>{const item=purchaseInvoices.find(x=>x.id===id);if(item)openEdit('purchaseInvoices',item);}}
            onDelete={id=>del('purchaseInvoices',id)} onView={setViewItem}/>
        </div>
      )}

      {/* ── CREDIT NOTES ── */}
      {tab==='credit'&&(
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
          <div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
              <div style={{ fontSize:12,fontWeight:700,color:'#071437' }}>Issued ({creditNotesIssued.length})</div>
              <div style={{ display:'flex',gap:6 }}>
                <button style={S} onClick={()=>exportCSV(creditNotesIssued,`CN_Issued_${fyString()}.csv`)}><Download size={11}/></button>
                <button style={P} onClick={()=>openAdd('creditNotesIssued',{date:new Date().toISOString().slice(0,10)})}><Plus size={11}/>Add</button>
              </div>
            </div>
            <SimpleTable rows={creditNotesIssued}
              cols={['Date','CN No.','Customer','Reason','Taxable ₹','GST ₹']}
              getRow={r=>[fmtDate(r.date),r.cn_no||'—',r.party_name||r.customer_name||'—',r.reason||'—',inr(r.taxable_value||0),inr((r.cgst||0)+(r.sgst||0)+(r.igst||0))]}
              onEdit={id=>{const item=creditNotesIssued.find(x=>x.id===id);if(item)openEdit('creditNotesIssued',item);}}
              onDelete={id=>del('creditNotesIssued',id)} onView={setViewItem}/>
          </div>
          <div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
              <div style={{ fontSize:12,fontWeight:700,color:'#071437' }}>Received ({creditNotesReceived.length})</div>
              <div style={{ display:'flex',gap:6 }}>
                <button style={S} onClick={()=>exportCSV(creditNotesReceived,`CN_Received_${fyString()}.csv`)}><Download size={11}/></button>
                <button style={P} onClick={()=>openAdd('creditNotesReceived',{date:new Date().toISOString().slice(0,10)})}><Plus size={11}/>Add</button>
              </div>
            </div>
            <SimpleTable rows={creditNotesReceived}
              cols={['Date','CN No.','Supplier','Orig Invoice','Amount ₹','ITC Reversed ₹']}
              getRow={r=>[fmtDate(r.date),r.cn_no||'—',r.party_name||r.supplier_name||'—',r.original_inv_no||'—',inr(r.amount||0),inr((r.cgst||0)+(r.sgst||0)+(r.igst||0))]}
              onEdit={id=>{const item=creditNotesReceived.find(x=>x.id===id);if(item)openEdit('creditNotesReceived',item);}}
              onDelete={id=>del('creditNotesReceived',id)} onView={setViewItem}/>
          </div>
        </div>
      )}

      {/* ── RCM ── */}
      {tab==='rcm'&&(
        <div>
          <div style={{ background:'#FFF8DD',border:'1px solid #F6C000',borderRadius:10,padding:'10px 14px',marginBottom:12,fontSize:12,color:'#7A4E00' }}>
            <strong>Reverse Charge Mechanism:</strong> GST self-assessed and paid by you (recipient). Applicable on GTA freight, legal, security, director fees, import of services. Both payable AND ITC claimable if eligible.
          </div>
          <div style={{ display:'flex',justifyContent:'flex-end',gap:8,marginBottom:12 }}>
            <button style={S} onClick={()=>exportCSV(rcmTransactions,`RCM_${fyString()}.csv`)}><Download size={12}/>Export RCM</button>
            <button style={P} onClick={()=>openAdd('rcmTransactions',{date:new Date().toISOString().slice(0,10),service_type:'GTA Freight'})}><Plus size={12}/>Add RCM Entry</button>
          </div>
          <SimpleTable rows={rcmTransactions}
            cols={['Date','Supplier','Service Type','Taxable ₹','GST%','IGST ₹','CGST ₹','SGST ₹','Challan Ref']}
            getRow={r=>[fmtDate(r.date),r.party_name||r.supplier_name||'—',r.service_type||'—',inr(r.taxable_value||0),(r.gst_rate||0)+'%',inr(r.igst||0),inr(r.cgst||0),inr(r.sgst||0),r.challan_ref||'—']}
            onEdit={id=>{const item=rcmTransactions.find(x=>x.id===id);if(item)openEdit('rcmTransactions',item);}}
            onDelete={id=>del('rcmTransactions',id)} onView={setViewItem}/>
        </div>
      )}

      {/* ── ADVANCES ── */}
      {tab==='advance'&&(
        <div>
          <div style={{ background:'#EAF0F8',border:'1px solid #C5D5E8',borderRadius:10,padding:'10px 14px',marginBottom:12,fontSize:12,color:'#1B84FF' }}>
            GST is payable on advances received. Track receipt vouchers here and adjust against final invoice.
          </div>
          <div style={{ display:'flex',justifyContent:'flex-end',gap:8,marginBottom:12 }}>
            <button style={S} onClick={()=>exportCSV(advancesReceived,`Advances_${fyString()}.csv`)}><Download size={12}/>Export</button>
            <button style={P} onClick={()=>openAdd('advancesReceived',{date:new Date().toISOString().slice(0,10)})}><Plus size={12}/>Add Advance</button>
          </div>
          <SimpleTable rows={advancesReceived}
            cols={['Date','Voucher No.','Customer','GSTIN','Advance ₹','GST%','GST ₹','Status']}
            getRow={r=>[fmtDate(r.date),r.voucher_no||'—',r.party_name||r.customer_name||'—',r.party_gstin||'—',inr(r.advance_amount||0),(r.gst_rate||0)+'%',inr((r.cgst||0)+(r.sgst||0)+(r.igst||0)),r.status||'Pending']}
            onEdit={id=>{const item=advancesReceived.find(x=>x.id===id);if(item)openEdit('advancesReceived',item);}}
            onDelete={id=>del('advancesReceived',id)} onView={setViewItem}/>
        </div>
      )}

      {/* ── CHALLANS ── */}
      {tab==='challan'&&(
        <div>
          <div style={{ display:'flex',justifyContent:'flex-end',gap:8,marginBottom:12 }}>
            <button style={S} onClick={()=>exportCSV(gstChallans,`GST_Challans_${fyString()}.csv`)}><Download size={12}/>Export Challans</button>
            <button style={P} onClick={()=>openAdd('gstChallans',{date:new Date().toISOString().slice(0,10),payment_mode:'Net Banking',month:new Date().toISOString().slice(0,7)})}><Plus size={12}/>Add Challan (PMT-06)</button>
          </div>
          <SimpleTable rows={gstChallans}
            cols={['Payment Date','Challan No.','For Month','IGST ₹','CGST ₹','SGST ₹','Total Paid ₹','Mode','Bank Ref']}
            getRow={r=>[fmtDate(r.date),r.challan_no||'—',r.month||'—',inr(r.igst||0),inr(r.cgst||0),inr(r.sgst||0),inr(r.total_paid||0),r.payment_mode||'—',r.bank_ref||'—']}
            onEdit={id=>{const item=gstChallans.find(x=>x.id===id);if(item)openEdit('gstChallans',item);}}
            onDelete={id=>del('gstChallans',id)} onView={setViewItem}/>
          {gstChallans.length>0&&(
            <div style={{ background:'#071437',borderRadius:10,padding:'10px 16px',marginTop:10,display:'flex',gap:24,flexWrap:'wrap' }}>
              {[['Total IGST Paid',gstChallans.reduce((s,c)=>s+(c.igst||0),0),'#F1F1F4'],['Total CGST Paid',gstChallans.reduce((s,c)=>s+(c.cgst||0),0),'#F1F1F4'],['Total SGST Paid',gstChallans.reduce((s,c)=>s+(c.sgst||0),0),'#F1F1F4'],['Grand Total Paid',gstChallans.reduce((s,c)=>s+(c.total_paid||0),0),'#F6C000']].map(([l,v,c])=>(
                <div key={l}>
                  <div style={{ fontSize:9.5,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:2 }}>{l}</div>
                  <div style={{ fontSize:15,fontWeight:800,fontFamily:'monospace',color:c }}>{inr(v)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── E-WAY BILLS ── */}
      {tab==='ewb'&&(
        <div>
          <div style={{ display:'flex',justifyContent:'flex-end',gap:8,marginBottom:12 }}>
            <button style={S} onClick={()=>exportCSV(ewayBills,`EWayBills_${fyString()}.csv`)}><Download size={12}/>Export EWB</button>
            <button style={P} onClick={()=>openAdd('ewayBills',{gen_date:new Date().toISOString().slice(0,10)})}><Plus size={12}/>Add E-Way Bill</button>
          </div>
          <SimpleTable rows={ewayBills}
            cols={['EWB No.','Gen Date','Valid Until','From PIN','To PIN','Transporter','Vehicle','Goods','Total ₹','Invoice No.']}
            getRow={r=>[r.ewb_no||'—',fmtDate(r.gen_date),fmtDate(r.valid_until),r.from_pin||'—',r.to_pin||'—',r.transporter||'—',r.vehicle_no||'—',r.goods_desc||'—',inr(r.total_value||0),r.invoice_no||'—']}
            onEdit={id=>{const item=ewayBills.find(x=>x.id===id);if(item)openEdit('ewayBills',item);}}
            onDelete={id=>del('ewayBills',id)} onView={setViewItem}/>
        </div>
      )}

      {/* ════ MODALS ════ */}

      {/* Sales Invoice */}
      <Modal open={modal==='salesInvoices'} onClose={()=>setModal(null)} title={editId?'Edit Sales Invoice':'Add Sales Invoice'} width={720}
        footer={<><button onClick={()=>setModal(null)} style={S}>Cancel</button><button onClick={()=>save('salesInvoices',['invoice_no','invoice_date','party_name','taxable_value'])} style={P}>Save Invoice</button></>}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          <F label="Invoice No." required error={errors.invoice_no}><input style={errors.invoice_no?inpE:inp} value={form.invoice_no||''} onChange={set('invoice_no')} placeholder="INV-2026-001"/></F>
          <F label="Invoice Date" required error={errors.invoice_date}><input style={inp} type="date" value={form.invoice_date||''} onChange={set('invoice_date')}/></F>
          <F label="Party / Customer Name" required error={errors.party_name}><input style={errors.party_name?inpE:inp} value={form.party_name||''} onChange={set('party_name')}/></F>
          <F label="Customer GSTIN (blank=B2C)"><input style={inp} value={form.party_gstin||''} onChange={set('party_gstin')}/></F>
          <F label="Place of Supply"><select style={sel} value={form.place_of_supply||'27-Maharashtra'} onChange={set('place_of_supply')}>{STATE_CODES.map(s=><option key={s}>{s}</option>)}</select></F>
          <F label="Supply Type"><select style={sel} value={form.supply_type||'CGST+SGST (Intra-state)'} onChange={set('supply_type')}>{SUPPLY_TYPES.map(s=><option key={s}>{s}</option>)}</select></F>
          <F label="Description" span={2}><input style={inp} value={form.description||''} onChange={set('description')}/></F>
          <F label="HSN/SAC Code"><input style={inp} value={form.hsn_sac||''} onChange={set('hsn_sac')} placeholder="9972"/></F>
          <F label="Taxable Value (₹)" required error={errors.taxable_value}><input style={errors.taxable_value?inpE:inp} type="number" value={form.taxable_value||''} onChange={set('taxable_value')}/></F>
          <F label="GST Rate (%)"><select style={sel} value={form.gst_rate||5} onChange={set('gst_rate')}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</select></F>
          <div/>
          {Number(form.taxable_value)>0&&(
            <div style={{ gridColumn:'1/-1',background:'#E8FFF3',border:'1px solid #50CD89',borderRadius:10,padding:'10px 14px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10 }}>
              {[['IGST',formGST.igst],['CGST',formGST.cgst],['SGST',formGST.sgst],['Total GST',formGST.total]].map(([l,v])=>(
                <div key={l}><div style={{ fontSize:9.5,fontWeight:700,color:'#17C653',textTransform:'uppercase',marginBottom:2 }}>{l}</div><div style={{ fontSize:14,fontWeight:800,color:'#17C653',fontFamily:'monospace' }}>{inr(v)}</div></div>
              ))}
            </div>
          )}
          <F label="E-Invoice Generated?"><select style={sel} value={form.e_invoice||'No'} onChange={set('e_invoice')}><option>No</option><option>Yes</option></select></F>
          <F label="IRN Number"><input style={inp} value={form.irn||''} onChange={set('irn')} placeholder="64-char IRN if e-invoice"/></F>
          <F label="E-Way Bill No."><input style={inp} value={form.ewb_no||''} onChange={set('ewb_no')}/></F>
        </div>
      </Modal>

      {/* Purchase Invoice */}
      <Modal open={modal==='purchaseInvoices'} onClose={()=>setModal(null)} title={editId?'Edit Purchase Invoice':'Add Purchase Invoice'} width={720}
        footer={<><button onClick={()=>setModal(null)} style={S}>Cancel</button><button onClick={()=>save('purchaseInvoices',['invoice_no','invoice_date','party_name','taxable_value'])} style={P}>Save</button></>}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          <F label="Supplier Name" required error={errors.party_name}>
            <select style={sel} value={form.party_name||''} onChange={e=>{
              const v=entityVendors.find(x=>x.name===e.target.value);
              setForm(f=>({...f,party_name:e.target.value,party_gstin:v?.gstin||f.party_gstin}));
            }}>
              <option value="">— Select or enter —</option>
              {entityVendors.map(v=><option key={v.id}>{v.name}</option>)}
            </select>
          </F>
          <F label="Supplier GSTIN"><input style={inp} value={form.party_gstin||''} onChange={set('party_gstin')}/></F>
          <F label="Invoice No." required error={errors.invoice_no}><input style={errors.invoice_no?inpE:inp} value={form.invoice_no||''} onChange={set('invoice_no')}/></F>
          <F label="Invoice Date" required><input style={inp} type="date" value={form.invoice_date||''} onChange={set('invoice_date')}/></F>
          <F label="Description" span={2}><input style={inp} value={form.description||''} onChange={set('description')}/></F>
          <F label="HSN/SAC"><input style={inp} value={form.hsn_sac||''} onChange={set('hsn_sac')}/></F>
          <F label="Taxable Value (₹)" required error={errors.taxable_value}><input style={errors.taxable_value?inpE:inp} type="number" value={form.taxable_value||''} onChange={set('taxable_value')}/></F>
          <F label="Supply Type"><select style={sel} value={form.supply_type||'CGST+SGST (Intra-state)'} onChange={set('supply_type')}>{SUPPLY_TYPES.map(s=><option key={s}>{s}</option>)}</select></F>
          <F label="GST Rate (%)"><select style={sel} value={form.gst_rate||18} onChange={set('gst_rate')}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</select></F>
          {Number(form.taxable_value)>0&&(
            <div style={{ gridColumn:'1/-1',background:'#F1E8FF',border:'1px solid #D4B9FF',borderRadius:10,padding:'10px 14px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10 }}>
              {[['IGST',formGST.igst],['CGST',formGST.cgst],['SGST',formGST.sgst],['Total ITC',formGST.total]].map(([l,v])=>(
                <div key={l}><div style={{ fontSize:9.5,fontWeight:700,color:'#7239EA',textTransform:'uppercase',marginBottom:2 }}>{l}</div><div style={{ fontSize:14,fontWeight:800,color:'#7239EA',fontFamily:'monospace' }}>{inr(v)}</div></div>
              ))}
            </div>
          )}
          <F label="ITC Eligible?"><select style={sel} value={form.itc_eligible||'Yes'} onChange={set('itc_eligible')}><option>Yes</option><option>No — Blocked</option></select></F>
          {(form.itc_eligible||'').includes('No')&&<F label="Blocked Reason"><select style={sel} value={form.blocked_reason||''} onChange={set('blocked_reason')}><option value="">—</option>{ITC_BLOCKED.map(r=><option key={r}>{r}</option>)}</select></F>}
          <F label="Appears in GSTR-2B?"><select style={sel} value={form.in_2b||'Not Checked'} onChange={set('in_2b')}><option>Not Checked</option><option>Yes — Matched</option><option>No — Missing</option></select></F>
          <F label="Payment Made?"><select style={sel} value={form.payment_made||'No'} onChange={set('payment_made')}><option>No</option><option>Yes</option></select></F>
        </div>
      </Modal>

      {/* Credit Note Issued */}
      <Modal open={modal==='creditNotesIssued'} onClose={()=>setModal(null)} title={editId?'Edit Credit Note (Issued)':'Add Credit Note (Issued)'} width={640}
        footer={<><button onClick={()=>setModal(null)} style={S}>Cancel</button><button onClick={()=>save('creditNotesIssued',['cn_no','date','party_name','taxable_value'])} style={P}>Save</button></>}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          <F label="Credit Note No." required error={errors.cn_no}><input style={errors.cn_no?inpE:inp} value={form.cn_no||''} onChange={set('cn_no')} placeholder="CN-001"/></F>
          <F label="Date" required><input style={inp} type="date" value={form.date||''} onChange={set('date')}/></F>
          <F label="Original Invoice No."><input style={inp} value={form.original_inv_no||''} onChange={set('original_inv_no')}/></F>
          <F label="Original Invoice Date"><input style={inp} type="date" value={form.original_inv_date||''} onChange={set('original_inv_date')}/></F>
          <F label="Customer Name" required error={errors.party_name}><input style={errors.party_name?inpE:inp} value={form.party_name||''} onChange={set('party_name')}/></F>
          <F label="Reason"><select style={sel} value={form.reason||'Return'} onChange={set('reason')}>{['Return','Discount','Rate Revision','Cancellation','Other'].map(r=><option key={r}>{r}</option>)}</select></F>
          <F label="Taxable Value (₹)" required error={errors.taxable_value}><input style={errors.taxable_value?inpE:inp} type="number" value={form.taxable_value||''} onChange={set('taxable_value')}/></F>
          <F label="Supply Type"><select style={sel} value={form.supply_type||'CGST+SGST (Intra-state)'} onChange={set('supply_type')}>{SUPPLY_TYPES.map(s=><option key={s}>{s}</option>)}</select></F>
          <F label="GST Rate (%)"><select style={sel} value={form.gst_rate||5} onChange={set('gst_rate')}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</select></F>
          {Number(form.taxable_value)>0&&<div style={{ background:'#FFE2E5',border:'1px solid #FFB8C6',borderRadius:10,padding:'10px 14px',fontSize:12.5,color:'#7F1D1D',fontWeight:600 }}>GST Reversed: CGST {inr(formGST.cgst)} + SGST {inr(formGST.sgst)} + IGST {inr(formGST.igst)} = {inr(formGST.total)}</div>}
        </div>
      </Modal>

      {/* Credit Note Received */}
      <Modal open={modal==='creditNotesReceived'} onClose={()=>setModal(null)} title={editId?'Edit CN (Received)':'Add Credit Note (Received)'} width={600}
        footer={<><button onClick={()=>setModal(null)} style={S}>Cancel</button><button onClick={()=>save('creditNotesReceived',['cn_no','date','party_name'])} style={P}>Save</button></>}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          <F label="Supplier Name" required error={errors.party_name}><input style={errors.party_name?inpE:inp} value={form.party_name||''} onChange={set('party_name')}/></F>
          <F label="Supplier GSTIN"><input style={inp} value={form.party_gstin||''} onChange={set('party_gstin')}/></F>
          <F label="Credit Note No." required error={errors.cn_no}><input style={errors.cn_no?inpE:inp} value={form.cn_no||''} onChange={set('cn_no')}/></F>
          <F label="Date" required><input style={inp} type="date" value={form.date||''} onChange={set('date')}/></F>
          <F label="Original Invoice Ref"><input style={inp} value={form.original_inv_no||''} onChange={set('original_inv_no')}/></F>
          <F label="Amount Reduced (₹)"><input style={inp} type="number" value={form.amount||''} onChange={set('amount')}/></F>
          <F label="CGST Reversed (₹)"><input style={inp} type="number" value={form.cgst||''} onChange={set('cgst')}/></F>
          <F label="SGST Reversed (₹)"><input style={inp} type="number" value={form.sgst||''} onChange={set('sgst')}/></F>
          <F label="IGST Reversed (₹)"><input style={inp} type="number" value={form.igst||''} onChange={set('igst')}/></F>
        </div>
      </Modal>

      {/* RCM */}
      <Modal open={modal==='rcmTransactions'} onClose={()=>setModal(null)} title={editId?'Edit RCM':'Add RCM Transaction'} width={640}
        footer={<><button onClick={()=>setModal(null)} style={S}>Cancel</button><button onClick={()=>save('rcmTransactions',['date','party_name','taxable_value'])} style={P}>Save</button></>}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          <F label="Supplier Name" required error={errors.party_name}><input style={errors.party_name?inpE:inp} value={form.party_name||''} onChange={set('party_name')}/></F>
          <F label="Nature of Service"><select style={sel} value={form.service_type||'GTA Freight'} onChange={set('service_type')}>{RCM_SERVICES.map(s=><option key={s}>{s}</option>)}</select></F>
          <F label="Date" required><input style={inp} type="date" value={form.date||''} onChange={set('date')}/></F>
          <F label="Taxable Value (₹)" required error={errors.taxable_value}><input style={errors.taxable_value?inpE:inp} type="number" value={form.taxable_value||''} onChange={set('taxable_value')}/></F>
          <F label="GST Rate (%)"><select style={sel} value={form.gst_rate||18} onChange={set('gst_rate')}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</select></F>
          <F label="Supply Type"><select style={sel} value={form.supply_type||'CGST+SGST (Intra-state)'} onChange={set('supply_type')}>{SUPPLY_TYPES.map(s=><option key={s}>{s}</option>)}</select></F>
          {Number(form.taxable_value)>0&&(
            <div style={{ gridColumn:'1/-1',background:'#FFF8DD',border:'1px solid #F6C000',borderRadius:10,padding:'10px 14px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10 }}>
              {[['IGST',formGST.igst],['CGST',formGST.cgst],['SGST',formGST.sgst],['Total RCM',formGST.total]].map(([l,v])=>(
                <div key={l}><div style={{ fontSize:9.5,fontWeight:700,color:'#7A4E00',textTransform:'uppercase',marginBottom:2 }}>{l}</div><div style={{ fontSize:14,fontWeight:800,color:'#7A4E00',fontFamily:'monospace' }}>{inr(v)}</div></div>
              ))}
            </div>
          )}
          <F label="Payment Challan Ref"><input style={inp} value={form.challan_ref||''} onChange={set('challan_ref')}/></F>
          <F label="ITC Eligible?"><select style={sel} value={form.itc_eligible||'Yes'} onChange={set('itc_eligible')}><option>Yes</option><option>No</option></select></F>
        </div>
      </Modal>

      {/* Advance */}
      <Modal open={modal==='advancesReceived'} onClose={()=>setModal(null)} title={editId?'Edit Advance':'Add Advance Receipt'} width={600}
        footer={<><button onClick={()=>setModal(null)} style={S}>Cancel</button><button onClick={()=>save('advancesReceived',['voucher_no','date','party_name','advance_amount'])} style={P}>Save</button></>}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          <F label="Receipt Voucher No." required error={errors.voucher_no}><input style={errors.voucher_no?inpE:inp} value={form.voucher_no||''} onChange={set('voucher_no')}/></F>
          <F label="Date" required><input style={inp} type="date" value={form.date||''} onChange={set('date')}/></F>
          <F label="Customer Name" required error={errors.party_name}><input style={errors.party_name?inpE:inp} value={form.party_name||''} onChange={set('party_name')}/></F>
          <F label="Customer GSTIN"><input style={inp} value={form.party_gstin||''} onChange={set('party_gstin')} placeholder="Blank for B2C"/></F>
          <F label="Advance Amount (₹)" required error={errors.advance_amount}><input style={errors.advance_amount?inpE:inp} type="number" value={form.advance_amount||''} onChange={set('advance_amount')}/></F>
          <F label="GST Rate (%)"><select style={sel} value={form.gst_rate||5} onChange={set('gst_rate')}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</select></F>
          {Number(form.advance_amount)>0&&<div style={{ gridColumn:'1/-1',background:'#EAF0F8',border:'1px solid #C5D5E8',borderRadius:10,padding:'10px 14px',fontSize:12.5,color:'#071437',fontWeight:600 }}>GST on Advance: {inr(Math.round(Number(form.advance_amount)*Number(form.gst_rate||5)/(100+Number(form.gst_rate||5))))}</div>}
          <F label="Status"><select style={sel} value={form.status||'Pending Adjustment'} onChange={set('status')}><option>Pending Adjustment</option><option>Adjusted Against Invoice</option><option>Refunded</option></select></F>
        </div>
      </Modal>

      {/* Challan */}
      <Modal open={modal==='gstChallans'} onClose={()=>setModal(null)} title={editId?'Edit Challan':'Add GST Payment (PMT-06)'} width={600}
        footer={<><button onClick={()=>setModal(null)} style={S}>Cancel</button><button onClick={()=>{
          const total=Number(form.igst||0)+Number(form.cgst||0)+Number(form.sgst||0);
          setForm(f=>({...f,total_paid:total}));
          save('gstChallans',['challan_no','date']);
        }} style={P}>Save Challan</button></>}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          <F label="Challan No. (PMT-06)" required error={errors.challan_no}><input style={errors.challan_no?inpE:inp} value={form.challan_no||''} onChange={set('challan_no')}/></F>
          <F label="Payment Date" required><input style={inp} type="date" value={form.date||''} onChange={set('date')}/></F>
          <F label="For Month"><input style={inp} type="month" value={form.month||''} onChange={set('month')}/></F>
          <F label="Payment Mode"><select style={sel} value={form.payment_mode||'Net Banking'} onChange={set('payment_mode')}><option>Net Banking</option><option>NEFT/RTGS</option><option>Over the Counter</option></select></F>
          <F label="IGST Paid (₹)"><input style={inp} type="number" value={form.igst||''} onChange={set('igst')}/></F>
          <F label="CGST Paid (₹)"><input style={inp} type="number" value={form.cgst||''} onChange={set('cgst')}/></F>
          <F label="SGST Paid (₹)"><input style={inp} type="number" value={form.sgst||''} onChange={set('sgst')}/></F>
          <div style={{ background:'#E8FFF3',border:'1px solid #50CD89',borderRadius:8,padding:'10px 14px' }}>
            <div style={{ fontSize:9.5,fontWeight:700,color:'#17C653',textTransform:'uppercase',marginBottom:2 }}>Total Paid</div>
            <div style={{ fontSize:18,fontWeight:800,color:'#17C653',fontFamily:'monospace' }}>{inr(Number(form.igst||0)+Number(form.cgst||0)+Number(form.sgst||0))}</div>
          </div>
          <F label="Bank Reference No." span={2}><input style={inp} value={form.bank_ref||''} onChange={set('bank_ref')} placeholder="NEFT transaction reference"/></F>
        </div>
      </Modal>

      {/* E-Way Bill */}
      <Modal open={modal==='ewayBills'} onClose={()=>setModal(null)} title={editId?'Edit E-Way Bill':'Add E-Way Bill'} width={680}
        footer={<><button onClick={()=>setModal(null)} style={S}>Cancel</button><button onClick={()=>save('ewayBills',['ewb_no','gen_date'])} style={P}>Save</button></>}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          <F label="EWB Number" required error={errors.ewb_no}><input style={errors.ewb_no?inpE:inp} value={form.ewb_no||''} onChange={set('ewb_no')} placeholder="12-digit EWB number"/></F>
          <F label="Generation Date" required><input style={inp} type="date" value={form.gen_date||''} onChange={set('gen_date')}/></F>
          <F label="Valid Until"><input style={inp} type="date" value={form.valid_until||''} onChange={set('valid_until')}/></F>
          <F label="Linked Invoice No."><input style={inp} value={form.invoice_no||''} onChange={set('invoice_no')}/></F>
          <F label="From PIN Code"><input style={inp} value={form.from_pin||''} onChange={set('from_pin')} maxLength={6}/></F>
          <F label="To PIN Code"><input style={inp} value={form.to_pin||''} onChange={set('to_pin')} maxLength={6}/></F>
          <F label="Transporter Name"><input style={inp} value={form.transporter||''} onChange={set('transporter')}/></F>
          <F label="Vehicle Number"><input style={inp} value={form.vehicle_no||''} onChange={set('vehicle_no')} placeholder="MH12AB1234"/></F>
          <F label="Goods Description" span={2}><input style={inp} value={form.goods_desc||''} onChange={set('goods_desc')}/></F>
          <F label="HSN Code"><input style={inp} value={form.hsn||''} onChange={set('hsn')}/></F>
          <F label="Total Value (₹)"><input style={inp} type="number" value={form.total_value||''} onChange={set('total_value')}/></F>
        </div>
      </Modal>

      {/* View Details */}
      {viewItem&&(
        <Modal open={true} onClose={()=>setViewItem(null)} title="Entry Details" width={560}
          footer={<button onClick={()=>setViewItem(null)} style={S}>Close</button>}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
            {Object.entries(viewItem).filter(([k])=>!['id','_s','_source'].includes(k)).map(([k,v])=>(
              <div key={k} style={{ padding:'7px 0',borderBottom:'1px solid #FCFCFC' }}>
                <div style={{ fontSize:9.5,fontWeight:700,color:'#4B5675',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:2 }}>{k.replace(/_/g,' ')}</div>
                <div style={{ fontSize:12.5,fontWeight:600,color:'#071437' }}>{String(v||'—')}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
