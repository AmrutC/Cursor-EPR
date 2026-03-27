import React, { useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { inr, fmtDate } from '../../utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, AlertTriangle, Clock, CheckCircle2,
  Building2, Users, Receipt, Truck, ArrowRight,
} from 'lucide-react';

// ── UI ATOMS ──────────────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{ background:'#fff', border:'1px solid #F1F1F4', borderRadius:14,
    padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', ...style }}>
    {children}
  </div>
);
const SectionTitle = ({ text, action, onAction }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
    <div style={{ fontSize:11, fontWeight:700, color:'#4B5675', textTransform:'uppercase', letterSpacing:'0.6px' }}>{text}</div>
    {action && <button onClick={onAction} style={{ fontSize:11, color:'#1B84FF', fontWeight:600, background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>{action} <ArrowRight size={10}/></button>}
  </div>
);
const KPICard = ({ label, value, sub, color='#071437', bg='#FCFCFC', icon:Icon, trend }) => (
  <div style={{ background:bg, border:'1px solid #F1F1F4', borderRadius:12, padding:'14px 16px', position:'relative', overflow:'hidden' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:9.5, fontWeight:700, color:'#78829D', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:6 }}>{label}</div>
        <div style={{ fontSize:20, fontWeight:800, color, fontFamily:'monospace', lineHeight:1 }}>{value}</div>
        {sub && <div style={{ fontSize:11, color:'#99A1B7', marginTop:4 }}>{sub}</div>}
      </div>
      {Icon && <Icon size={20} style={{ color, opacity:0.3 }}/>}
    </div>
    {trend !== undefined && (
      <div style={{ marginTop:8, fontSize:11, fontWeight:600, color:trend>=0?'#17C653':'#F8285A', display:'flex', alignItems:'center', gap:3 }}>
        {trend>=0 ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
        {Math.abs(trend)}% vs last month
      </div>
    )}
  </div>
);
const EmptyState = ({ icon:Icon, msg }) => (
  <div style={{ padding:'32px 20px', textAlign:'center', color:'#99A1B7' }}>
    {Icon && <Icon size={28} style={{ margin:'0 auto 10px', opacity:0.4 }}/>}
    <div style={{ fontSize:13 }}>{msg}</div>
  </div>
);

// ── DATA HOOKS ─────────────────────────────────────────────────────────────
function useEntityData() {
  const { activeEntity, projects, bookings, vendors, ledgerEntries, brokers } = useAppStore();
  const id = activeEntity?.id;

  return useMemo(() => {
    const eProjects  = (projects||[]).filter(p=>p.entity_id===id);
    const eBookings  = (bookings||[]).filter(b=>b.entity_id===id);
    const eVendors   = (vendors||[]).filter(v=>v.entity_id===id);
    const eLedger    = (ledgerEntries||[]).filter(e=>e.entity_id===id);
    const eBrokers   = (brokers||[]).filter(b=>b.entity_id===id);
    const approvedBk = eBookings.filter(b=>b.approval_status==='Approved');

    // Unit status counts across all projects
    const unitCounts = { Available:0, Booked:0, 'Agreement Done':0, Registered:0, 'Possession Given':0, Landowner:0 };
    eProjects.forEach(p=>{
      (p.unit_rows||[]).forEach(u=>{
        if (u.is_landowner) { unitCounts.Landowner++; return; }
        const bk = approvedBk.find(b=>b.project_id===p.id&&(b.unit_no===u.unit_no||b.flat===u.unit_no));
        if (!bk) { unitCounts.Available++; return; }
        if (bk.status==='Possession Given') unitCounts['Possession Given']++;
        else if (bk.status==='Registered')  unitCounts['Registered']++;
        else if (bk.status==='Agreement Done') unitCounts['Agreement Done']++;
        else unitCounts['Booked']++;
      });
    });

    // Collections from bookings milestones
    const totalCollected = approvedBk.reduce((s,b)=>(b.milestones||[]).reduce((a,m)=>a+(m.paid||0),s), 0);
    const totalAgreement = approvedBk.reduce((s,b)=>s+(Number(b.agreement_value)||0), 0);

    // Overdue demands
    const today = new Date().toISOString().slice(0,10);
    const overdueDemands = approvedBk.flatMap(b=>
      (b.milestones||[])
        .filter(m=>['Demand Issued','Part Paid','Overdue'].includes(m.status) && m.due && m.due < today)
        .map(m=>({ ...m, booking:b, project:eProjects.find(p=>p.id===b.project_id) }))
    );
    const overdueAmt = overdueDemands.reduce((s,m)=>s+(m.total-m.paid),0);

    // Upcoming demands (next 30 days)
    const future = new Date(); future.setDate(future.getDate()+30);
    const futureStr = future.toISOString().slice(0,10);
    const upcomingDemands = approvedBk.flatMap(b=>
      (b.milestones||[])
        .filter(m=>['Demand Issued','Pending'].includes(m.status) && m.due && m.due >= today && m.due <= futureStr)
        .map(m=>({ ...m, booking:b, project:eProjects.find(p=>p.id===b.project_id) }))
    ).slice(0,5);

    // Vendor dues
    const vendorDues = eVendors.reduce((s,v)=>
      (v.bills||[]).filter(b=>b.status!=='Paid')
        .reduce((a,b)=>a+((b.net_payable||0)-(b.paid_amount||0)),s), 0);

    // Recent payments (last 5)
    const recentPayments = approvedBk.flatMap(b=>
      (b.milestones||[]).flatMap(m=>
        (m.payments||[]).map(p=>({ ...p, booking:b, milestone:m.name,
          project:eProjects.find(pr=>pr.id===b.project_id) }))
      )
    ).sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,5);

    // GST this month
    const thisMonth = new Date().toISOString().slice(0,7);
    const gstThisMonth = approvedBk.reduce((s,b)=>
      (b.milestones||[]).reduce((a,m)=>
        a+(m.payments||[]).filter(p=>(p.date||'').startsWith(thisMonth))
          .reduce((x,p)=>x+Math.round((p.amount||0)*(b.gst_rate||5)/(100+(b.gst_rate||5))),0)
      ,s), 0);

    // Collection bar chart — last 6 months
    const months = [];
    for (let i=5; i>=0; i--) {
      const d = new Date(); d.setMonth(d.getMonth()-i);
      const ym = d.toISOString().slice(0,7);
      const label = d.toLocaleString('en-IN',{month:'short'});
      const received = approvedBk.reduce((s,b)=>
        (b.milestones||[]).reduce((a,m)=>
          a+(m.payments||[]).filter(p=>(p.date||'').startsWith(ym))
            .reduce((x,p)=>x+(p.amount||0),0)
        ,s),0);
      const demanded = approvedBk.reduce((s,b)=>
        (b.milestones||[]).filter(m=>m.status!=='Pending'&&(m.due||'').startsWith(ym))
          .reduce((a,m)=>a+(m.total||0),s),0);
      months.push({ month:label, demanded, received });
    }

    // Ledger summary
    const totalCredits = eLedger.filter(e=>e.type==='Credit').reduce((s,e)=>s+e.amount,0);
    const totalDebits  = eLedger.filter(e=>e.type==='Debit').reduce((s,e)=>s+e.amount,0);

    // Pending bookings
    const pendingApproval = eBookings.filter(b=>b.approval_status==='Pending');

    return {
      eProjects, eBookings, approvedBk, eVendors, eLedger, eBrokers,
      unitCounts, totalCollected, totalAgreement, overdueAmt, overdueDemands,
      upcomingDemands, vendorDues, recentPayments, gstThisMonth, months,
      totalCredits, totalDebits, pendingApproval,
      totalUnits: Object.values(unitCounts).reduce((s,x)=>s+x,0),
    };
  }, [id, projects, bookings, vendors, ledgerEntries, brokers]);
}

// ── COLLECTION CHART ──────────────────────────────────────────────────────
function CollectionChart({ data }) {
  const hasData = data.some(d=>d.demanded>0||d.received>0);
  return (
    <Card>
      <SectionTitle text="Collection Efficiency — Last 6 Months"/>
      {!hasData ? (
        <EmptyState icon={Receipt} msg="No payment data yet. Collections will appear here once payments are recorded."/>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barCategoryGap="30%" barSize={12}>
            <XAxis dataKey="month" tick={{ fontSize:11, fill:'#4B5675', fontWeight:600 }} axisLine={false} tickLine={false}/>
            <YAxis tickFormatter={v=>v>=100000?'₹'+(v/100000).toFixed(0)+'L':v>0?'₹'+v:''} tick={{ fontSize:10, fill:'#4B5675' }} axisLine={false} tickLine={false} width={48}/>
            <Tooltip formatter={v=>[inr(v),'']} labelStyle={{ fontSize:12, fontWeight:700 }} contentStyle={{ borderRadius:10, border:'1px solid #F1F1F4', fontSize:12 }}/>
            <Legend wrapperStyle={{ fontSize:11, fontWeight:600 }} iconType="circle" iconSize={7}/>
            <Bar dataKey="demanded" name="Demanded" fill="#C4CADA" radius={[4,4,0,0]}/>
            <Bar dataKey="received" name="Received"  fill="#071437" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

// ── UNIT STATUS PANEL ─────────────────────────────────────────────────────
function UnitStatusPanel({ unitCounts, total }) {
  const STATUS_COLORS = {
    Available:'#17C653', Booked:'#1B84FF', 'Agreement Done':'#F6C000',
    Registered:'#7239EA', 'Possession Given':'#0E9F8A', Landowner:'#99A1B7',
  };
  return (
    <Card>
      <SectionTitle text="Unit Status"/>
      {total === 0 ? (
        <EmptyState icon={Building2} msg="No projects registered yet."/>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {Object.entries(unitCounts).filter(([,c])=>c>0).map(([status, count]) => {
            const pct = Math.round(count/total*100);
            return (
              <div key={status}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, color:'#252F4A', fontWeight:600 }}>{status}</span>
                  <span style={{ fontSize:12, fontWeight:800, color:'#071437' }}>{count}</span>
                </div>
                <div style={{ height:6, background:'#F9F9F9', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:`${pct}%`, height:'100%', background:STATUS_COLORS[status]||'#78829D', borderRadius:3 }}/>
                </div>
              </div>
            );
          })}
          <div style={{ paddingTop:10, borderTop:'1px solid #F9F9F9', display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:11, color:'#4B5675', fontWeight:600 }}>Total Units</span>
            <span style={{ fontSize:13, fontWeight:800, color:'#071437' }}>{total}</span>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── DIRECTOR DASHBOARD ────────────────────────────────────────────────────
function DirectorDashboard() {
  const { setActiveModule } = useAppStore();
  const d = useEntityData();
  const collPct = d.totalAgreement > 0 ? Math.round(d.totalCollected/d.totalAgreement*100) : 0;

  const kpis = [
    { label:'Total Projects',    value:String(d.eProjects.length),   bg:'#F1F1F4', color:'#071437', icon:Building2 },
    { label:'Approved Bookings', value:String(d.approvedBk.length),  bg:'#E8FFF3', color:'#17C653', icon:Users },
    { label:'Total Collected',   value:inr(d.totalCollected,true),   bg:'#F0FDF4', color:'#17C653', icon:TrendingUp },
    { label:'Collection %',      value:collPct+'%',                  bg:'#EEF2FF', color:'#1B84FF' },
    { label:'GST This Month',    value:inr(d.gstThisMonth,true),     bg:'#FFF8DD', color:'#9A6700' },
    { label:'Vendor Dues',       value:inr(d.vendorDues,true),       bg:'#FFE2E5', color:'#A10035', icon:TrendingDown },
    { label:'Overdue Amount',    value:inr(d.overdueAmt,true),       bg:'#FFF5F8', color:'#F8285A', icon:AlertTriangle },
    { label:'Pending Approvals', value:String(d.pendingApproval.length), bg:'#F5F3FF', color:'#5014D0' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
        {kpis.map(k=><KPICard key={k.label} {...k}/>)}
      </div>

      {/* Pending approval banner */}
      {d.pendingApproval.length > 0 && (
        <div style={{ background:'#FFF8DD', border:'1px solid #F6C000', borderRadius:10, padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#9A6700' }}>
            ⚠ {d.pendingApproval.length} booking{d.pendingApproval.length>1?'s':''} pending your approval
          </div>
          <button onClick={()=>setActiveModule('bookings')}
            style={{ background:'#9A6700', color:'#fff', border:'none', borderRadius:7, padding:'5px 14px', cursor:'pointer', fontSize:12, fontWeight:700 }}>
            Review Now →
          </button>
        </div>
      )}

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,2fr) minmax(0,1fr)', gap:14 }}>
        <CollectionChart data={d.months}/>
        <UnitStatusPanel unitCounts={d.unitCounts} total={d.totalUnits}/>
      </div>

      {/* Demands + Activity */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,3fr) minmax(0,2fr)', gap:14 }}>
        {/* Upcoming/Overdue demands */}
        <Card>
          <SectionTitle text="Upcoming & Overdue Demands" action="All Payments" onAction={()=>setActiveModule('payments')}/>
          {(d.overdueDemands.length===0 && d.upcomingDemands.length===0) ? (
            <EmptyState icon={Clock} msg="No upcoming demands. Issue demand notices from the Payments module."/>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {[...d.overdueDemands,...d.upcomingDemands].slice(0,6).map((m,i)=>{
                const isOverdue = d.overdueDemands.includes(m);
                const bk = m.booking; const proj = m.project;
                const name = bk?.allottees?.[0]?.name||bk?.allottee||'—';
                const unit = bk?.unit_no||bk?.flat||'—';
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, background:isOverdue?'#FFF5F8':'#FCFCFC', border:`1px solid ${isOverdue?'#FCA9BD':'#F1F1F4'}` }}>
                    <div style={{ color:isOverdue?'#F8285A':'#F6C000', flexShrink:0 }}>
                      {isOverdue ? <AlertTriangle size={14}/> : <Clock size={14}/>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12.5, fontWeight:700, color:'#071437', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        Unit {unit} — {name}
                      </div>
                      <div style={{ fontSize:11, color:'#4B5675', marginTop:1 }}>{m.name} · {proj?.name||'—'}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:12.5, fontWeight:800, color:'#071437', fontFamily:'monospace' }}>{inr((m.total||0)-(m.paid||0))}</div>
                      <div style={{ fontSize:10.5, fontWeight:700, color:isOverdue?'#F8285A':'#78829D', marginTop:1 }}>
                        {isOverdue?'OVERDUE':fmtDate(m.due)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent payments */}
        <Card>
          <SectionTitle text="Recent Receipts" action="Accounts" onAction={()=>setActiveModule('accounts')}/>
          {d.recentPayments.length===0 ? (
            <EmptyState icon={Receipt} msg="No payments recorded yet."/>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {d.recentPayments.map((p,i)=>{
                const name = p.booking?.allottees?.[0]?.name||p.booking?.allottee||'—';
                const unit = p.booking?.unit_no||p.booking?.flat||'—';
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:9, background:'#F0FDF4', border:'1px solid #BBF7D0' }}>
                    <CheckCircle2 size={13} style={{ color:'#17C653', flexShrink:0 }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#071437', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Unit {unit} — {name}</div>
                      <div style={{ fontSize:10.5, color:'#4B5675' }}>{fmtDate(p.date)} · {p.mode}</div>
                    </div>
                    <div style={{ fontSize:12.5, fontWeight:800, color:'#17C653', fontFamily:'monospace', flexShrink:0 }}>{inr(p.amount)}</div>
                  </div>
                );
              })}
              <div style={{ marginTop:4, padding:'7px 10px', background:'#F1F1F4', borderRadius:8, display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:11.5, color:'#071437', fontWeight:600 }}>Total Collected</span>
                <span style={{ fontSize:12.5, fontWeight:800, color:'#071437', fontFamily:'monospace' }}>{inr(d.totalCollected)}</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Vendor dues summary */}
      {d.vendorDues > 0 && (
        <Card>
          <SectionTitle text="Vendor Dues Summary" action="View Vendors" onAction={()=>setActiveModule('vendors')}/>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10 }}>
            {d.eVendors.filter(v=>(v.bills||[]).some(b=>b.status!=='Paid')).slice(0,4).map(v=>{
              const due = (v.bills||[]).filter(b=>b.status!=='Paid').reduce((s,b)=>s+((b.net_payable||0)-(b.paid_amount||0)),0);
              return (
                <div key={v.id} style={{ background:'#FFF5F8', border:'1px solid #FCA9BD', borderRadius:10, padding:'10px 14px' }}>
                  <div style={{ fontSize:12.5, fontWeight:700, color:'#071437', marginBottom:2 }}>{v.name}</div>
                  <div style={{ fontSize:11, color:'#78829D', marginBottom:4 }}>{v.type}</div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#F8285A', fontFamily:'monospace' }}>{inr(due)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── ACCOUNTS DASHBOARD ────────────────────────────────────────────────────
function AccountsDashboard() {
  const { setActiveModule } = useAppStore();
  const d = useEntityData();

  const kpis = [
    { label:'Total Collected',  value:inr(d.totalCollected,true),  bg:'#E8FFF3', color:'#17C653', icon:TrendingUp },
    { label:'Overdue',          value:inr(d.overdueAmt,true),      bg:'#FFE2E5', color:'#A10035', icon:TrendingDown },
    { label:'GST This Month',   value:inr(d.gstThisMonth,true),    bg:'#FFF8DD', color:'#9A6700' },
    { label:'Vendor Dues',      value:inr(d.vendorDues,true),      bg:'#FFF5F8', color:'#F8285A', icon:Truck },
    { label:'Ledger Credits',   value:inr(d.totalCredits,true),    bg:'#F0FDF4', color:'#17C653' },
    { label:'Ledger Debits',    value:inr(d.totalDebits,true),     bg:'#FFF5F8', color:'#F8285A' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
        {kpis.map(k=><KPICard key={k.label} {...k}/>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,2fr) minmax(0,1fr)', gap:14 }}>
        <CollectionChart data={d.months}/>
        <Card>
          <SectionTitle text="Quick Actions"/>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              ['Add Ledger Entry',   'accounts',  '#F1F1F4', '#071437'],
              ['Record Payment',     'payments',  '#E8FFF3', '#17C653'],
              ['GST Register',       'gst',       '#FFF8DD', '#9A6700'],
              ['Vendor Bills',       'vendors',   '#FFE2E5', '#A10035'],
            ].map(([label,mod,bg,color])=>(
              <button key={label} onClick={()=>setActiveModule(mod)}
                style={{ background:bg, border:'none', borderRadius:9, padding:'10px 14px', cursor:'pointer', textAlign:'left', fontSize:13, fontWeight:700, color, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                {label} <ArrowRight size={13}/>
              </button>
            ))}
          </div>
        </Card>
      </div>
      {d.overdueDemands.length>0 && (
        <Card>
          <SectionTitle text="Overdue Collections"/>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {d.overdueDemands.slice(0,5).map((m,i)=>{
              const name = m.booking?.allottees?.[0]?.name||m.booking?.allottee||'—';
              return (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 12px', borderRadius:9, background:'#FFF5F8', border:'1px solid #FCA9BD' }}>
                  <div>
                    <div style={{ fontSize:12.5, fontWeight:700, color:'#071437' }}>Unit {m.booking?.unit_no} — {name}</div>
                    <div style={{ fontSize:11, color:'#4B5675', marginTop:1 }}>{m.name}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:800, color:'#F8285A', fontFamily:'monospace' }}>{inr((m.total||0)-(m.paid||0))}</div>
                    <div style={{ fontSize:10.5, color:'#F8285A', fontWeight:700 }}>OVERDUE</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── SALES DASHBOARD ───────────────────────────────────────────────────────
function SalesDashboard() {
  const { user, setActiveModule } = useAppStore();
  const d = useEntityData();
  const myBookings = d.eBookings.filter(b=>b.created_by===user?.username||b.sales_person===user?.username);
  const available = d.unitCounts.Available||0;

  const kpis = [
    { label:'Total Bookings',    value:String(d.approvedBk.length),  bg:'#F1F1F4', color:'#071437' },
    { label:'My Bookings',       value:String(myBookings.length),     bg:'#E8FFF3', color:'#17C653' },
    { label:'Units Available',   value:String(available),             bg:'#F0FDF4', color:'#17C653' },
    { label:'Pending Approval',  value:String(d.pendingApproval.length), bg:'#FFF8DD', color:'#9A6700' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
        {kpis.map(k=><KPICard key={k.label} {...k}/>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <Card>
          <SectionTitle text="Available Units" action="Go to Inventory" onAction={()=>setActiveModule('inventory')}/>
          {d.eProjects.length===0 ? <EmptyState icon={Building2} msg="No projects registered."/> :
            d.eProjects.map(p=>{
              const units = (p.unit_rows||[]);
              const avail = units.filter(u=>!u.is_landowner&&!d.approvedBk.find(b=>b.project_id===p.id&&(b.unit_no===u.unit_no||b.flat===u.unit_no))).length;
              return (
                <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid #F9F9F9' }}>
                  <div>
                    <div style={{ fontSize:12.5, fontWeight:700, color:'#071437' }}>{p.name}</div>
                    <div style={{ fontSize:11, color:'#78829D' }}>{p.code} · {p.status}</div>
                  </div>
                  <div style={{ background:'#E8FFF3', color:'#17C653', fontSize:13, fontWeight:800, padding:'3px 12px', borderRadius:20 }}>{avail} available</div>
                </div>
              );
            })
          }
        </Card>
        <UnitStatusPanel unitCounts={d.unitCounts} total={d.totalUnits}/>
      </div>
      {d.approvedBk.length > 0 && (
        <Card>
          <SectionTitle text="Recent Bookings" action="All Bookings" onAction={()=>setActiveModule('bookings')}/>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ background:'#F9F9F9', borderBottom:'2px solid #F1F1F4' }}>
              {['Booking No.','Unit','Allottee','Value','Status'].map(h=>(
                <th key={h} style={{ padding:'7px 12px', textAlign:'left', fontSize:10, fontWeight:700, color:'#4B5675', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {d.approvedBk.slice(0,5).map((b,i)=>(
                <tr key={b.id} style={{ borderBottom:'1px solid #F9F9F9', background:i%2===0?'#fff':'#FCFCFC' }}>
                  <td style={{ padding:'8px 12px', fontSize:11, fontFamily:'monospace', fontWeight:700, color:'#071437' }}>{b.booking_no}</td>
                  <td style={{ padding:'8px 12px', fontSize:12.5, fontWeight:700, color:'#1B84FF' }}>Unit {b.unit_no||b.flat}</td>
                  <td style={{ padding:'8px 12px', fontSize:12.5, color:'#111827' }}>{b.allottees?.[0]?.name||b.allottee||'—'}</td>
                  <td style={{ padding:'8px 12px', fontSize:12.5, fontWeight:800, fontFamily:'monospace', textAlign:'right', color:'#071437' }}>{inr(b.agreement_value)}</td>
                  <td style={{ padding:'8px 12px' }}>
                    <span style={{ background:'#E8FFF3', color:'#17C653', fontSize:10.5, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>{b.status||'Booked'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ── HR DASHBOARD ──────────────────────────────────────────────────────────
function HRDashboard() {
  const { employees, setActiveModule } = useAppStore();
  const kpis = [
    { label:'Total Employees', value:String((employees||[]).length), bg:'#F1F1F4', color:'#071437' },
    { label:'Active',          value:String((employees||[]).filter(e=>e.status==='Active').length), bg:'#E8FFF3', color:'#17C653' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
        {kpis.map(k=><KPICard key={k.label} {...k}/>)}
      </div>
      <Card>
        <SectionTitle text="HR Module" action="Go to HR" onAction={()=>setActiveModule('hr')}/>
        <div style={{ textAlign:'center', padding:24, color:'#78829D', fontSize:13 }}>
          Manage employees, attendance and payroll in the <strong style={{ color:'#071437' }}>HR & Payroll</strong> module.
        </div>
      </Card>
    </div>
  );
}

// ── BROKER DASHBOARD ──────────────────────────────────────────────────────
function BrokerDashboard() {
  const d = useEntityData();
  const kpis = [
    { label:'Total Bookings',  value:String(d.approvedBk.length), bg:'#F1F1F4', color:'#071437' },
    { label:'Units Available', value:String(d.unitCounts.Available||0), bg:'#E8FFF3', color:'#17C653' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'#F1F1F4', border:'1px solid #DBDFE9', borderRadius:10, padding:'10px 16px', fontSize:12.5, color:'#071437' }}>
        <strong>Broker Portal</strong> — View available units, bookings, and brokerage payouts below.
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
        {kpis.map(k=><KPICard key={k.label} {...k}/>)}
      </div>
      <UnitStatusPanel unitCounts={d.unitCounts} total={d.totalUnits}/>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAppStore();
  const role = user?.role || 'director';
  if (role==='director'||role==='super_admin') return <DirectorDashboard/>;
  if (role==='accounts_manager')               return <AccountsDashboard/>;
  if (role==='sales_executive')                return <SalesDashboard/>;
  if (role==='broker')                         return <BrokerDashboard/>;
  if (role==='hr_manager')                     return <HRDashboard/>;
  return <DirectorDashboard/>;
}
