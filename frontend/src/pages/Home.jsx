import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useSocket from '../hooks/useSocket.js';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Star, 
  Sparkles, 
  ChevronRight, 
  TrendingUp,
  Tag,
  Clock,
  LayoutGrid
} from 'lucide-react';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [recs, setRecs] = useState([]);
  const [dash, setDash] = useState({ categories: [], upcomingByMonth: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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

  const Badge = ({ status }) => {
    const styles = {
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
      pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
      rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
    };
    return (
      <span className={`badge ${styles[status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse"></span>
        {status}
      </span>
    );
  };

  const Card = ({ e }) => (
    <Link to={`/events/${e._id}`} className="glass-card group overflow-hidden flex flex-col h-full rounded-3xl">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={e.posterUrl || '/placeholder.svg'}
          alt="poster"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(ev)=>{ ev.currentTarget.onerror=null; ev.currentTarget.src='/placeholder.svg'; }}
          loading="lazy"
        />
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <Badge status={e.status} />
          <span className="badge bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
            {e.category}
          </span>
        </div>
        <div className="absolute bottom-4 right-4 shadow-xl">
           <div className="bg-white/90 dark:bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold text-amber-500 border border-slate-200 dark:border-slate-800">
              <Star size={12} fill="currentColor" />
              <span>{e.averageRating?.toFixed?.(1) || '0.0'}</span>
           </div>
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="text-lg font-bold group-hover:text-primary-600 transition-colors line-clamp-1 mb-2">
            {e.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {e.description}
          </p>
        </div>
        
        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Calendar size={14} className="text-primary-500" />
            <span>{new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            <Clock size={14} className="ml-2 text-primary-500" />
            <span>{new Date(e.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <MapPin size={14} className="text-primary-500" />
            <span>{e.location}</span>
          </div>
        </div>
      </div>
    </Link>
  );

  const Skeleton = () => (
    <div className="glass-card flex flex-col h-full overflow-hidden animate-pulse rounded-3xl">
      <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-800" />
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 w-3/4 rounded-lg" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 w-full rounded-lg" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 w-1/2 rounded-lg" />
        </div>
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 h-10 w-full flex gap-4">
           <div className="h-3 bg-slate-200 dark:bg-slate-800 w-1/3 rounded-lg" />
           <div className="h-3 bg-slate-200 dark:bg-slate-800 w-1/3 rounded-lg" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      {error && (
        <div className="rounded-2xl p-4 bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3">
          <div className="p-2 bg-rose-200 rounded-lg">!</div>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 dark:from-emerald-500/20 dark:to-indigo-500/20 rounded-3xl"></div>
          <div className="relative p-6 px-8 border border-emerald-500/20 dark:border-emerald-500/30 rounded-3xl backdrop-blur-xl">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-widest text-xs">
                  <Sparkles size={16} />
                  <span>Live Announcements</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-75"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-150"></div>
                </div>
             </div>
             <div className="space-y-3">
                {announcements.slice(0, 3).map((a, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 group-hover:translate-x-1 transition-transform">
                    <ChevronRight size={14} className="mt-1 text-emerald-500 flex-shrink-0" />
                    <p className="font-medium leading-relaxed">{a.message}</p>
                  </div>
                ))}
             </div>
          </div>
        </section>
      )}

      {/* Hero Content Overlap or Search Bar */}
      <section className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight">Explore <span className="gradient-text">Events.</span></h2>
            <p className="text-slate-500 dark:text-slate-400">Discover what's happening on your campus.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="input pl-11 !py-3 w-full shadow-lg shadow-slate-200/50 dark:shadow-none" 
                placeholder="Search by title or keyword..." 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && fetchEvents()}
              />
            </div>
            <button 
              className="btn flex gap-2 items-center !py-3 shadow-primary-600/30" 
              onClick={() => fetchEvents()}
            >
              <Search size={18} />
              <span>Search</span>
            </button>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-3 rounded-xl border transition-all duration-300 ${isFilterOpen ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900/40 dark:border-primary-800' : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <Filter size={20} />
            </button>
          </div>
        </div>

        {isFilterOpen && (
          <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            {categories.map(c => {
              const active = (c === 'All' && !category) || c === category;
              return (
                <button
                  key={c}
                  className={`px-6 py-2 rounded-2xl text-sm font-bold border transition-all duration-300 ${active
                    ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-600/30 -translate-y-1'
                    : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-800 hover:border-primary-400'}`}
                  onClick={() => {
                    const next = c === 'All' ? '' : c;
                    setCategory(next);
                    fetchEvents({ category: next });
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Recommendations */}
      {recs.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-primary-600" size={24} />
              <h2 className="text-2xl font-black">Recommendations</h2>
            </div>
            <Link to="/discover" className="text-sm font-bold text-primary-600 hover:underline flex items-center gap-1 group">
              View all <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recs.map((e) => <Card key={e._id} e={e} />)}
          </div>
        </section>
      )}

      {/* All events */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="text-primary-600" size={24} />
              <h2 className="text-2xl font-black">All Events</h2>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? Array.from({length:6}).map((_,i)=><Skeleton key={i} />) : events.map((e) => <Card key={e._id} e={e} />)}
        </div>
        {events.length === 0 && !loading && (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
             <div className="bg-slate-100 dark:bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-slate-400" size={32} />
             </div>
             <h3 className="font-bold text-lg mb-1">No events found</h3>
             <p className="text-slate-500">Try adjusting your search or filters.</p>
          </div>
        )}
      </section>

      {/* Dashboard Stats */}
      {(dash.categories.length > 0 || dash.upcomingByMonth.length > 0) && (
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-primary-600" size={24} />
            <h2 className="text-2xl font-black">Event Insights</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-8 rounded-[2rem]">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black">By Category</h3>
                    <p className="text-sm text-slate-500">Distribution of events across campus segments.</p>
                  </div>
                  <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-2xl text-primary-600 dark:text-primary-400">
                    <Tag size={24} />
                  </div>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {dash.categories.map((c) => (
                    <div key={c._id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-primary-500 transition-colors">
                      <div className="text-2xl font-black text-primary-600 dark:text-primary-400 mb-1">{c.count}</div>
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-500 line-clamp-1">{c._id || 'General'}</div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="glass-card p-8 rounded-[2rem]">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black">Upcoming Events</h3>
                    <p className="text-sm text-slate-500">Events scheduled for the coming months.</p>
                  </div>
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400">
                    <Calendar size={24} />
                  </div>
               </div>
               <div className="space-y-4">
                  {dash.upcomingByMonth.map((m) => (
                    <div key={m._id} className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary-500 group-hover:scale-125 transition-transform" />
                        <span className="font-bold text-slate-700 dark:text-slate-200">{m._id}</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-black">{m.count} EVENTS</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
