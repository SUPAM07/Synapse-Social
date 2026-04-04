import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import EventDetails from './pages/EventDetails.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Pass from './pages/Pass.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { useEffect, useState } from 'react';

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function useTheme() {
  const getInitial = () => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const [theme, setTheme] = useState(getInitial);
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') { root.classList.add('dark'); body && body.classList.add('dark'); }
    else { root.classList.remove('dark'); body && body.classList.remove('dark'); }
    localStorage.setItem('theme', theme);
  }, [theme]);
  return { theme, setTheme };
}

function Navbar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-extrabold text-lg tracking-tight">EventManager</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className={location.pathname==='/'?'font-semibold underline':''}>Home</Link>
          {user && (
            <Link to="/dashboard" className={location.pathname.startsWith('/dashboard')?'font-semibold underline':''}>Dashboard</Link>
          )}
          {user ? (
            <button onClick={logout} className="btn-outline">Logout</button>
          ) : (
            <>
              <Link to="/login" className="btn-outline">Login</Link>
              <Link to="/signup" className="btn">Sign up</Link>
            </>
          )}
          <button aria-label="Toggle theme" className="input px-3 py-1" onClick={()=>{
            const next = theme==='dark' ? 'light' : 'dark';
            const root = document.documentElement; const body = document.body;
            if (next==='dark') { root.classList.add('dark'); body && body.classList.add('dark'); }
            else { root.classList.remove('dark'); body && body.classList.remove('dark'); }
            localStorage.setItem('theme', next);
            setTheme(next);
          }}>{theme==='dark'?'🌙 Dark':'☀️ Light'}</button>
        </nav>
      </div>
    </header>
  );
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-neutral-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      <Navbar />
      <section className="animated-hero-bg border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-extrabold">Discover and Manage Events</h1>
          <p className="text-slate-600 dark:text-slate-300">Register, organize, review, and track your event participation.</p>
        </div>
      </section>
      <main className="max-w-6xl mx-auto p-4 flex-1">
        {children}
      </main>
      <footer className="mt-10 border-t border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-gray-600 dark:text-slate-400 flex items-center justify-between">
          <div className="text-left">
            <p>© 2025 Developer Viewpoint. All rights reserved.</p>
            <p className="mt-0.5">Free source code available on GitHub (MIT Licensed).</p>
          </div>
          <p className="text-right">Developed by <span className="font-semibold text-gray-800 dark:text-slate-200">Anshul</span>.</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/pass" element={<PrivateRoute roles={["customer","organizer","admin"]}><Pass /></PrivateRoute>} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute roles={["customer", "organizer", "admin"]}>
                  <Dashboard />
                </PrivateRoute>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
