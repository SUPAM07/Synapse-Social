import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import EventDetails from './pages/EventDetails.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Pass from './pages/Pass.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { useEffect, useState } from 'react';
import { 
  Home as HomeIcon, 
  LayoutDashboard, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Sun, 
  Moon, 
  Calendar, 
  MapPin, 
  Sparkles,
  Globe
} from 'lucide-react';

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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary-600 p-2 rounded-lg text-white group-hover:rotate-12 transition-transform duration-300">
            <Calendar size={20} />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            EventManager
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" className={`flex items-center gap-1.5 transition-colors ${location.pathname === '/' ? 'text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:text-primary-600'}`}>
            <HomeIcon size={16} />
            <span>Home</span>
          </Link>
          {user && (
            <Link to="/dashboard" className={`flex items-center gap-1.5 transition-colors ${location.pathname.startsWith('/dashboard') ? 'text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:text-primary-600'}`}>
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

          {user ? (
            <button 
              onClick={logout} 
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1.5 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-colors hidden sm:flex items-center gap-1.5">
                <LogIn size={16} />
                <span>Login</span>
              </Link>
              <Link to="/signup" className="btn !py-2 !px-4 text-sm gap-1.5">
                <UserPlus size={16} />
                <span>Sign up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Layout({ children }) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col selection:bg-primary-600/30 selection:text-primary-900 dark:selection:text-primary-100">
      <Navbar />
      
      {isHome && (
        <section className="relative pt-20 pb-16 overflow-hidden border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_50%,rgba(99,102,241,0.08)_0%,rgba(99,102,241,0)_100%)]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold mb-6 border border-primary-200 dark:border-primary-800">
              <Sparkles size={14} />
              <span>Discover the best campus events</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tight">
              Manage Events <br />
              <span className="gradient-text">Like a Pro.</span>
            </h1>
            <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              The ultimate platform to register, organize, and track your campus participation. 
              Real-time updates, QR tickets, and community reviews all in one place.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
              <Link to="/signup" className="btn !px-8">Get Started</Link>
              <div className="flex items-center -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                    U{i}
                  </div>
                ))}
                <span className="pl-6 text-sm font-medium text-slate-500">Joined by 2k+ students</span>
              </div>
            </div>
          </div>
        </section>
      )}

      <main className={`max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 ${!isHome ? 'mt-4' : ''}`}>
        {children}
      </main>

      <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <Calendar className="text-primary-600" size={24} />
                <span className="font-bold text-xl">EventManager</span>
              </Link>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-6">
                Empowering campus communities through seamless event organization and discovery.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary-600 transition-colors">
                  <Globe size={20} />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-slate-900 dark:text-white uppercase text-xs tracking-widest">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li><Link to="/" className="hover:text-primary-500 transition-colors">Events</Link></li>
                <li><Link to="/dashboard" className="hover:text-primary-500 transition-colors">Dashboard</Link></li>
                <li><Link to="/signup" className="hover:text-primary-500 transition-colors">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-slate-900 dark:text-white uppercase text-xs tracking-widest">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-primary-500 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Terms of Service</a></li>
                <li className="pt-2 text-[10px] opacity-50 italic">© 2025 EventManager. MIT License.</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>Developed with ❤️ for Developer Viewpoint</p>
            <p>Design by <span className="font-bold text-slate-900 dark:text-slate-300">Antigravity AI</span></p>
          </div>
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
