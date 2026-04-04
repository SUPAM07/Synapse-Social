import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [toast, setToast] = useState({ open: false, type: 'info', message: '' });

  const showToast = (type, message) => {
    setToast({ open: true, type, message });
    setTimeout(() => setToast({ open: false, type: 'info', message: '' }), 5000);
  };

  useEffect(() => {
    load();
  }, [id, user]);

  async function load() {
    const [e, r] = await Promise.all([
      axios.get(`/api/events/${id}`),
      axios.get(`/api/reviews/${id}`),
    ]);
    setEvent(e.data.event);
    setReviews(r.data.reviews || []);
    
    // Check if current user has already reviewed this event
    if (user) {
      const userReview = r.data.reviews?.find(review => review.user?._id === user.id);
      setHasReviewed(!!userReview);
    }
  }

  async function register() {
    await axios.post(`/api/registrations/${id}/register`);
    showToast('success', 'Registered! Check your email for confirmation.');
  }

  function shareEvent() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: event.title, text: event.description, url }).catch(()=>{});
    } else {
      navigator.clipboard.writeText(url); alert('Event link copied!');
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
      console.log('Submitting review:', { rating, comment, eventId: id, user: user?.id });
      console.log('Auth token:', axios.defaults.headers.common.Authorization);
      
      const response = await axios.post(`/api/reviews/${id}`, { rating, comment });
      console.log('Review submitted successfully:', response.data);
      showToast('success', 'Review posted successfully!');
      setComment('');
      await load();
    } catch (error) {
      console.error('Review submission error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 401) {
        showToast('warning', 'Please log in to post a review.');
      } else if (error.response?.status === 400 && error.response?.data?.message?.includes('reviewed')) {
        showToast('info', 'You have already reviewed this event.');
      } else {
        showToast('error', `Failed to post review: ${error.response?.data?.message || 'Please try again.'}`);
      }
    }
  }

  if (!event) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast.open && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type==='success'?'bg-green-600':toast.type==='warning'?'bg-yellow-600':toast.type==='error'?'bg-red-600':'bg-blue-600'}`}>
          <div className="flex items-start gap-3">
            <span className="font-semibold capitalize">{toast.type}</span>
            <span className="opacity-90">{toast.message}</span>
            <button className="ml-4 opacity-80 hover:opacity-100" onClick={()=>setToast({ ...toast, open:false })}>×</button>
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <img src={event.posterUrl || '/placeholder.svg'} className="w-full h-64 object-cover rounded-xl" />
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="text-slate-700 mt-2 dark:text-slate-300">{event.description}</p>
          <div className="text-sm text-slate-500 mt-2 dark:text-slate-400">{new Date(event.date).toLocaleString()} • {event.location}</div>
          <div className="flex gap-2 mt-3">
            <button className="btn" onClick={register} disabled={!user}>Register</button>
            <button className="btn-outline" onClick={shareEvent}>Share</button>
            <button className="btn-outline" onClick={downloadIcs}>Add to Calendar</button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <h2 className="font-semibold mb-2">Reviews</h2>
        {user && !hasReviewed && (
          <div className="flex items-center gap-2 mb-3">
            <select className="input" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <input className="input flex-1" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience" />
            <button className="btn" onClick={submitReview} disabled={!comment.trim()}>Post</button>
          </div>
        )}

        {user && hasReviewed && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-3">
            <p className="text-green-800 dark:text-green-200 text-sm">✅ You have already reviewed this event.</p>
          </div>
        )}
        <ul className="space-y-2">
          {reviews.map((r) => (
            <li key={r._id} className="p-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <div className="text-sm text-slate-500 dark:text-slate-400">{r.user?.name} • {new Date(r.createdAt).toLocaleString()}</div>
              <div>⭐ {r.rating}</div>
              <p className="text-slate-700 dark:text-slate-200">{r.comment}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
