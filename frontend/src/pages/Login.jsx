import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LogIn, Mail, Lock, ShieldCheck, ChevronRight, UserPlus, Info } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      login(res.data);
      nav('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex p-4 rounded-3xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 mb-2">
           <LogIn size={32} />
        </div>
        <h1 className="font-black text-3xl tracking-tight">Welcome Back</h1>
        <p className="text-slate-500 dark:text-slate-400">Login to manage your events and tickets.</p>
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

          <button disabled={loading} className="btn w-full !py-4 !rounded-2xl shadow-primary-600/30 group">
             {loading ? 'Authenticating...' : (
               <>
                 <span>Login to Account</span>
                 <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
               </>
             )}
          </button>
        </form>

        <div className="text-center">
            <Link to="/signup" className="text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors inline-flex items-center gap-2">
               Don't have an account? <span className="text-primary-600 underline">Sign up here</span>
            </Link>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl border-slate-200/50 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
        <div className="flex items-center gap-2 text-primary-600 font-black uppercase tracking-widest text-[10px]">
           <Info size={14} />
           <span>Demo credentials</span>
        </div>
        <div className="grid grid-cols-1 gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <div className="flex justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
             <span>Customer</span>
             <span className="text-primary-500">customer@example.com</span>
          </div>
          <div className="flex justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
             <span>Organizer</span>
             <span className="text-primary-500">organizer@example.com</span>
          </div>
          <div className="flex justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
             <span>Admin</span>
             <span className="text-primary-500">admin@example.com</span>
          </div>
          <div className="text-center pt-1 opacity-50 font-medium">Password for all is <span className="underline italic">password</span></div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
         <ShieldCheck size={14} />
         <span>Secure Enterprise Auth</span>
      </div>
    </div>
  );
}
