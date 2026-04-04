import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './tailwind.css'
import axios from 'axios'

axios.defaults.baseURL = '' // same origin proxy

// Ensure theme is applied immediately on app bootstrap
function applyThemeFromStorage() {
  try {
    const root = document.documentElement;
    const body = document.body;
    // Always force LIGHT
    root.classList.remove('dark');
    body && body.classList.remove('dark');
    localStorage.setItem('theme','light');
    // expose for debugging
    window.theme = {
      get: () => localStorage.getItem('theme'),
      set: (next) => { localStorage.setItem('theme', next); applyThemeFromStorage(); }
    };
  } catch (_) {}
}

applyThemeFromStorage();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
