import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      login(res.data);
      nav('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="font-bold text-xl mb-4">Login</h1>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input className="input w-full" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="input w-full" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button className="btn w-full">Login</button>
      </form>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm">
        <div className="font-semibold mb-1">Demo credentials</div>
        <ul className="space-y-1">
          <li><span className="font-medium">Customer</span>: customer@example.com / password</li>
          <li><span className="font-medium">Organizer</span>: organizer@example.com / password</li>
          <li><span className="font-medium">Admin</span>: admin@example.com / password</li>
        </ul>
      </div>
      <div className="text-sm text-slate-600 mt-2">No account? <Link to="/signup" className="underline">Sign up</Link></div>
    </div>
  );
}
