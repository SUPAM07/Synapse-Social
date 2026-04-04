import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import EventTicket from '../components/EventTicket.jsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  Plus, 
  Calendar, 
  Clock,
  MapPin, 
  Tag, 
  FileText, 
  Users, 
  Download, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  BarChart3,
  LogOut,
  Ticket,
  ChevronRight,
  TrendingUp,
  Image,
  Layers,
  Settings
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [mine, setMine] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Tech');
  const [description, setDescription] = useState('');
  const [poster, setPoster] = useState(null);
  const [pending, setPending] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [downloadAction, setDownloadAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, type: 'info', message: '' });

  const showToast = (type, message) => {
    setToast({ open: true, type, message });
    setTimeout(() => setToast({ open: false, type: 'info', message: '' }), 3000);
  };

  const downloadTicketDirect = async (registration) => {
    setLoading(true);
    try {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '980px';
      tempDiv.style.padding = '20px';
      document.body.appendChild(tempDiv);

      const event = registration.event;
      const eventDate = new Date(event?.date);

      tempDiv.innerHTML = `
        <div style="width: 980px; padding: 20px; font-family: 'Inter', sans-serif;">
          <div style="display: flex; min-height: 360px; border-radius: 32px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
            <div style="flex: 1; padding: 40px; color: white; background: linear-gradient(135deg, #4c1d95, #7c3aed, #4c1d95);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px;">
                <div>
                  <div style="font-size: 14px; font-weight: 800; letter-spacing: 0.2em; color: #f0abfc; text-transform: uppercase;">EVENT MANAGER</div>
                  <div style="font-size: 12px; color: #c7d2fe; opacity: 0.8;">Official Entry Pass</div>
                </div>
              </div>
              <div style="margin-bottom: 32px;">
                <div style="font-size: 42px; font-weight: 900; letter-spacing: -0.025em; line-height: 1.1;">${event?.title}</div>
                <div style="display: inline-block; background: rgba(255,255,255,0.1); backdrop-blur: 10px; padding: 4px 12px; border-radius: 99px; color: #67e8f9; font-size: 12px; font-weight: 800; margin-top: 12px; text-transform: uppercase; border: 1px border rgba(255,255,255,0.1);">${event?.category}</div>
              </div>
              <div style="display: flex; align-items: end; gap: 40px; margin-bottom: 32px;">
                <div>
                    <div style="font-size: 10px; font-weight: 800; color: #c7d2fe; margin-bottom: 4px; text-transform: uppercase;">Date</div>
                    <div style="font-size: 28px; font-weight: 900;">${eventDate.toLocaleDateString('en-GB')}</div>
                </div>
                <div>
                    <div style="font-size: 10px; font-weight: 800; color: #c7d2fe; margin-bottom: 4px; text-transform: uppercase;">Time</div>
                    <div style="font-size: 28px; font-weight: 900;">${eventDate.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.1em; color: #67e8f9; font-weight: 700; font-size: 12px;">
                ${event?.location}
              </div>
            </div>
            <div style="width: 4px; background: rgba(255,255,255,0.2); position: relative;">
               <div style="position: absolute; top: 0; bottom: 0; left: 0; right: 0; border-left: 2px dashed rgba(255,255,255,0.5);"></div>
            </div>
            <div style="width: 280px; padding: 40px; color: white; background: #1e1b4b; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <div style="background: white; border-radius: 20px; padding: 15px; margin-bottom: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
                ${registration.qrCodeDataUrl ? `<img src="${registration.qrCodeDataUrl}" alt="QR" style="display: block; width: 140px; height: 140px;" />` : ''}
              </div>
              <div style="text-align: center;">
                <div style="font-weight: 800; font-size: 14px; margin-bottom: 4px;">SCAN FOR ENTRY</div>
                <div style="font-size: 10px; color: #94a3b8; letter-spacing: 0.05em;">NON-TRANSFERABLE</div>
              </div>
              <div style="margin-top: auto; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); width: 100%; text-align: center; font-size: 10px; color: #64748b;">
                TICKET #${registration._id.slice(-6).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      `;

      await new Promise(resolve => setTimeout(resolve, 1000));
      const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = 297, pageHeight = 210, margin = 15;
      const contentWidth = pageWidth - (margin * 2), contentHeight = pageHeight - (margin * 2);
      const imgWidth = contentWidth, imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', margin, margin + (contentHeight - imgHeight) / 2, imgWidth, imgHeight);
      pdf.save(`${event?.title?.replace(/[^a-zA-Z0-9]/g, '_')}_ticket.pdf`);
      document.body.removeChild(tempDiv);
      showToast('success', 'Ticket downloaded successfully!');
    } catch (error) {
      showToast('error', 'Failed to generate ticket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role === 'customer') loadMyRegs();
    if (user.role === 'organizer') loadMyEvents();
    if (user.role === 'admin') loadPending();
  }, [user]);

  async function loadMyRegs() { const res = await axios.get('/api/registrations/me'); setMine(res.data.registrations || []); }
  async function loadMyEvents() { const res = await axios.get('/api/events', { params: { organizer: user.id } }); setMine(res.data.events || []); }
  async function loadPending() { const res = await axios.get('/api/events', { params: { status: 'pending' } }); setPending(res.data.events || []); }
  async function loadParticipants(eventId) { const res = await axios.get(`/api/registrations/${eventId}/participants`); setParticipants(res.data.participants || []); }

  async function exportCsv(eventId) {
    try {
      const res = await axios.get(`/api/registrations/${eventId}/participants.csv`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `participants-${eventId}.csv`; a.click();
      window.URL.revokeObjectURL(url);
      showToast('success', 'CSV exported successfully!');
    } catch (e) { showToast('error', 'Failed to export CSV.'); }
  }

  async function createEvent(e) {
    e.preventDefault();
    setLoading(true);
    try {
        const fd = new FormData();
        fd.append('title', title); fd.append('date', date); fd.append('location', location);
        fd.append('category', category); fd.append('description', description);
        if (poster) fd.append('poster', poster);
        await axios.post('/api/events', fd);
        setTitle(''); setDate(''); setLocation(''); setDescription(''); setPoster(null);
        await loadMyEvents();
        showToast('success', 'Event submitted for approval!');
    } catch (error) { showToast('error', 'Failed to create event.'); }
    finally { setLoading(false); }
  }

  async function approve(id) { await axios.post(`/api/admin/events/${id}/approve`); await loadPending(); showToast('success', 'Event approved.'); }
  async function reject(id) { await axios.post(`/api/admin/events/${id}/reject`); await loadPending(); showToast('info', 'Event rejected.'); }

  const analytics = useMemo(() => {
    const byStatus = mine.reduce((acc,e)=>{ acc[e.status]=(acc[e.status]||0)+1; return acc; },{});
    const byCategory = mine.reduce((acc,e)=>{ acc[e.category]=(acc[e.category]||0)+1; return acc; },{});
    return { byStatus, byCategory };
  }, [mine]);

  return (
    <div className="space-y-8 pb-20">
      {toast.open && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-300 ${
          toast.type==='error' ? 'bg-rose-500/90 border-rose-400 text-white' : 
          toast.type==='success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : 
          'bg-indigo-600/90 border-indigo-500 text-white'}`}>
          {toast.type==='success' ? <CheckCircle size={20} /> : toast.type==='error' ? <XCircle size={20} /> : <FileText size={20} />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-8 rounded-[2rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-primary-500/10 -rotate-12 translate-x-4">
           <Layers size={160} />
        </div>
        <div className="relative space-y-1">
          <div className="text-xs font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-2">Welcome Dashboard</div>
          <h1 className="text-3xl font-black">Hi, {user?.name}!</h1>
          <p className="text-slate-500 dark:text-slate-400">You are logged in as <span className="font-bold text-slate-700 dark:text-white uppercase">{user?.role}</span></p>
        </div>
        <div className="relative flex items-center gap-3">
           <button className="btn-outline !rounded-2xl flex gap-2 items-center group">
              <Settings size={18} className="group-hover:rotate-45 transition-transform" />
              <span>Settings</span>
           </button>
           <button onClick={logout} className="btn !rounded-2xl !bg-slate-900 dark:!bg-white dark:!text-slate-900 border-none flex gap-2 items-center group">
              <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
              <span>Logout</span>
           </button>
        </div>
      </div>

      {/* CUSTOMER VIEW */}
      {user?.role === 'customer' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-2xl text-primary-600">
                <Ticket size={24} />
             </div>
             <h2 className="text-2xl font-black">My Registrations</h2>
          </div>
          
          {mine.length === 0 ? (
            <div className="glass-card p-20 text-center rounded-[2rem]">
                <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Ticket size={40} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">No tickets yet</h3>
                <p className="text-slate-500 mb-8 max-w-xs mx-auto">Explore events on the home page and register to see your tickets here.</p>
                <Link to="/" className="btn !px-8">Browse Events</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mine.map((r) => (
              <div key={r._id} className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 rounded-3xl group">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <div className="absolute inset-0 bg-primary-600 rounded-2xl rotate-3 group-hover:rotate-6 transition-transform"></div>
                  <div className="absolute inset-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-lg">
                    {r.qrCodeDataUrl ? (
                      <img src={r.qrCodeDataUrl} className="w-20 h-20 p-2" alt="QR" />
                    ) : <Ticket size={40} className="text-slate-200" />}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="font-black text-xl leading-tight line-clamp-1">{r.event?.title}</div>
                  <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-primary-500" /> {new Date(r.event?.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary-500" /> {r.event?.location}</span>
                  </div>
                  <div className="pt-4 flex flex-wrap gap-2">
                    <button onClick={() => setSelectedTicket(r)} className="btn !py-2 !px-4 text-xs !rounded-xl gap-2">
                      <FileText size={14} /> View Pass
                    </button>
                    <button onClick={() => downloadTicketDirect(r)} className="btn-outline !py-2 !px-4 text-xs !rounded-xl gap-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors">
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ORGANIZER VIEW */}
      {user?.role === 'organizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Create Form */}
          <div className="lg:col-span-5 glass-card p-8 rounded-[2rem] space-y-8">
            <div className="flex items-center justify-between">
               <h2 className="text-2xl font-black">Create Event</h2>
               <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-emerald-600">
                  <Plus size={24} />
               </div>
            </div>
            <form onSubmit={createEvent} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Event Title</label>
                <input className="input" placeholder="e.g. MERN Stack Workshop" required value={title} onChange={(e)=>setTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Date & Time</label>
                  <input className="input" type="datetime-local" required value={date} onChange={(e)=>setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Category</label>
                  <select className="input" value={category} onChange={(e)=>setCategory(e.target.value)}>
                    <option>Tech</option><option>Sports</option><option>Cultural</option><option>Workshop</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Location</label>
                <div className="relative">
                   <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input className="input pl-10" placeholder="e.g. Auditorium B" required value={location} onChange={(e)=>setLocation(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Description</label>
                <textarea className="input min-h-[140px] resize-none" placeholder="What is this event about?" required value={description} onChange={(e)=>setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Poster Image</label>
                <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Image size={24} className="text-slate-400 mb-2" />
                            <p className="text-xs text-slate-500"><span className="font-bold">Click to upload</span> or drag and drop</p>
                        </div>
                        <input type="file" className="hidden" onChange={(e)=>setPoster(e.target.files[0])} />
                    </label>
                </div>
                {poster && <div className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle size={12}/> {poster.name} selected</div>}
              </div>
              <button disabled={loading} className="btn w-full !rounded-2xl !py-4 shadow-primary-600/40 disabled:opacity-50">
                {loading ? <Loader2 size={24} className="animate-spin" /> : 'Publish Event'}
              </button>
            </form>
          </div>

          {/* Organizer Stats & Lists */}
          <div className="lg:col-span-7 space-y-8">
            <div className="glass-card p-8 rounded-[2rem]">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-2xl font-black">Performance</h2>
                 <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600">
                    <BarChart3 size={24} />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 rounded-3xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50">
                    <div className="text-3xl font-black text-primary-600 dark:text-primary-400">{mine.length}</div>
                    <div className="text-xs font-black uppercase tracking-widest text-primary-700/60 dark:text-primary-300/60">Total Events</div>
                 </div>
                 <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{analytics.byStatus['approved'] || 0}</div>
                    <div className="text-xs font-black uppercase tracking-widest text-emerald-700/60 dark:text-emerald-300/60">Live Now</div>
                 </div>
              </div>
            </div>

            <div className="glass-card p-8 rounded-[2rem] space-y-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-black">Managed Events</h2>
              </div>
              {mine.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No events created yet.</div>
              ) : (
                <div className="space-y-4">
                  {mine.map((e) => (
                    <div key={e._id} className="p-5 border border-slate-100 dark:border-slate-800 rounded-3xl group hover:shadow-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="font-bold text-lg leading-tight">{e.title}</div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                           <span className={`px-2 py-0.5 rounded-full ${e.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{e.status}</span>
                           <span className="text-slate-400">•</span>
                           <span className="text-slate-500">{new Date(e.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                         onClick={()=>{setSelectedEvent(e._id);loadParticipants(e._id);}}
                         className={`btn-outline !py-2 !px-4 text-xs !rounded-xl transition-colors ${selectedEvent === e._id ? 'bg-primary-600 text-white border-primary-600' : ''}`}
                        >
                          <Users size={14} className="mr-1.5 inline" /> Participants
                        </button>
                        <button onClick={()=>exportCsv(e._id)} className="btn !py-2 !px-4 text-xs !rounded-xl gap-1.5 !bg-indigo-600">
                          <Download size={14} /> Export
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedEvent && (
              <div className="glass-card p-8 rounded-[2rem] space-y-6 animate-in slide-in-from-right-4 duration-300 shadow-xl border-primary-200 dark:border-primary-900 shadow-primary-500/10">
                <div className="flex items-center justify-between">
                   <h2 className="text-xl font-black flex items-center gap-2">
                     <Users size={20} className="text-primary-600" /> Participant List
                   </h2>
                   <button onClick={() => setSelectedEvent('')} className="text-slate-400 hover:text-slate-600 p-1">×</button>
                </div>
                {participants.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-400 italic text-sm font-medium">No registrations yet for this event</div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {participants.map(a => (
                      <div key={a._id} className="py-3 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                             {a.user?.name?.charAt(0)}
                           </div>
                           <div>
                              <div className="font-bold text-sm tracking-tight">{a.user?.name}</div>
                              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{a.user?.email}</div>
                           </div>
                        </div>
                        <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${a.status === 'registered' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'}`}>
                           {a.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN VIEW */}
      {user?.role === 'admin' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600">
                <CheckCircle size={24} />
             </div>
             <h2 className="text-2xl font-black">Pending Verifications</h2>
          </div>
          
          {pending.length === 0 ? (
             <div className="glass-card p-20 text-center rounded-[2rem]">
                 <div className="bg-emerald-50 dark:bg-emerald-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} className="text-emerald-500" />
                 </div>
                 <h3 className="text-xl font-bold mb-2">All caught up!</h3>
                 <p className="text-slate-500">There are no events waiting for approval.</p>
             </div>
          ) : (
            <div className="space-y-4">
              {pending.map((e) => (
                <div key={e._id} className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-3xl group">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400">
                        <Calendar size={32} />
                     </div>
                     <div className="space-y-1">
                        <div className="font-black text-xl tracking-tight leading-none mb-2">{e.title}</div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-slate-500 uppercase tracking-widest">
                           <span className="flex items-center gap-1.5"><Users size={14}/> {e.organizer?.name}</span>
                           <span className="flex items-center gap-1.5"><Clock size={14}/> {new Date(e.date).toLocaleDateString()}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={()=>approve(e._id)} className="btn !py-2.5 flex-1 md:flex-none md:w-32 !rounded-xl gap-2 !bg-emerald-600 shadow-emerald-500/20">
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button onClick={()=>reject(e._id)} className="btn-outline !py-2.5 flex-1 md:flex-none md:w-32 !rounded-xl gap-2 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-rose-500">
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-2xl text-primary-600">
                      <Ticket size={24} />
                   </div>
                   <h3 className="text-2xl font-black">Electronic Entry Pass</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => downloadAction && downloadAction()}
                    disabled={loading}
                    className="btn !py-2.5 !px-5 !rounded-2xl gap-2 shadow-primary-600/30"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <XCircle size={24} />
                  </button>
                </div>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <EventTicket 
                  registration={selectedTicket} 
                  user={user}
                  onReady={(fn) => setDownloadAction(() => fn)}
                  onDownload={() => showToast('success', 'Pass downloaded!')}
                />
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 italic">
                 <p>Scan this QR code at the event entrance for verification.</p>
                 <p>Ticket ID: {selectedTicket._id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
