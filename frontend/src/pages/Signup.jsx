import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { UserPlus, User, Mail, Lock, ShieldCheck, ChevronRight, LayoutGrid, Sparkles } from 'lucide-react';

export default function Signup() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/signup', { name, email, password, role });
      login(res.data);
      nav('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex p-4 rounded-3xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 mb-2">
           <UserPlus size={32} />
        </div>
        <h1 className="font-black text-3xl tracking-tight">Create Account</h1>
        <p className="text-slate-500 dark:text-slate-400">Join the campus community today.</p>
      </div>

      <div className="glass-card p-8 rounded-[2rem] shadow-2xl space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
             {error}
          </div>
        )}
        
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
              <input 
                className="input pl-12" 
                placeholder="John Doe" 
                required
                value={name} 
                onChange={(e)=>setName(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
              <input 
                className="input pl-12" 
                type="email"
                placeholder="name@university.edu" 
                required
                value={email} 
                onChange={(e)=>setEmail(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
              <input 
                className="input pl-12" 
                type="password" 
                placeholder="••••••••" 
                required
                value={password} 
                onChange={(e)=>setPassword(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Type</label>
            <div className="relative group">
              <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors font-black" size={18} />
              <select 
                className="input pl-12 appearance-none" 
                value={role} 
                onChange={(e)=>setRole(e.target.value)}
              >
                <option value="customer">Student / Participant</option>
                <option value="organizer">Event Organizer</option>
              </select>
            </div>
          </div>

          <button disabled={loading} className="btn w-full !py-4 !rounded-2xl shadow-primary-600/30 group">
             {loading ? 'Creating Account...' : (
               <>
                 <span>Sign Up & Start Exploring</span>
                 <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
               </>
             )}
          </button>
        </form>

        <div className="text-center">
            <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors inline-flex items-center gap-2">
               Already have an account? <span className="text-primary-600 underline">Login here</span>
            </Link>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
         <div className="flex items-center gap-1.5"><ShieldCheck size={14} /> 100% Secure</div>
         <div className="w-1 h-1 rounded-full bg-slate-300"></div>
         <div className="flex items-center gap-1.5"><Sparkles size={14} /> Real-time Updates</div>
      </div>
    </div>
  );
}
