# Full Stack AI Event Organiser – Microservice Architecture 🔥🔥
## https://www.youtube.com/watch?v=4keJJzL-VCM
<img width="1470" height="956" alt="Screenshot 2025-11-14 at 12 34 45 AM" src="https://github.com/user-attachments/assets/f7f48cdc-a3bf-40e0-b275-cf690e1bdd48" />
<img width="1470" height="956" alt="Screenshot 2025-11-14 at 12 34 16 AM" src="https://github.com/user-attachments/assets/84f2f663-8d0f-413f-a26f-d3674b5e03c5" />

## Architecture

This repository is organised as a **monorepo** with an event-driven microservice architecture:

```
ai-event-organiser/
├── frontend/          # Next.js frontend application
│   ├── app/           # Next.js App Router pages & layouts
│   ├── components/    # Reusable React components (Shadcn UI)
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Shared utilities and data
│   ├── public/        # Static assets
│   ├── middleware.js  # Clerk auth middleware
│   ├── next.config.mjs
│   ├── postcss.config.mjs
│   ├── eslint.config.mjs
│   ├── jsconfig.json
│   ├── components.json
│   └── package.json
│
├── backend/           # Event-driven backend services
│   ├── convex/        # Convex backend-as-a-service
│   │   ├── schema.js        # Database schema
│   │   ├── events.js        # Event mutations & queries
│   │   ├── users.js         # User mutations & queries
│   │   ├── registrations.js # Registration logic
│   │   ├── dashboard.js     # Dashboard queries
│   │   ├── explore.js       # Explore/discovery queries
│   │   ├── search.js        # Search functionality
│   │   ├── seed.js          # Seed data
│   │   └── auth.config.js   # Clerk JWT auth config
│   └── package.json
│
├── package.json       # Monorepo root (npm workspaces)
├── .gitignore
└── README.md
```

### Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | Next.js 16, React 19, Tailwind CSS v4, Shadcn UI |
| Auth      | Clerk                                           |
| Backend   | Convex (event-driven, real-time)                |
| AI        | Google Gemini                                   |
| Images    | Unsplash API                                    |

## Getting Started

### Prerequisites
- Node.js 18+
- npm 8+ (workspaces support)

### Installation

```bash
# Install all workspace dependencies from the root
npm install
```

### Environment Variables

Create a `.env` file inside the **`frontend/`** folder:

```
# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_JWT_ISSUER_DOMAIN=

# Unsplash
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=

# Gemini AI
GEMINI_API_KEY=
```

Create a `.env` file inside the **`backend/`** folder:

```
# Convex deployment
CONVEX_DEPLOYMENT=
```

### Development

Run services from the root:

```bash
# Run frontend only
npm run dev

# Run backend (Convex) only
npm run dev:backend

# Run both concurrently
npm run dev:all
```

Or run each service independently:

```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && npm run dev
```

### Build & Deploy

```bash
# Build the frontend
npm run build

# Deploy the Convex backend
npm run deploy:backend
```
