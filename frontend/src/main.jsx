import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, ShieldAlert, LayoutDashboard, Database, Radio, FileText, Activity, Settings, ChevronRight, RefreshCw, ExternalLink, Server, Zap, CircleCheck, AlertTriangle, Filter, Menu, X } from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const fmt = (n) => new Intl.NumberFormat('en-IN').format(n || 0);
const ago = (d) => { if (!d) return '—'; const h = Math.floor((Date.now() - new Date(d)) / 3600000); return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`; };

function Badge({ children, tone = 'default' }) { return <span className={`badge ${tone}`}>{children}</span> }
function Stat({ label, value, icon: Icon, note }) { return <div className="stat"><div className="stat-top"><span>{label}</span><Icon size={17}/></div><strong>{value}</strong><small>{note}</small></div> }

function App(){
  const [page, setPage] = useState('dashboard');
  const [query, setQuery] = useState('');
  const [stats, setStats] = useState({});
  const [threats, setThreats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sources, setSources] = useState([]);
  const [cache, setCache] = useState(null);
  const [bson, setBson] = useState(null);
  const [toast, setToast] = useState('');
  const [mobile, setMobile] = useState(false);

  async function api(path, options){ const r = await fetch(API + path, options); if(!r.ok) throw new Error((await r.json()).error || 'Request failed'); return r.json(); }
  async function load(){ try { setStats(await api('/stats')); const t=await api('/threats?limit=50'); setThreats(t.items); setSources(await api('/sources')); } catch(e){ setToast('Backend not connected. Start the Node server and MongoDB.'); } }
  useEffect(()=>{ load(); },[]);
  useEffect(()=>{ if(page==='cache'){ api('/lab/cache').then(setCache).catch(()=>{}); } if(page==='schema'){ api('/lab/bson-size').then(setBson).catch(()=>{}); } },[page]);

  const filtered = useMemo(()=> threats.filter(t => !query || `${t.title} ${t.summary} ${t.category} ${t.tags?.join(' ')}`.toLowerCase().includes(query.toLowerCase())),[threats,query]);
  const nav=[['dashboard','Overview',LayoutDashboard],['threats','Threat Intelligence',ShieldAlert],['sources','Sources',Radio],['reports','Reports',FileText],['schema','Schema Lab',Database],['cache','Working Set',Activity]];

  const openThreat = async (id)=>{ try { setSelected(await api(`/threats/${id}`)); } catch(e){ setToast(e.message); } };
  const classify = async ()=>{ const title=prompt('Threat title or description to classify:'); if(!title)return; const r=await api('/classify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title})}); setToast(`${r.label} • ${r.severity.toUpperCase()} • ${r.score}/100`); };

  return <div className="app">
    <aside className={`sidebar ${mobile?'show':''}`}>
      <div className="brand"><div className="brandmark"><ShieldAlert size={19}/></div><div><b>CTI Verify</b><small>Threat Intelligence</small></div><button className="icon mobile-close" onClick={()=>setMobile(false)}><X/></button></div>
      <div className="navlabel">PLATFORM</div>
      {nav.map(([id,label,Icon])=><button key={id} className={`nav ${page===id?'active':''}`} onClick={()=>{setPage(id);setMobile(false)}}><Icon size={18}/><span>{label}</span>{page===id&&<ChevronRight size={15} className="nav-arrow"/>}</button>)}
      <div className="sidebar-bottom"><div className="db-status"><span className="dot"/>MongoDB connected<small>WiredTiger</small></div><button className="nav"><Settings size={18}/><span>Settings</span></button></div>
    </aside>
    <main>
      <header className="topbar"><button className="icon mobile-menu" onClick={()=>setMobile(true)}><Menu/></button><div className="crumb">Security Operations <span>/</span> {nav.find(x=>x[0]===page)?.[1]}</div><div className="top-actions"><button className="icon" onClick={load}><RefreshCw size={17}/></button><button className="classify" onClick={classify}><Zap size={16}/> Classify Threat</button></div></header>
      <section className="content">
        {toast && <div className="toast" onClick={()=>setToast('')}>{toast}</div>}
        {page==='dashboard' && <Dashboard stats={stats} threats={threats} openThreat={openThreat} setPage={setPage}/>} 
        {page==='threats' && <Threats threats={filtered} query={query} setQuery={setQuery} openThreat={openThreat}/>} 
        {page==='sources' && <Sources sources={sources}/>} 
        {page==='reports' && <Reports/>}
        {page==='schema' && <SchemaLab bson={bson}/>} 
        {page==='cache' && <Cache cache={cache}/>} 
      </section>
    </main>
    {selected && <ThreatModal item={selected} close={()=>setSelected(null)}/>} 
  </div>
}

function Dashboard({stats,threats,openThreat,setPage}){ return <>
  <div className="hero"><div><Badge tone="green">LIVE INTELLIGENCE</Badge><h1>Cyber Threat Command Center</h1><p>Search, classify and investigate security intelligence in one MongoDB-powered workspace.</p></div><div className="hero-orb"><ShieldAlert size={55}/></div></div>
  <div className="stats"><Stat label="Threat reports" value={fmt(stats.total)} icon={FileText} note="Indexed in MongoDB"/><Stat label="Critical threats" value={fmt(stats.critical)} icon={ShieldAlert} note="Immediate attention"/><Stat label="High severity" value={fmt(stats.high)} icon={AlertTriangle} note="Priority monitoring"/><Stat label="Indicators" value={fmt(stats.indicators)} icon={Database} note="Embedded IOCs"/></div>
  <div className="grid-2"><div className="panel"><div className="panel-head"><div><h2>Latest intelligence</h2><p>Most recently indexed threat reports</p></div><button className="linkbtn" onClick={()=>setPage('threats')}>View all <ChevronRight size={15}/></button></div>{threats.slice(0,6).map(t=><ThreatRow key={t._id} t={t} onClick={()=>openThreat(t._id)}/>)}</div>
  <div className="panel"><div className="panel-head"><div><h2>System posture</h2><p>Database and lab readiness</p></div></div><HealthRow label="MongoDB" value="Connected" ok/><HealthRow label="Threat search" value="Indexed" ok/><HealthRow label="BSON analysis" value="Ready" ok/><HealthRow label="WiredTiger monitor" value="Ready" ok/><div className="callout"><Activity size={18}/><div><b>Lab 7.2 ready</b><p>Seed 100,000 × ~2 KB documents to demonstrate working-set behavior.</p></div></div></div></div>
 </> }
function HealthRow({label,value,ok}){return <div className="health"><span>{label}</span><span className={ok?'healthy':''}><CircleCheck size={15}/>{value}</span></div>}
function ThreatRow({t,onClick}){return <button className="threat-row" onClick={onClick}><div className={`sev ${t.severity}`}/><div className="row-main"><b>{t.title}</b><span>{t.sourceName || 'Unknown source'} · {ago(t.publishedAt)} · {t.category}</span></div><Badge tone={t.severity}>{t.severity}</Badge><ChevronRight size={16}/></button>}
function Threats({threats,query,setQuery,openThreat}){return <><PageHead title="Threat Intelligence" sub="Search and investigate indexed cyber threats."/><div className="searchbar"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search threats, malware, actors, indicators..."/><kbd>⌘ K</kbd><button><Filter size={16}/> Filters</button></div><div className="panel tablepanel"><div className="tablehead"><span>{threats.length} results</span><span>Sorted by newest</span></div>{threats.map(t=><ThreatRow key={t._id} t={t} onClick={()=>openThreat(t._id)}/>)}</div></>}
function PageHead({title,sub}){return <div className="pagehead"><div><h1>{title}</h1><p>{sub}</p></div></div>}
function Sources({sources}){return <><PageHead title="Intelligence Sources" sub="Referenced source documents keep repeated publisher data out of threat records."/><div className="source-grid">{sources.map(s=><div className="source-card" key={s._id}><div className="source-icon"><Radio size={18}/></div><div><b>{s.name}</b><p>{s.url}</p></div><Badge tone={s.status==='active'?'green':'yellow'}>{s.status}</Badge><div className="source-meta"><span>{s.articleCount} reports</span><span>Checked {ago(s.lastChecked)}</span></div></div>)}</div></>}
function Reports(){const [items,setItems]=useState([]); useEffect(()=>{fetch(API+'/reports').then(r=>r.json()).then(setItems).catch(()=>{})},[]); return <><PageHead title="Threat Reports" sub="Reports discovered from open security-intelligence feeds."/><div className="panel reportlist">{items.map(r=><div className="report" key={r._id}><div><Badge>{r.category}</Badge><h3>{r.title}</h3><p>{r.summary}</p><small>{r.sourceName} · {ago(r.publishedAt)}</small></div><a href={r.url} target="_blank" rel="noreferrer"><ExternalLink size={17}/></a></div>)}</div></>}
function SchemaLab({bson}){return <><PageHead title="Schema Lab" sub="Lab 7.1 — embedding, referencing and BSON-size analysis."/><div className="grid-2"><div className="panel"><div className="panel-head"><div><h2>Production design</h2><p>Reference stable sources; embed threat-specific data.</p></div></div><div className="schema"><div className="schema-box primary"><b>Threat</b><span>title · severity · category</span><span>indicators[] — embedded</span><span>classification — embedded</span><span>sourceIds[] — references</span></div><div className="connector">references →</div><div className="schema-box"><b>Source</b><span>name</span><span>url</span><span>status</span><span>articleCount</span></div></div><div className="callout"><Database size={18}/><div><b>Why reference sources?</b><p>A source can publish many reports. Embedding the same publisher object in every threat duplicates data and makes publisher updates expensive.</p></div></div></div><div className="panel"><div className="panel-head"><div><h2>Lab 7.1 BSON check</h2><p>MongoDB document limit: 16 MB</p></div></div>{bson?<div className="bson"><div><span>Average</span><b>{Math.round(bson.averageBytes/1024*100)/100} KB</b></div><div><span>Maximum</span><b>{Math.round(bson.maxBytes/1024*100)/100} KB</b></div><div><span>Limit usage</span><b>{bson.percentOfLimit.toFixed(4)}%</b></div><div className="meter"><i style={{width:`${Math.min(100,bson.percentOfLimit)}%`}}/></div><Badge tone="green">No document approaches 16 MB</Badge></div>:<div className="empty">Loading BSON metrics…</div>}</div></div><div className="panel activity"><h2>Activity redesign: embed the source</h2><p>If you decide that the source itself is part of the actual threat record, embed a small source snapshot inside each threat.</p><pre>{`source: {\n  name: "Check Point Research",\n  url: "https://research.checkpoint.com/",\n  confidence: 92\n}`}</pre><div className="pros"><div><b>Faster</b><span>Threat + source is one read.</span></div><div><b>Harder</b><span>Source updates must be propagated to many threat documents.</span></div><div><b>Best for</b><span>Small, immutable or threat-specific source snapshots.</span></div></div></div></>}
function Cache({cache}){return <><PageHead title="Working Set Monitor" sub="Lab 7.2 — WiredTiger cache behavior under random reads."/><div className="stats"><Stat label="Cache hit ratio" value={cache?`${cache.cacheHitRatio.toFixed(2)}%`:'—'} icon={Activity} note="pages requested vs read"/><Stat label="Cache used" value={cache?`${cache.cacheUsedPercent.toFixed(2)}%`:'—'} icon={Database} note="bytes currently in cache"/><Stat label="Pages read" value={cache?fmt(cache.pagesRead):'—'} icon={Server} note="since server start"/><Stat label="Pages requested" value={cache?fmt(cache.pagesRequested):'—'} icon={Zap} note="since server start"/></div><div className="panel"><div className="panel-head"><div><h2>WiredTiger snapshot</h2><p>Refresh this page to observe the changing cache state after random reads.</p></div><button className="classify" onClick={()=>location.reload()}><RefreshCw size={15}/> Refresh</button></div><div className="cachebars"><div><span>Cache utilization</span><b>{cache?cache.cacheUsedPercent.toFixed(2):0}%</b><div className="bar"><i style={{width:`${Math.min(100,cache?.cacheUsedPercent||0)}%`}}/></div></div><div><span>Cache hit ratio</span><b>{cache?cache.cacheHitRatio.toFixed(2):100}%</b><div className="bar"><i style={{width:`${Math.min(100,cache?.cacheHitRatio||100)}%`}}/></div></div></div></div><div className="callout"><Activity size={18}/><div><b>Run the real experiment</b><p>From backend run <code>npm run working-set:seed</code>, then <code>npm run cache:monitor</code>. The monitor performs a random read every 10 seconds.</p></div></div></>}
function ThreatModal({item,close}){return <div className="overlay" onClick={close}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={close}><X/></button><Badge tone={item.severity}>{item.severity} severity</Badge><h2>{item.title}</h2><p>{item.summary}</p><div className="modal-grid"><div><small>SOURCE</small><b>{item.sourceName}</b></div><div><small>CATEGORY</small><b>{item.category}</b></div><div><small>CLASSIFICATION</small><b>{item.classification?.label || '—'} · {item.classification?.score || 0}/100</b></div><div><small>STATUS</small><b>{item.status}</b></div></div><h3>Indicators</h3><div className="chips">{item.indicators?.map((x,i)=><span key={i}>{x.type}: {x.value}</span>)}</div><h3>Techniques</h3><div className="chips">{item.techniques?.map(x=><span key={x}>{x}</span>)}</div></div></div>}

createRoot(document.getElementById('root')).render(<App/>);
