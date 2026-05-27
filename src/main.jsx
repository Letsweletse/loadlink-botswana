import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Truck, Plus, CheckCircle2, Clock, X } from 'lucide-react';
import './mobile.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const configured = Boolean(SUPABASE_URL && SUPABASE_KEY);

const tiers = {
  mini: { label: 'Van / Mini Truck', capacity: 'Under 2 ton', base: 250, perKm: 8, deposit: 50 },
  medium: { label: 'Medium Truck', capacity: 'Under 7 ton', base: 700, perKm: 18, deposit: 100 },
  big: { label: 'Big Truck', capacity: 'Over 7 ton', base: 1500, perKm: 32, deposit: 200 },
};

function fare(size, km, boost = 0) {
  const tier = tiers[size] || tiers.mini;
  return Math.round(tier.base + Math.max(0, Number(km || 0) - 12) * tier.perKm + Number(boost || 0));
}

async function api(table, options = {}, query = '') {
  if (!configured) throw new Error('Database not configured');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || 'Database request failed');
  return data;
}

function App() {
  const [tab, setTab] = useState('home');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loads, setLoads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ customer: '', phone: '', pickup: '', dropoff: '', category: 'mini', load: '', km: 12, boost: 0 });
  const quote = useMemo(() => fare(form.category, form.km, form.boost), [form]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    if (!configured) return;
    try {
      const data = await api('loads', {}, '?select=*&order=created_at.desc');
      setLoads(data || []);
    } catch (e) { show('Connection issue. Please refresh.'); }
  }

  function show(msg) { setToast(msg); setTimeout(() => setToast(''), 2400); }
  function id() { return `LL-${String(Date.now()).slice(-6)}`; }

  const filtered = loads.filter(l => {
    const q = `${l.id} ${l.customer} ${l.pickup} ${l.dropoff} ${l.status} ${l.category}`.toLowerCase();
    const okQuery = q.includes(query.toLowerCase());
    const okFilter = filter === 'all' || l.category === filter || String(l.status || '').toLowerCase().includes(filter);
    return okQuery && okFilter;
  });

  async function createLoad(e) {
    e.preventDefault();
    const payload = { id: id(), customer: form.customer, phone: form.phone, pickup: form.pickup, dropoff: form.dropoff, category: form.category, load: form.load, km: Number(form.km), offer: quote, status: 'Broadcasting', driver: '' };
    try {
      const saved = configured ? (await api('loads', { method: 'POST', body: JSON.stringify(payload) }))[0] : payload;
      setLoads([saved, ...loads]);
      setForm({ customer: '', phone: '', pickup: '', dropoff: '', category: 'mini', load: '', km: 12, boost: 0 });
      setTab('loads'); show('Load broadcast created.');
    } catch (e) { show('Could not create booking.'); }
  }

  const active = loads.filter(l => String(l.status || '').toLowerCase() !== 'completed').length;
  const completed = loads.filter(l => String(l.status || '').toLowerCase() === 'completed').length;
  const value = loads.reduce((sum, l) => sum + Number(l.offer || 0), 0);

  return <div className="app">
    <header className="top"><div className="brand"><div className="mark">LL</div><div><b>LoadLink</b><span>Clean Vite build</span></div></div><nav>{['home','book','loads','drivers','profile'].map(x => <button key={x} className={tab===x?'on':''} onClick={()=>setTab(x)}>{x}</button>)}</nav></header>
    <main>
      {tab === 'home' && <section className="panel hero"><span className="pill">LOADLINK CLEAN BUILD · NO OLD REPO</span><h1>Move goods with verified vans and trucks.</h1><p>Fresh LoadLink Botswana app connected to the existing Supabase transport database. If you do not see this badge, Vercel is deploying the wrong project or old commit.</p><div className="stats"><Stat icon={<Truck/>} label="Active" value={active}/><Stat icon={<Clock/>} label="Requests" value={loads.length}/><Stat icon={<CheckCircle2/>} label="Completed" value={completed}/></div><div className="estimate"><span>Supabase status</span><b>{configured ? 'Connected' : 'Env missing'}</b></div><div className="estimate"><span>Total request value</span><b>P{value.toLocaleString()}</b></div><button className="primary" onClick={()=>setTab('book')}><Plus size={16}/> New booking</button><button className="secondary" onClick={()=>setTab('loads')}>View requests</button></section>}
      {tab === 'book' && <section className="panel"><h2>Book transport</h2><form onSubmit={createLoad} className="form"><input required placeholder="Customer / business name" value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})}/><input required placeholder="WhatsApp number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input required placeholder="Pickup location" value={form.pickup} onChange={e=>setForm({...form,pickup:e.target.value})}/><input required placeholder="Drop-off location" value={form.dropoff} onChange={e=>setForm({...form,dropoff:e.target.value})}/><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{Object.entries(tiers).map(([k,t])=><option key={k} value={k}>{t.label} · {t.capacity}</option>)}</select><textarea placeholder="Goods description" value={form.load} onChange={e=>setForm({...form,load:e.target.value})}/><input type="number" min="1" value={form.km} onChange={e=>setForm({...form,km:e.target.value})}/><input type="number" min="0" placeholder="Boost amount" value={form.boost} onChange={e=>setForm({...form,boost:e.target.value})}/><div className="estimate"><span>Recommended fare</span><b>P{quote}</b></div><button className="primary">Broadcast request</button></form></section>}
      {(tab === 'loads' || tab === 'drivers') && <><section className="panel search"><div className="searchbox"><Search size={16}/><input placeholder="Search bookings, places, status..." value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="chips">{['all','mini','medium','big','broadcasting','completed'].map(f=><button key={f} className={filter===f?'on':''} onClick={()=>setFilter(f)}>{f}</button>)}</div><small>{filtered.length} results</small></section><section className="list">{filtered.map(l=><article className="card" key={l.id}><div><b>{l.pickup} → {l.dropoff}</b><span>{l.id} · {tiers[l.category]?.label || l.category} · {l.status}</span></div><strong>P{l.offer}</strong><div className="actions"><button onClick={()=>setSelected(l)}>Details</button><a href={`https://wa.me/26772347712?text=${encodeURIComponent('LoadLink '+l.id+' '+l.pickup+' to '+l.dropoff)}`} target="_blank">WhatsApp</a></div></article>)}</section></>}
      {tab === 'profile' && <section className="panel"><span className="pill">Admin setup</span><h2>LoadLink Profile</h2><p>This is the clean LoadLink app, not Heavy Haul Heroes.</p><div className="estimate"><span>Project</span><b>{configured ? 'Online' : 'Env missing'}</b></div></section>}
    </main>
    {selected && <div className="overlay" onClick={()=>setSelected(null)}><section className="sheet" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}><X size={16}/> Close</button><h2>{selected.id}</h2><p>{selected.pickup} to {selected.dropoff}</p><div className="estimate"><span>Fare</span><b>P{selected.offer}</b></div><div className="estimate"><span>Status</span><b>{selected.status}</b></div></section></div>}
    {toast && <div className="toast">{toast}</div>}
  </div>;
}
function Stat({icon,label,value}){return <div className="stat">{icon}<b>{value}</b><span>{label}</span></div>}

createRoot(document.getElementById('root')).render(<App/>);
