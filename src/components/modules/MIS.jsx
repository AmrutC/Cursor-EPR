import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { inr, fmtDate } from '../../utils';
import Badge from '../ui/Badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';

const REPORTS = [
  { id:'collection', label:'Collection Efficiency' },
  { id:'flatstatus', label:'Flat Status Grid' },
  { id:'pl',         label:'Project P&L' },
  { id:'vendor',     label:'Vendor Dues' },
  { id:'gst',        label:'GST Summary' },
  { id:'cashflow',   label:'Cash & Bank Position' },
];

const MONTHS = [
  { month:'Oct', demand:0, received:0 },
  { month:'Nov', demand:0, received:0 },
  { month:'Dec', demand:0, received:0 },
  { month:'Jan', demand:0, received:0 },
  { month:'Feb', demand:0, received:0 },
  { month:'Mar', demand:0, received:0 },
];

const FLAT_STATUS = [
  { name:'Available',        value:14, color:'#17C653' },
  { name:'Booked',           value:3,  color:'#1B84FF' },
  { name:'Agreement Done',   value:2,  color:'#F6C000' },
  { name:'Registered',       value:1,  color:'#7239EA' },
  { name:'Possession Given', value:0,  color:'#0E9F8A' },
  { name:'Cancelled',        value:1,  color:'#F8285A' },
];

const PL_DATA = [
  { head:'Sales / Collections',         amount:1366524, type:'income' },
  { head:'Labour Payments',             amount:120000,  type:'expense' },
  { head:'Architect / Consultancy',     amount:150000,  type:'expense' },
  { head:'Legal & Stamping',            amount:35000,   type:'expense' },
  { head:'Materials',                   amount:76000,   type:'expense' },
  { head:'Admin & Miscellaneous',       amount:18000,   type:'expense' },
];

const VENDOR_DUES = [
  { name:'M/s Ram Vitthal Marathe', type:'Structural Engineer', contract:2000000, billed:400000, paid:400000 },
  { name:'Neeraj Bhandare',         type:'Architect',           contract:0, billed:300000, paid:150000 },
  { name:'Mangaldeep Enterprises',  type:'Turnkey Contractor',  contract:42000000,billed:0,      paid:0 },
];

const GST_MO = [
  { month:'Jan 2026', base:393750,  gst:18750  },
  { month:'Feb 2026', base:357500,  gst:17024  },
  { month:'Mar 2026', base:995250,  gst:46294  },
];

export default function MIS() {
  const { activeEntity } = useAppStore();
  const [active, setActive] = useState('collection');

  const totalIncome  = PL_DATA.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0);
  const totalExpense = PL_DATA.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0);
  const netPL        = totalIncome - totalExpense;

  const totalDue = VENDOR_DUES.reduce((s,v)=>s+(v.billed-v.paid),0);
  const totalUnits = FLAT_STATUS.reduce((s,f)=>s+f.value,0);

  return (
    <div>
      {/* Report selector */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
        {REPORTS.map(r=>(
          <button key={r.id} onClick={()=>setActive(r.id)}
            style={{padding:'7px 16px',borderRadius:9,fontSize:12.5,fontWeight:active===r.id?700:500,color:active===r.id?'#fff':'#252F4A',background:active===r.id?'#071437':'#fff',border:`1px solid ${active===r.id?'#071437':'#F1F1F4'}`,cursor:'pointer',transition:'all .12s'}}>
            {r.label}
          </button>
        ))}
        <button style={{marginLeft:'auto',background:'#F9F9F9',border:'1px solid #F1F1F4',borderRadius:9,padding:'7px 14px',cursor:'pointer',fontSize:12,fontWeight:600,color:'#252F4A',display:'flex',alignItems:'center',gap:6}}>
          <Download size={12}/> Export Report
        </button>
      </div>

      {/* Collection Efficiency */}
      {active==='collection'&&(
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            {[
              {l:'Total Demanded',v:inr(MONTHS.reduce((s,m)=>s+m.demand,0),true),c:'#071437'},
              {l:'Total Received',v:inr(MONTHS.reduce((s,m)=>s+m.received,0),true),c:'#17C653'},
              {l:'Collection %',v:Math.round(MONTHS.reduce((s,m)=>s+m.received,0)/MONTHS.reduce((s,m)=>s+m.demand,0)*100)+'%',c:'#1B84FF'},
              {l:'Pending',v:inr(MONTHS.reduce((s,m)=>s+(m.demand-m.received),0),true),c:'#A10035'},
            ].map(s=>(
              <div key={s.l} style={{background:'#fff',border:'1px solid #F1F1F4',borderRadius:12,padding:'12px 15px'}}>
                <div style={{fontSize:9.5,fontWeight:700,color:'#4B5675',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:3}}>{s.l}</div>
                <div style={{fontSize:18,fontWeight:800,color:s.c,fontFamily:'monospace'}}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{background:'#fff',border:'1px solid #F1F1F4',borderRadius:14,padding:'18px 20px',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
            <div style={{fontSize:12,fontWeight:700,color:'#4B5675',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:16}}>Demand vs Collection — Last 6 Months</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={MONTHS} barCategoryGap="30%" barSize={16}>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'#4B5675',fontWeight:600}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>'₹'+v/100000+'L'} tick={{fontSize:10,fill:'#4B5675'}} axisLine={false} tickLine={false} width={52}/>
                <Tooltip formatter={v=>[inr(v),'']} labelStyle={{fontSize:12,fontWeight:700,color:'#071437'}} contentStyle={{borderRadius:10,border:'1px solid #F1F1F4',fontSize:12,color:'#111827'}}/>
                <Legend wrapperStyle={{fontSize:12,color:'#252F4A',fontWeight:600}} iconType="circle" iconSize={8}/>
                <Bar dataKey="demand"   name="Demanded" fill="#C4CADA" radius={[4,4,0,0]}/>
                <Bar dataKey="received" name="Received"  fill="#071437" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:'#fff',border:'1px solid #F1F1F4',borderRadius:14,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#F9F9F9',borderBottom:'2px solid #F1F1F4'}}>
                {['Month','Demanded','Received','Shortfall','Collection %'].map(h=><th key={h} style={{padding:'9px 16px',textAlign:'left',fontSize:10,fontWeight:700,color:'#4B5675',textTransform:'uppercase',letterSpacing:'0.5px'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {MONTHS.map((m,i)=>{
                  const pct=Math.round(m.received/m.demand*100);
                  return(
                    <tr key={m.month} style={{borderBottom:'1px solid #F9F9F9',background:i%2===0?'#fff':'#FCFCFC'}}>
                      <td style={{padding:'9px 16px',fontSize:13,fontWeight:700,color:'#071437'}}>{m.month}</td>
                      <td style={{padding:'9px 16px',fontSize:13,fontFamily:'monospace',textAlign:'right',fontWeight:600,color:'#252F4A'}}>{inr(m.demand)}</td>
                      <td style={{padding:'9px 16px',fontSize:13,fontFamily:'monospace',textAlign:'right',fontWeight:700,color:'#17C653'}}>{inr(m.received)}</td>
                      <td style={{padding:'9px 16px',fontSize:13,fontFamily:'monospace',textAlign:'right',fontWeight:700,color:(m.demand-m.received)>0?'#A10035':'#17C653'}}>{inr(m.demand-m.received)}</td>
                      <td style={{padding:'9px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:80,height:6,background:'#F9F9F9',borderRadius:3,overflow:'hidden'}}>
                            <div style={{width:`${pct}%`,height:'100%',background:pct>=100?'#17C653':pct>=70?'#F6C000':'#F8285A',borderRadius:3}}/>
                          </div>
                          <span style={{fontSize:12,fontWeight:700,color:pct>=100?'#17C653':pct>=70?'#9A6700':'#A10035'}}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flat Status Grid */}
      {active==='flatstatus'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div style={{background:'#fff',border:'1px solid #F1F1F4',borderRadius:14,padding:'18px 20px',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
            <div style={{fontSize:12,fontWeight:700,color:'#4B5675',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:16}}>Unit Status Distribution</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={FLAT_STATUS.filter(f=>f.value>0)} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name,value})=>`${name}: ${value}`} labelLine={true}>
                  {FLAT_STATUS.filter(f=>f.value>0).map((f,i)=><Cell key={i} fill={f.color}/>)}
                </Pie>
                <Tooltip formatter={(v,n)=>[v+' units',n]}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:'#fff',border:'1px solid #F1F1F4',borderRadius:14,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
            <div style={{padding:'13px 18px',borderBottom:'1px solid #F9F9F9',fontSize:12,fontWeight:700,color:'#071437',textTransform:'uppercase',letterSpacing:'0.5px'}}>Status Summary</div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#F9F9F9',borderBottom:'2px solid #F1F1F4'}}>
                {['Status','Units','% of Total'].map(h=><th key={h} style={{padding:'9px 16px',textAlign:'left',fontSize:10,fontWeight:700,color:'#4B5675',textTransform:'uppercase',letterSpacing:'0.5px'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {FLAT_STATUS.map((f,i)=>(
                  <tr key={f.name} style={{borderBottom:'1px solid #F9F9F9',background:i%2===0?'#fff':'#FCFCFC'}}>
                    <td style={{padding:'10px 16px',display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:10,height:10,borderRadius:3,background:f.color,flexShrink:0}}/>
                      <span style={{fontSize:13,fontWeight:600,color:'#071437'}}>{f.name}</span>
                    </td>
                    <td style={{padding:'10px 16px',fontSize:14,fontWeight:800,color:'#071437',fontFamily:'monospace'}}>{f.value}</td>
                    <td style={{padding:'10px 16px',fontSize:12,fontWeight:600,color:'#4B5675'}}>{totalUnits?Math.round(f.value/totalUnits*100):0}%</td>
                  </tr>
                ))}
                <tr style={{background:'#071437'}}>
                  <td style={{padding:'10px 16px',fontSize:12,fontWeight:800,color:'#fff'}}>TOTAL</td>
                  <td style={{padding:'10px 16px',fontSize:14,fontWeight:800,color:'#F6C000',fontFamily:'monospace'}}>{totalUnits}</td>
                  <td style={{padding:'10px 16px',fontSize:12,fontWeight:800,color:'#fff'}}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project P&L */}
      {active==='pl'&&(
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
            {[
              {l:'Total Income',v:inr(totalIncome),c:'#17C653',bg:'#E8FFF3',border:'#A2E8BA'},
              {l:'Total Expenses',v:inr(totalExpense),c:'#A10035',bg:'#FFE2E5',border:'#FCA9BD'},
              {l:'Net Profit/Loss',v:inr(netPL),c:netPL>=0?'#17C653':'#A10035',bg:netPL>=0?'#E8FFF3':'#FFE2E5',border:netPL>=0?'#A2E8BA':'#FCA9BD'},
            ].map(s=>(
              <div key={s.l} style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:12,padding:'14px 18px'}}>
                <div style={{fontSize:10,fontWeight:700,color:s.c,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>{s.l}</div>
                <div style={{fontSize:22,fontWeight:800,color:s.c,fontFamily:'monospace'}}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{background:'#fff',border:'1px solid #F1F1F4',borderRadius:14,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
            <div style={{padding:'13px 18px',borderBottom:'1px solid #F9F9F9',fontSize:12,fontWeight:700,color:'#071437',textTransform:'uppercase',letterSpacing:'0.5px'}}>
              Project P&L — Vision Harmony
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#F9F9F9',borderBottom:'2px solid #F1F1F4'}}>
                {['Head','Type','Amount'].map(h=><th key={h} style={{padding:'9px 18px',textAlign:'left',fontSize:10,fontWeight:700,color:'#4B5675',textTransform:'uppercase',letterSpacing:'0.5px'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {PL_DATA.map((r,i)=>(
                  <tr key={r.head} style={{borderBottom:'1px solid #F9F9F9',background:i%2===0?'#fff':'#FCFCFC'}}>
                    <td style={{padding:'10px 18px',fontSize:13,fontWeight:600,color:'#071437'}}>{r.head}</td>
                    <td style={{padding:'10px 18px'}}><Badge value={r.type==='income'?'Credit':'Debit'}/></td>
                    <td style={{padding:'10px 18px',fontSize:13,fontFamily:'monospace',textAlign:'right',fontWeight:700,color:r.type==='income'?'#17C653':'#A10035'}}>
                      {r.type==='income'?'+':'-'}{inr(r.amount)}
                    </td>
                  </tr>
                ))}
                <tr style={{background:'#071437'}}>
                  <td colSpan={2} style={{padding:'11px 18px',fontSize:13,fontWeight:800,color:'#fff'}}>NET P&L</td>
                  <td style={{padding:'11px 18px',fontSize:14,fontFamily:'monospace',textAlign:'right',fontWeight:800,color:netPL>=0?'#A2E8BA':'#FCA9BD'}}>{netPL>=0?'+':''}{inr(netPL)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vendor Dues */}
      {active==='vendor'&&(
        <div style={{background:'#fff',border:'1px solid #F1F1F4',borderRadius:14,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
          <div style={{padding:'13px 18px',borderBottom:'1px solid #F9F9F9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:12,fontWeight:700,color:'#071437',textTransform:'uppercase',letterSpacing:'0.5px'}}>Vendor Outstanding Dues</span>
            <span style={{fontSize:13,fontWeight:800,color:'#A10035',fontFamily:'monospace'}}>Total Due: {inr(totalDue)}</span>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#F9F9F9',borderBottom:'2px solid #F1F1F4'}}>
              {['Vendor','Type','Contract Value','Total Billed','Paid','Outstanding','%Paid'].map(h=><th key={h} style={{padding:'9px 16px',textAlign:'left',fontSize:10,fontWeight:700,color:'#4B5675',textTransform:'uppercase',letterSpacing:'0.5px'}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {VENDOR_DUES.map((v,i)=>{
                const due=v.billed-v.paid;
                const paidPct=v.billed?Math.round(v.paid/v.billed*100):100;
                return(
                  <tr key={v.name} style={{borderBottom:'1px solid #F9F9F9',background:i%2===0?'#fff':'#FCFCFC'}}>
                    <td style={{padding:'10px 16px',fontSize:13,fontWeight:700,color:'#071437'}}>{v.name}</td>
                    <td style={{padding:'10px 16px',fontSize:12,color:'#252F4A'}}>{v.type}</td>
                    <td style={{padding:'10px 16px',fontSize:13,fontFamily:'monospace',textAlign:'right',color:'#252F4A'}}>{inr(v.contract)}</td>
                    <td style={{padding:'10px 16px',fontSize:13,fontFamily:'monospace',textAlign:'right',color:'#252F4A'}}>{v.billed?inr(v.billed):'—'}</td>
                    <td style={{padding:'10px 16px',fontSize:13,fontFamily:'monospace',textAlign:'right',fontWeight:700,color:'#17C653'}}>{v.paid?inr(v.paid):'—'}</td>
                    <td style={{padding:'10px 16px',fontSize:13,fontFamily:'monospace',textAlign:'right',fontWeight:700,color:due>0?'#A10035':'#17C653'}}>{due?inr(due):'Nil'}</td>
                    <td style={{padding:'10px 16px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{width:60,height:5,background:'#F9F9F9',borderRadius:3}}><div style={{width:`${paidPct}%`,height:'100%',background:'#17C653',borderRadius:3}}/></div>
                        <span style={{fontSize:11,fontWeight:700,color:'#252F4A'}}>{paidPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* GST Summary in MIS */}
      {active==='gst'&&(
        <div style={{background:'#fff',border:'1px solid #F1F1F4',borderRadius:14,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
          <div style={{padding:'13px 18px',borderBottom:'1px solid #F9F9F9',fontSize:12,fontWeight:700,color:'#071437',textTransform:'uppercase',letterSpacing:'0.5px'}}>GST Summary — FY 2026-27</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#F9F9F9',borderBottom:'2px solid #F1F1F4'}}>
              {['Month','Taxable Value','GST Collected','Filing Status','Due Date'].map(h=><th key={h} style={{padding:'9px 18px',textAlign:'left',fontSize:10,fontWeight:700,color:'#4B5675',textTransform:'uppercase',letterSpacing:'0.5px'}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {GST_MO.map((m,i)=>(
                <tr key={m.month} style={{borderBottom:'1px solid #F9F9F9',background:i%2===0?'#fff':'#FCFCFC'}}>
                  <td style={{padding:'10px 18px',fontSize:13,fontWeight:700,color:'#071437'}}>{m.month}</td>
                  <td style={{padding:'10px 18px',fontSize:13,fontFamily:'monospace',textAlign:'right',fontWeight:600,color:'#252F4A'}}>{inr(m.base)}</td>
                  <td style={{padding:'10px 18px',fontSize:13,fontFamily:'monospace',textAlign:'right',fontWeight:800,color:'#9A6700'}}>{inr(m.gst)}</td>
                  <td style={{padding:'10px 18px'}}><Badge value="Pending"/></td>
                  <td style={{padding:'10px 18px',fontSize:12,color:'#78829D'}}>11th of next month</td>
                </tr>
              ))}
              <tr style={{background:'#071437'}}>
                <td style={{padding:'10px 18px',fontSize:12,fontWeight:800,color:'#fff'}}>TOTAL</td>
                <td style={{padding:'10px 18px',fontSize:13,fontFamily:'monospace',textAlign:'right',fontWeight:800,color:'#F1F1F4'}}>{inr(GST_MO.reduce((s,m)=>s+m.base,0))}</td>
                <td style={{padding:'10px 18px',fontSize:13,fontFamily:'monospace',textAlign:'right',fontWeight:800,color:'#F6C000'}}>{inr(GST_MO.reduce((s,m)=>s+m.gst,0))}</td>
                <td colSpan={2}/>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Cash Flow */}
      {active==='cashflow'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          {[
            {l:'Opening Bank Balance',v:inr(2000000),c:'#252F4A'},{l:'Total Receipts',v:inr(1366524),c:'#17C653'},
            {l:'Total Payments',v:inr(399000),c:'#A10035'},{l:'Closing Bank Balance',v:inr(2967524),c:'#071437'},
            {l:'Opening Cash Balance',v:inr(50000),c:'#252F4A'},{l:'Cash Receipts',v:inr(0),c:'#17C653'},
            {l:'Cash Payments',v:inr(76000),c:'#A10035'},{l:'Cash in Hand',v:inr(-26000),c:'#A10035'},
          ].map(s=>(
            <div key={s.l} style={{background:'#fff',border:'1px solid #F1F1F4',borderRadius:12,padding:'14px 18px'}}>
              <div style={{fontSize:10,fontWeight:700,color:'#4B5675',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>{s.l}</div>
              <div style={{fontSize:20,fontWeight:800,color:s.c,fontFamily:'monospace'}}>{s.v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
