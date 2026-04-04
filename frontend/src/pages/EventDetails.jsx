import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Calendar, 
  MapPin, 
  Share2, 
  ChevronLeft, 
  ChevronRight,
  Star, 
  MessageSquare, 
  CheckCircle, 
  Download,
  Clock,
  Tag,
  ShieldCheck,
  Award,
  Sparkles
} from 'lucide-react';

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, type: 'info', message: '' });

  const showToast = (type, message) => {
    setToast({ open: true, type, message });
    setTimeout(() => setToast({ open: false, type: 'info', message: '' }), 5000);
  };

  const load = useCallback(async function load() {
    setLoading(true);
    try {
      const [e, r] = await Promise.all([
        axios.get(`/api/events/${id}`),
        axios.get(`/api/reviews/${id}`),
      ]);
      setEvent(e.data.event);
      setReviews(r.data.reviews || []);
      
      if (user) {
        const userReview = r.data.reviews?.find(review => review.user?._id === user.id);
        setHasReviewed(!!userReview);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  async function register() {
    try {
      await axios.post(`/api/registrations/${id}/register`);
      showToast('success', 'Registration successful! View your ticket in the Dashboard.');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Registration failed.');
    }
  }

  function shareEvent() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: event.title, text: event.description, url }).catch(()=>{});
    } else {
      navigator.clipboard.writeText(url);
      showToast('info', 'Link copied to clipboard!');
    }
  }

  function downloadIcs() {
    const start = new Date(event.date);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//CampusEvents//EN\nBEGIN:VEVENT\nUID:${event._id}@campus\nDTSTAMP:${start.toISOString().replace(/[-:]/g,'').split('.')[0]}Z\nDTSTART:${start.toISOString().replace(/[-:]/g,'').split('.')[0]}Z\nDTEND:${end.toISOString().replace(/[-:]/g,'').split('.')[0]}Z\nSUMMARY:${event.title}\nDESCRIPTION:${event.description}\nLOCATION:${event.location}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${event.title}.ics`; a.click(); URL.revokeObjectURL(url);
  }

  async function submitReview() {
    try {
      await axios.post(`/api/reviews/${id}`, { rating, comment });
      showToast('success', 'Thank you for your feedback!');
      setComment('');
      await load();
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to post review.');
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Event Details...</p>
    </div>
  );

  if (!event) return (
    <div className="text-center py-40">
      <h1 className="text-2xl font-black mb-4 text-slate-400">Event Not Found</h1>
      <Link to="/" className="btn">Return Home</Link>
    </div>
  );

  return (
    <div className="space-y-12 pb-20 max-w-5xl mx-auto">
      {/* Toast */}
      {toast.open && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-300 ${
          toast.type==='error' ? 'bg-rose-500/90 border-rose-400 text-white' : 
          toast.type==='success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : 
          'bg-indigo-600/90 border-indigo-500 text-white'}`}>
          {toast.type==='success' ? <CheckCircle size={20} /> : <MessageSquare size={20} />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Navigation */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors group">
         <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
         Back to Events
      </Link>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Left Column: Image & Basic Info */}
        <div className="lg:col-span-12 space-y-8">
            <div className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl">
               <img src={event.posterUrl || '/placeholder.svg'} className="w-full h-[400px] object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
               <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="space-y-2">
                     <span className="badge bg-primary-600 text-white border-none px-4 py-1.5 uppercase font-black tracking-widest">{event.category}</span>
                     <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{event.title}</h1>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl text-white text-center min-w-[80px]">
                        <div className="text-2xl font-black">{new Date(event.date).getDate()}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-70">{new Date(event.date).toLocaleString('default', { month: 'short' })}</div>
                     </div>
                  </div>
               </div>
            </div>
        </div>

        {/* Content Section */}
        <div className="lg:col-span-8 space-y-12">
          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl text-primary-600">
                   <Tag size={20} />
                </div>
                <h2 className="text-2xl font-black">About the Event</h2>
             </div>
             <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300">
               {event.description}
             </p>
          </section>

          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600">
                   <Star size={20} />
                </div>
                <h2 className="text-2xl font-black">Community Reviews</h2>
             </div>
             
             {user && !hasReviewed && (
               <div className="glass-card p-6 rounded-3xl space-y-4">
                  <div className="font-bold flex items-center gap-2">Leave a review <Sparkles size={16} className="text-amber-500" /></div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                       {[1,2,3,4,5].map(n => (
                         <button 
                           key={n} 
                           onClick={() => setRating(n)}
                           className={`p-1 transition-all ${rating >= n ? 'text-amber-500 scale-110' : 'text-slate-300 dark:text-slate-700'}`}
                         >
                           <Star size={24} fill={rating >= n ? 'currentColor' : 'none'} />
                         </button>
                       ))}
                    </div>
                    <input 
                      className="input flex-1" 
                      value={comment} 
                      onChange={(e) => setComment(e.target.value)} 
                      placeholder="What was your experience?" 
                    />
                    <button className="btn !py-2.5 !rounded-xl" onClick={submitReview} disabled={!comment.trim()}>Post</button>
                  </div>
               </div>
             )}

             {reviews.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 italic">
                  No reviews yet. Be the first to share!
                </div>
             ) : (
               <div className="grid gap-4">
                 {reviews.map((r) => (
                   <div key={r._id} className="glass-card p-6 rounded-3xl space-y-3 hover:-translate-y-1 transition-transform">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center font-black text-primary-700">
                              {r.user?.name?.charAt(0)}
                           </div>
                           <div>
                              <div className="font-bold text-sm">{r.user?.name}</div>
                              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 font-black">
                           <Star size={14} fill="currentColor" />
                           <span>{r.rating}</span>
                        </div>
                     </div>
                     <p className="text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
                        "{r.comment}"
                     </p>
                   </div>
                 ))}
               </div>
             )}
          </section>
        </div>

        {/* Sidebar Info & Controls */}
        <div className="lg:col-span-4 space-y-6">
           <div className="glass-card p-8 rounded-[2rem] sticky top-28 space-y-8">
              <div className="space-y-6">
                 <div className="flex items-center gap-4 group">
                    <div className="p-3 rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 group-hover:scale-110 transition-transform">
                       <Clock size={20} />
                    </div>
                    <div>
                       <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time & Date</div>
                       <div className="font-bold">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                       <div className="text-sm font-medium text-slate-500">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-4 group">
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 group-hover:scale-110 transition-transform">
                       <MapPin size={20} />
                    </div>
                    <div>
                       <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</div>
                       <div className="font-bold">{event.location}</div>
                       <div className="text-sm font-medium text-slate-500">Official Campus Venue</div>
                    </div>
                 </div>

                 <div className="flex items-center gap-4 group">
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 group-hover:scale-110 transition-transform">
                       <Award size={20} />
                    </div>
                    <div>
                       <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Average Rating</div>
                       <div className="font-bold flex items-center gap-1.5">
                          {event.averageRating?.toFixed(1) || 'No ratings'}
                          {event.averageRating && <Star size={16} fill="currentColor" />}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                 <button 
                   onClick={register} 
                   disabled={!user || event.status !== 'approved'} 
                   className="btn w-full !py-4 shadow-primary-600/40 disabled:opacity-50 disabled:grayscale group"
                 >
                    {user ? (event.status === 'approved' ? 'Register Now' : 'Closed') : 'Login to Register'}
                    <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
                 </button>
                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={shareEvent} className="btn-outline !py-3 !rounded-2xl gap-2 text-xs">
                       <Share2 size={16} /> Share
                    </button>
                    <button onClick={downloadIcs} className="btn-outline !py-3 !rounded-2xl gap-2 text-xs">
                       <Calendar size={16} /> Add Cal
                    </button>
                 </div>
              </div>

              <div className="pt-6">
                 <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <ShieldCheck className="text-primary-600" size={24} />
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight">
                       Secure Verification with <br /> <span className="text-primary-600 font-black">Electronic Passes</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
