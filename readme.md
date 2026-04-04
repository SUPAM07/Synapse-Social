EventManager – Full‑Stack Event Management System

Overview
EventManager lets customers discover events, register, download QR‑coded PDF tickets, and post reviews, while organizers create/manage events, see participants, export CSVs, and perform real‑time check‑ins.

Tech Stack
- Backend: Node.js, Express.js, MongoDB (Mongoose), JWT auth
- Frontend: React (Vite), React Router, Axios, Tailwind CSS
- Realtime: Socket.IO (server + client)
- PDFs/QR: html2canvas + jsPDF for tickets; custom QR
- Tooling: ESLint, Prettier, Nodemon, PostCSS

Monorepo Structure
- backend/ – Express API, Socket.IO, MongoDB models, routes, controllers
- frontend/ – Vite React app (Tailwind), pages and hooks

Getting Started
Prerequisites
- Node.js 18+
- MongoDB running locally or a connection string

1) Clone and install
```bash
git clone <your-repo-url>
cd Event-management-system

# Backend deps
cd backend && npm install

# Frontend deps
cd ../frontend && npm install
```

2) Configure environment
Create `backend/.env` with values similar to:
```env
PORT=5050
MONGODB_URI=mongodb://localhost:27017/eventmanager
JWT_SECRET=supersecret
CLIENT_ORIGIN=http://localhost:5173
```

3) Run locally
Terminal A (backend):
```bash
cd backend
npm run dev
```

Terminal B (frontend):
```bash
cd frontend
npm run dev
```

Seeding (optional)
```bash
cd backend
node src/seed.js
```

Demo Accounts
- Customer: customer@example.com / password
- Organizer: organizer@example.com / password
- Admin: admin@example.com / password

Key Features
- Customers: browse events, register, download branded PDF tickets with QR, post reviews
- Organizers: create/manage events, view participants, export CSV, real‑time check‑in
- Admin: approve/reject events
- Home: recommendations, all events, statistics
- Dark mode, toast notifications, responsive UI

Notable Hooks
- useTicketPDF: generate branded ticket PDFs from HTML
- useQrCheckIn: perform QR/ID check‑ins with live status (Socket.IO)

Scripts
Backend (`backend/package.json`):
- `npm run dev` – start server with nodemon

Frontend (`frontend/package.json`):
- `npm run dev` – start Vite dev server
- `npm run build` – production build
- `npm run preview` – preview build

Deployment Notes
- Set environment variables (`PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`)
- Serve frontend build (Vite `dist/`) via your host or CDN
- Run backend as a service (PM2/Docker) and ensure CORS allows your frontend origin

License
MIT


