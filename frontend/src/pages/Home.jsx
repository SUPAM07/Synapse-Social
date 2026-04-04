import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useSocket from '../hooks/useSocket.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [recs, setRecs] = useState([]);
  const [dash, setDash] = useState({ categories: [], upcomingByMonth: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const categories = ['All','Tech','Sports','Cultural','Workshop'];
  const { announcements } = useSocket(window.location.origin);
  const { user } = useAuth();

  useEffect(() => {
    fetchEvents();
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (user) fetchRecs();
    else setRecs([]);
  }, [user]);

  async function fetchEvents(overrides = {}) {
    setLoading(true);
    setError('');
    try {
      const effQ = overrides.q !== undefined ? overrides.q : q;
      const effCategory = overrides.category !== undefined ? overrides.category : category;
      const params = {};
      if (effQ) params.q = effQ;
      if (effCategory) params.category = effCategory;
      const res = await axios.get('/api/events', { params });
      setEvents(res.data.events || []);
    } catch (e) {
      setError('Failed to load events. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecs() {
    try {
      const res = await axios.get('/api/stats/recommendations');
      setRecs(res.data.events || []);
    } catch (_) {}
  }

  async function fetchDashboard() {
    try {
      const r = await axios.get('/api/stats/dashboard');
      setDash({
        categories: r.data?.categories || [],
        upcomingByMonth: r.data?.upcomingByMonth || [],
      });
    } catch (_) {}
  }

  const Badge = ({ status }) => (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${status==='approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : status==='pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{status}</span>
  );

  const Card = ({ e }) => (
    <Link to={`/events/${e._id}`} className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:shadow-lg transition relative hover:-translate-y-0.5">
      <img
        src={e.posterUrl || '/placeholder.svg'}
        alt="poster"
        className="w-full h-44 object-cover rounded-xl"
        onError={(ev)=>{ ev.currentTarget.onerror=null; ev.currentTarget.src='/placeholder.svg'; }}
        loading="lazy"
      />
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <Badge status={e.status} />
        <span className="text-xs bg-white/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">{e.category}</span>
      </div>
      <div className="mt-3">
        <h3 className="font-semibold group-hover:underline">{e.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{e.description}</p>
        <div className="text-xs text-slate-500 mt-1">{new Date(e.date).toLocaleString()} • {e.location}</div>
        <div className="mt-1 text-amber-600 text-sm">⭐ {e.averageRating?.toFixed?.(1) || '0.0'}</div>
      </div>
    </Link>
  );

  const Skeleton = () => (
    <div className="animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
      <div className="w-full h-44 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      <div className="mt-3 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 w-3/4 rounded" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 w-full rounded" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 w-1/2 rounded" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl p-3 bg-rose-50 border border-rose-200 text-rose-700">{error}</div>
      )}
      {announcements.length > 0 && (
        <div className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
          <div className="font-semibold mb-1">Live announcements</div>
          <ul className="text-sm text-emerald-800 dark:text-emerald-200 list-disc pl-5 space-y-1">
            {announcements.slice(0,3).map((a, i) => (
              <li key={i}>{a.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input className="input" placeholder="Search events" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {categories.map(c => {
            const active = (c==='All' && !category) || c===category;
            return (
              <button
                key={c}
                className={`px-3 py-1 rounded-full text-sm border ${active
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white border-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'}`}
                onClick={()=>{
                  const next = c==='All' ? '' : c;
                  setCategory(next);
                  fetchEvents({ category: next });
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
        <button className="btn" onClick={fetchEvents}>Search</button>
      </div>

      {recs.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Recommended for you</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recs.map((e) => <Card key={e._id} e={e} />)}
          </div>
        </section>
      )}

      {/* All events */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">All events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? Array.from({length:6}).map((_,i)=><Skeleton key={i} />) : events.map((e) => <Card key={e._id} e={e} />)}
        </div>
      </section>

      {/* Event Statistics Dashboard */}
      {(dash.categories.length > 0 || dash.upcomingByMonth.length > 0) && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h2 className="font-semibold mb-2">Event statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold mb-1">By category</div>
              <ul className="space-y-1">
                {dash.categories.map((c) => (
                  <li key={c._id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span>{c._id || 'Uncategorized'}</span>
                    <span className="text-slate-600 dark:text-slate-300">{c.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-1">Upcoming (next months)</div>
              <ul className="space-y-1">
                {dash.upcomingByMonth.map((m) => (
                  <li key={m._id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span>{m._id}</span>
                    <span className="text-slate-600 dark:text-slate-300">{m.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Leaderboard() {
  const [rows, setRows] = useState([]);
  useEffect(() => { (async () => { const r = await axios.get('/api/stats/leaderboard'); setRows(r.data.leaderboard || []); })(); }, []);
  return (
    <ul className="space-y-2">
      {rows.map((r, idx) => (
        <li key={r._id || idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center gap-3"><span className="w-6 text-center font-semibold">{idx+1}</span><span>{r.name}</span></div>
          <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{r.points} pts</span>
        </li>
      ))}
    </ul>
  );
}
