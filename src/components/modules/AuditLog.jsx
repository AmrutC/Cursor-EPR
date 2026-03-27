import React, { useState } from 'react';
import Badge from '../ui/Badge';
import { fmtDate } from '../../utils';
import { Search, Download, Shield } from 'lucide-react';

const DEMO_LOG = [];
const EVENT_COLORS = {
  LOGIN:    { bg:'#E1F0FF', text:'var(--c-primary)' },
  CREATE:   { bg:'var(--c-success-light)', text:'var(--c-success)' },
  UPDATE:   { bg:'var(--c-warning-light)', text:'var(--t-secondary)' },
  DELETE:   { bg:'var(--c-danger-light)', text:'#7F1D1D' },
  DOCUMENT: { bg:'#F1E8FF', text:'var(--c-info)' },
  EXPORT:   { bg:'#E4FFF8', text:'var(--c-teal)' },
  SETTINGS: { bg:'var(--bg-subtle)', text:'var(--t-primary)' },
  LOGOUT:   { bg:'var(--bg-subtle)', text:'var(--t-primary)' },
};

const MODULES = ['All','auth','bookings','payments','projects','documents','vendors','accounts','hr','settings','crm','gst'];
const EVENTS  = ['All','LOGIN','LOGOUT','CREATE','UPDATE','DELETE','DOCUMENT','EXPORT','SETTINGS'];
const inp = { width:'100%', border:'1px solid var(--border-md)', borderRadius:8, padding:'7px 10px', fontSize:13, color:'var(--t-primary)', background:'#fff', outline:'none', fontFamily:'Inter,system-ui,sans-serif' };
const sel = { ...inp, cursor:'pointer' };

export default function AuditLog() {
  const [log] = useState([]);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('All');
  const [filterEvent,  setFilterEvent]  = useState('All');
  const [filterUser,   setFilterUser]   = useState('All');

  const users = ['All', ...new Set(log.map(l=>l.user))];

  const filtered = log.filter(l =>
    (filterModule==='All' || l.module===filterModule) &&
    (filterEvent==='All'  || l.event===filterEvent) &&
    (filterUser==='All'   || l.user===filterUser) &&
    (!search || l.ref?.toLowerCase().includes(search.toLowerCase()) || l.new?.toLowerCase().includes(search.toLowerCase()) || l.user.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      {/* Immutable notice */}
      <div style={{background:'#F1E8FF',border:'1px solid #D4B9FF',borderRadius:10,padding:'10px 14px',marginBottom:16,display:'flex',gap:8,alignItems:'center'}}>
        <Shield size={14} style={{color:'var(--c-info)',flexShrink:0}}/>
        <span style={{fontSize:12,color:'var(--c-info)',fontWeight:500}}>
          <strong>Immutable Log</strong> — No entry can be edited or deleted. Every action by every user is recorded permanently.
        </span>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        {[
          {l:'Total Events',v:log.length,c:'var(--c-dark)'},
          {l:'Logins',v:log.filter(l=>l.event==='LOGIN').length,c:'var(--c-primary)'},
          {l:'Creates',v:log.filter(l=>l.event==='CREATE').length,c:'var(--c-success)'},
          {l:'Documents',v:log.filter(l=>l.event==='DOCUMENT').length,c:'var(--c-info)'},
        ].map(s=>(
          <div key={s.l} style={{background:'#fff',border:'1px solid var(--border)',borderRadius:12,padding:'11px 14px'}}>
            <div style={{fontSize:9.5,fontWeight:700,color:'var(--t-secondary)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:3}}>{s.l}</div>
            <div style={{fontSize:18,fontWeight:800,color:s.c,fontFamily:'monospace'}}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:200,position:'relative'}}>
          <Search size={13} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--t-muted)'}}/>
          <input style={{...inp,paddingLeft:32}} placeholder="Search records, users, references…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select style={{...sel,width:140}} value={filterModule} onChange={e=>setFilterModule(e.target.value)}>
          {MODULES.map(m=><option key={m} value={m}>{m==='All'?'All Modules':m}</option>)}
        </select>
        <select style={{...sel,width:130}} value={filterEvent} onChange={e=>setFilterEvent(e.target.value)}>
          {EVENTS.map(e=><option key={e} value={e}>{e==='All'?'All Events':e}</option>)}
        </select>
        <select style={{...sel,width:120}} value={filterUser} onChange={e=>setFilterUser(e.target.value)}>
          {users.map(u=><option key={u} value={u}>{u==='All'?'All Users':u}</option>)}
        </select>
        <button style={{background:'var(--bg-subtle)',border:'1px solid var(--border)',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:12,fontWeight:600,color:'var(--t-primary)',display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
          <Download size={12}/> Export CSV
        </button>
      </div>

      {/* Table */}
      <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
        <div style={{padding:'10px 16px',borderBottom:'1px solid var(--bg-subtle)',fontSize:12,color:'var(--t-secondary)',fontWeight:600}}>
          Showing {filtered.length} of {log.length} events
        </div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{background:'var(--bg-subtle)',borderBottom:'2px solid var(--border)'}}>
            {['Timestamp','User','Module','Event','Record / Reference','Change Detail'].map(h=>(
              <th key={h} style={{padding:'9px 14px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--t-secondary)',textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.length===0?(
              <tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--t-muted)',fontSize:13}}>No audit entries match your filters.</td></tr>
            ):filtered.map((l,i)=>{
              const ec = EVENT_COLORS[l.event]||{bg:'var(--bg-subtle)',text:'var(--t-primary)'};
              return(
                <tr key={l.id} style={{borderBottom:'1px solid var(--bg-subtle)',background:i%2===0?'#fff':'#FAFAFA'}}>
                  <td style={{padding:'9px 14px',fontSize:11.5,color:'var(--t-primary)',whiteSpace:'nowrap',fontFamily:'monospace'}}>
                    {new Date(l.timestamp).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',second:'2-digit'})}
                  </td>
                  <td style={{padding:'9px 14px',fontSize:12.5,fontWeight:700,color:'var(--c-dark)'}}>{l.user}</td>
                  <td style={{padding:'9px 14px',fontSize:12,color:'var(--t-primary)',textTransform:'capitalize'}}>{l.module}</td>
                  <td style={{padding:'9px 14px'}}>
                    <span style={{background:ec.bg,color:ec.text,fontSize:10.5,fontWeight:700,padding:'2px 8px',borderRadius:12}}>{l.event}</span>
                  </td>
                  <td style={{padding:'9px 14px',fontSize:12.5,fontWeight:600,color:'var(--c-dark)',fontFamily:l.ref?.includes('/')?'monospace':'inherit'}}>{l.ref||'—'}</td>
                  <td style={{padding:'9px 14px'}}>
                    {l.field ? (
                      <div style={{fontSize:11.5,color:'var(--t-primary)'}}>
                        <span style={{fontWeight:600}}>{l.field}:</span>{' '}
                        {l.old&&<span style={{textDecoration:'line-through',color:'var(--c-danger)',marginRight:4}}>{l.old}</span>}
                        {l.new&&<span style={{color:'var(--c-success)',fontWeight:600}}>{l.new}</span>}
                      </div>
                    ) : (
                      <span style={{fontSize:12,color:'var(--t-secondary)'}}>{l.new||'—'}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
