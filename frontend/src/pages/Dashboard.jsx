import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import EventTicket from '../components/EventTicket.jsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const [toast, setToast] = useState({ open: false, type: 'info', message: '' });

  const showToast = (type, message) => {
    setToast({ open: true, type, message });
    setTimeout(() => setToast({ open: false, type: 'info', message: '' }), 3000);
  };

  const downloadTicketDirect = async (registration) => {
    try {
      // Create a temporary div to render the ticket
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '980px';
      tempDiv.style.padding = '20px';
      document.body.appendChild(tempDiv);

      // Render the ticket HTML directly
      const event = registration.event;
      const eventDate = new Date(event?.date);
      const registrationDate = new Date(registration.createdAt);

      tempDiv.innerHTML = `
        <div style="width: 980px; padding: 20px;">
          <div style="display: flex; min-height: 360px; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
            <!-- Left main area -->
            <div style="flex: 1; padding: 32px; color: white; background: linear-gradient(135deg, #3730a3, #7c3aed, #3730a3);">
              <!-- Top brand row -->
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                <div>
                  <div style="font-size: 14px; letter-spacing: 0.1em; color: #f0abfc;">EVENT MANAGER</div>
                  <div style="font-size: 12px; color: #c7d2fe;">Official Event Ticket</div>
                </div>
              </div>
              
              <!-- Event title -->
              <div style="margin-bottom: 24px;">
                <div style="font-size: 36px; font-weight: 800; letter-spacing: 0.025em;">${event?.title}</div>
                <div style="color: #67e8f9; font-weight: 600; margin-top: 4px;">${event?.category} EVENT</div>
              </div>
              
              <!-- Big date/time row -->
              <div style="display: flex; align-items: end; gap: 32px; margin-bottom: 24px;">
                <div style="font-size: 30px; font-weight: 800; letter-spacing: 0.025em;">${eventDate.toLocaleDateString('en-GB')}</div>
                <div style="font-size: 30px; font-weight: 800; letter-spacing: 0.025em;">${eventDate.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}</div>
              </div>
              <div style="text-transform: uppercase; letter-spacing: 0.1em; color: #67e8f9; margin-bottom: 24px;">${event?.location}</div>
              
              <!-- Barcode -->
              <div style="display: flex; align-items: center;">
                <div style="height: 64px; width: 224px; background: repeating-linear-gradient(90deg, #fff 0, #fff 2px, transparent 2px, transparent 4px); border-radius: 4px;"></div>
              </div>
            </div>
            
            <!-- Perforation divider -->
            <div style="width: 2px; background: rgba(255,255,255,0.4); position: relative;">
              <div style="position: absolute; top: 24px; bottom: 24px; left: 0; right: 0; border-left: 2px dashed rgba(255,255,255,0.7);"></div>
            </div>
            
            <!-- Right stub -->
            <div style="width: 256px; padding: 24px; color: white; background: linear-gradient(to bottom, #312e81, #1e40af); display: flex; flex-direction: column;">
              <!-- Vertical date/time -->
              <div style="color: #67e8f9; font-size: 16px; font-weight: 700; margin-bottom: 20px; writing-mode: vertical-rl; text-orientation: mixed; letter-spacing: 2px; text-shadow: 0 0 10px rgba(103, 232, 249, 0.5);">
                ${eventDate.getDate().toString().padStart(2, '0')} ${(eventDate.getMonth() + 1).toString().padStart(2, '0')} ${eventDate.getFullYear()} • ${eventDate.getHours().toString().padStart(2, '0')} ${eventDate.getMinutes().toString().padStart(2, '0')}
              </div>
              
              <!-- QR -->
              <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 12px; margin-bottom: 16px; text-align: center;">
                <div style="color: #c7d2fe; font-size: 14px; margin-bottom: 8px;">ENTRY QR</div>
                ${registration.qrCodeDataUrl ? `<img src="${registration.qrCodeDataUrl}" alt="QR" style="margin: 0 auto; width: 144px; height: 144px; border-radius: 6px; background: white; padding: 4px;" />` : ''}
              </div>
              
              <!-- Footer small -->
              <div style="margin-top: auto; text-align: center; font-size: 10px; color: rgba(199, 210, 254, 0.8);">
                <div style="font-weight: 600;">EventManager</div>
                <div>© 2025 All rights reserved</div>
                <div style="opacity: 0.7;">www.eventmanager.com</div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        padding: 20
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = pageHeight - (margin * 2);
      
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const x = margin;
      const y = margin + (contentHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

      const fileName = `${event?.title?.replace(/[^a-zA-Z0-9]/g, '_')}_ticket.pdf`;
      pdf.save(fileName);
      
      // Clean up
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role === 'customer') loadMyRegs();
    if (user.role === 'organizer') loadMyEvents();
    if (user.role === 'admin') loadPending();
  }, [user]);

  async function loadMyRegs() {
    const res = await axios.get('/api/registrations/me');
    setMine(res.data.registrations || []);
  }

  async function loadMyEvents() {
    const res = await axios.get('/api/events', { params: { organizer: user.id } });
    setMine(res.data.events || []);
  }

  async function loadPending() {
    const res = await axios.get('/api/events', { params: { status: 'pending' } });
    setPending(res.data.events || []);
  }

  async function loadParticipants(eventId) {
    const res = await axios.get(`/api/registrations/${eventId}/participants`);
    setParticipants(res.data.participants || []);
  }

  async function exportCsv(eventId) {
    // Check if participants exist first
    try {
      const check = await axios.get(`/api/registrations/${eventId}/participants`);
      const list = check.data.participants || [];
      if (!Array.isArray(list) || list.length === 0) {
        showToast('error', 'No participants available for this event.');
        return;
      }
    } catch (e) {
      // If the check fails, show error and abort
      showToast('error', 'Unable to fetch participants. Please try again.');
      return;
    }

    const res = await axios.get(`/api/registrations/${eventId}/participants.csv`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url; a.download = `participants-${eventId}.csv`; a.click();
    window.URL.revokeObjectURL(url);
  }

  async function createEvent(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', title);
    fd.append('date', date);
    fd.append('location', location);
    fd.append('category', category);
    fd.append('description', description);
    if (poster) fd.append('poster', poster);
    await axios.post('/api/events', fd);
    setTitle(''); setDate(''); setLocation(''); setDescription(''); setPoster(null);
    await loadMyEvents();
  }

  async function approve(id) { await axios.post(`/api/admin/events/${id}/approve`); await loadPending(); }
  async function reject(id) { await axios.post(`/api/admin/events/${id}/reject`); await loadPending(); }

  const analytics = useMemo(() => {
    // Simple mini-analytics: count by status and category
    const byStatus = mine.reduce((acc,e)=>{ acc[e.status]=(acc[e.status]||0)+1; return acc; },{});
    const byCategory = mine.reduce((acc,e)=>{ acc[e.category]=(acc[e.category]||0)+1; return acc; },{});
    return { byStatus, byCategory };
  }, [mine]);

  return (
    <div className="space-y-4">
      {toast.open && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white ${toast.type==='error'?'bg-red-600':toast.type==='success'?'bg-green-600':'bg-blue-600'}`}>
          {toast.message}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <span>{user?.name} ({user?.role})</span>
          <button className="underline" onClick={logout}>Logout</button>
        </div>
      </div>

      {user?.role === 'customer' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 w-full">
          <h2 className="font-semibold mb-4">My Registrations</h2>
          {mine.length === 0 ? (
            <div className="mt-6 grid grid-cols-12 gap-4">
              <div className="col-span-12 text-sm text-slate-500 italic p-8 text-center border rounded-xl w-full">
                No registrations found yet.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mine.map((r) => (
              <div key={r._id} className="p-4 border rounded-xl hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-lg">{r.event?.title}</div>
                    <div className="text-sm text-slate-500 mt-1">
                      {new Date(r.event?.date).toLocaleDateString()} • {r.event?.location}
                    </div>
                    <div className="text-sm text-slate-500">
                      Status: <span className={`font-medium ${
                        r.status === 'registered' ? 'text-green-600' : 'text-yellow-600'
                      }`}>{r.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {r.qrCodeDataUrl && (
                      <img src={r.qrCodeDataUrl} className="h-16 w-16 border rounded-lg" alt="QR Code" />
                    )}
                    <button
                      onClick={() => setSelectedTicket(r)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      View Ticket
                    </button>
                    <button
                      onClick={() => downloadTicketDirect(r)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      📥 Download
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      )}

      {user?.role === 'organizer' && (
        <div className="grid md:grid-cols-2 gap-4 w-full">
          <form onSubmit={createEvent} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
            <h2 className="font-semibold">Create Event</h2>
            <div className="space-y-1">
              <label className="text-sm text-slate-600">Title</label>
              <input className="input w-full" placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-600">Date & Time</label>
              <input className="input w-full" type="datetime-local" value={date} onChange={(e)=>setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-600">Location</label>
              <input className="input w-full" placeholder="Location" value={location} onChange={(e)=>setLocation(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-600">Category</label>
              <select className="input w-full" value={category} onChange={(e)=>setCategory(e.target.value)}>
                <option>Tech</option><option>Sports</option><option>Cultural</option><option>Workshop</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-600">Description</label>
              <textarea className="input w-full min-h-[120px]" rows="5" placeholder="Describe the event in detail" value={description} onChange={(e)=>setDescription(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-600">Poster</label>
              <input className="input w-full" type="file" onChange={(e)=>setPoster(e.target.files[0])} />
            </div>
            <div className="flex justify-end">
              <button className="btn">Publish</button>
            </div>
          </form>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <h2 className="font-semibold mb-2">Analytics</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="font-medium mb-1">By Status</div>
                  <ul className="space-y-1">{Object.entries(analytics.byStatus).map(([k,v])=> <li key={k} className="flex justify-between"><span>{k}</span><span className="font-semibold">{v}</span></li>)}</ul>
                </div>
                <div>
                  <div className="font-medium mb-1">By Category</div>
                  <ul className="space-y-1">{Object.entries(analytics.byCategory).map(([k,v])=> <li key={k} className="flex justify-between"><span>{k}</span><span className="font-semibold">{v}</span></li>)}</ul>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <h2 className="font-semibold mb-2">My Events</h2>
              <ul className="space-y-2">
                {mine.map((e) => (
                  <li key={e._id} className="p-3 border rounded-xl grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-9">
                      <div className="font-medium">{e.title}</div>
                      <div className="text-sm text-slate-500">Status: {e.status}</div>
                    </div>
                    <div className="col-span-3 justify-self-end grid grid-cols-1 gap-2 justify-items-end">
                      <button className="btn-outline w-24 px-3 py-1 text-xs" onClick={()=>{setSelectedEvent(e._id);loadParticipants(e._id);}}>Participants</button>
                      <button className="btn w-24 px-3 py-1 text-xs" onClick={()=>exportCsv(e._id)}>Export CSV</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {selectedEvent && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <h2 className="font-semibold mb-2">Participants</h2>
                {participants.length === 0 ? (
                  <div className="text-sm text-slate-500 italic p-4 text-center border rounded-lg">No participants found</div>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {participants.map(a => (
                      <li key={a._id} className="flex items-center justify-between p-2 border rounded-lg">
                        <span>{a.user?.name} ({a.user?.email})</span>
                        <span className="text-slate-500">{a.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 w-full">
          <h2 className="font-semibold mb-2">Pending Events</h2>
          <ul className="space-y-2">
            {pending.map((e) => (
              <li key={e._id} className="p-3 border rounded-xl grid grid-cols-12 gap-3 items-center">
                <div className="col-span-9">
                  <div className="font-medium">{e.title}</div>
                  <div className="text-sm text-slate-500">Organizer: {e.organizer?.name}</div>
                </div>
                <div className="col-span-3 justify-self-end grid grid-cols-2 gap-2">
                  <button className="btn w-24 px-3 py-1 text-xs" onClick={()=>approve(e._id)}>Approve</button>
                  <button className="btn-outline w-24 px-3 py-1 text-xs" onClick={()=>reject(e._id)}>Reject</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Event Ticket</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadAction && downloadAction()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    📥 Download Ticket
                  </button>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
              <EventTicket 
                registration={selectedTicket} 
                user={user}
                onReady={(fn) => setDownloadAction(() => fn)}
                onDownload={() => {
                  // Optional: Show success message or close modal
                  console.log('Ticket downloaded successfully');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
