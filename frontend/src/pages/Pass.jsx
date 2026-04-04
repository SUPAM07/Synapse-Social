import { useEffect, useState } from 'react';
import axios from 'axios';
import { Ticket, Info, WifiOff, MapPin, Calendar, Clock } from 'lucide-react';

export default function Pass() {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    (async () => { 
      try {
        const r = await axios.get('/api/registrations/me'); 
        setRegs(r.data.registrations||[]); 
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })(); 
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading your passes...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="space-y-4 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-4">
             <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-2xl text-primary-600">
                <Ticket size={24} />
             </div>
             <h1 className="text-3xl font-black tracking-tight">Offline Entry Passes</h1>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl max-w-2xl flex items-center gap-3">
             <WifiOff size={24} className="text-amber-600 flex-shrink-0" />
             <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
               <span className="font-bold">Offline Ready:</span> Open this page once while connected. Your passes will remain available even without an internet connection.
             </p>
          </div>
      </div>

      {regs.length === 0 ? (
        <div className="glass-card p-20 text-center rounded-[2.5rem]">
            <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ticket size={40} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">No passes found</h3>
            <p className="text-slate-500">You haven't registered for any events yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {regs.map(r => (
            <div key={r._id} className="glass-card p-0 overflow-hidden flex flex-col sm:flex-row rounded-[2rem] group hover:shadow-2xl transition-all">
              <div className="sm:w-1/3 bg-slate-900 dark:bg-slate-800 p-6 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-800">
                 <div className="bg-white p-2 rounded-2xl shadow-inner group-hover:scale-105 transition-transform duration-300">
                    {r.qrCodeDataUrl ? (
                      <img src={r.qrCodeDataUrl} alt="QR" className="w-32 h-32" />
                    ) : <Ticket size={64} className="text-slate-200" />}
                 </div>
              </div>
              <div className="flex-1 p-8 space-y-4">
                <div className="space-y-1">
                   <div className="text-[10px] font-black uppercase tracking-widest text-primary-600">Event Pass</div>
                   <h2 className="text-xl font-black line-clamp-2">{r.event?.title}</h2>
                </div>
                
                <div className="space-y-2">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Calendar size={14} className="text-primary-500" />
                      <span>{new Date(r.event?.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <Clock size={14} className="ml-2 text-primary-500" />
                      <span>{new Date(r.event?.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <MapPin size={14} className="text-primary-500" />
                      <span>{r.event?.location}</span>
                   </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                   <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID: {r._id.slice(-8).toUpperCase()}</div>
                   <div className="flex items-center gap-1.5 text-emerald-600 font-black uppercase text-[10px] tracking-widest">
                      <CheckCircle size={12} /> Registered
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center pt-10">
         <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl">
            <Info size={14} />
            <span>Show this pass at the gate</span>
         </div>
      </div>
    </div>
  );
}

function CheckCircle({ size }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
