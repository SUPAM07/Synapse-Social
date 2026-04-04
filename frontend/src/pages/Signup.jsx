import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/auth/signup', { name, email, password, role });
      login(res.data);
      nav('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-bold text-xl mb-4">Create account</h1>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input className="input w-full" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="input w-full" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="input w-full" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <select className="input w-full" value={role} onChange={(e)=>setRole(e.target.value)}>
          <option value="customer">Customer</option>
          <option value="organizer">Organizer</option>
        </select>
        <button className="btn w-full">Sign up</button>
      </form>
      <div className="text-sm text-slate-600 mt-2">Have an account? <Link to="/login" className="underline">Login</Link></div>
    </div>
  );
}
