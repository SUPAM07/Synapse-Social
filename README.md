# EventManager – Scalable Event Management Platform

A production-grade, microservices-based event management platform built for scale.

## Resume-Worthy Highlights

- **Architected** a microservices-based event management system decomposing a monolithic backend into **7 independently deployable services** (Auth, Event, Booking, Review, Check-in, Notification, Analytics)
- **Designed event-driven architecture** using **Kafka** for asynchronous processing, enabling real-time notifications, analytics aggregation, and decoupled service communication
- **Implemented polyglot persistence**: MongoDB for flexible event/user data, **PostgreSQL** for transactional booking consistency (ACID), **Redis** for caching and rate limiting
- **Built real-time QR-based check-in** using Socket.IO with **Redis adapter**, enabling horizontal scaling across multiple instances
- **Engineered API Gateway** with JWT authentication, Redis-backed rate limiting, and service routing
- **Engineered double-booking prevention** with PostgreSQL transaction isolation and unique constraints
- **Containerized** all services with Docker multi-stage builds and orchestrated local development via Docker Compose
- **CI/CD pipeline** with GitHub Actions: lint, build, Docker push to GHCR

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  React Frontend (Vite + Nginx)                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Gateway  :3000                                 │
│  JWT auth │ Rate limiting │ CORS │ Routing │ Logging            │
└─────┬─────┬──────┬────────┬────────┬───────┬──────┬────────────┘
      │     │      │        │        │       │      │
   :3001  :3002  :3003    :3004    :3005   :3006  :3007
   Auth  Event Booking  Review  Check-in  Notif Analytics
                  │                │         ▲      ▲
                  └────── Kafka ───┘─────────┘      │
                                   └────────────────┘
                                  (producers → consumers)
┌─────────────────────────────────────────────────────────────────┐
│  MongoDB  │  PostgreSQL  │  Redis  │  Kafka + Zookeeper         │
└─────────────────────────────────────────────────────────────────┘
```

| Service | Port | Stack | Store |
|---------|------|-------|-------|
| API Gateway | 3000 | Express | Redis (rate limit) |
| Auth | 3001 | Express | MongoDB + Redis |
| Event | 3002 | Express | MongoDB + Redis cache |
| Booking | 3003 | Express | **PostgreSQL** (ACID) |
| Review | 3004 | Express | MongoDB |
| Check-in | 3005 | Express + Socket.IO | Redis |
| Notification | 3006 | Express | Kafka consumer |
| Analytics | 3007 | Express | Kafka consumer + in-memory |

---

## Quick Start (Docker)

```bash
# Clone
git clone <your-repo-url>
cd event-manager

# Configure
cp .env.example .env
# Edit JWT_SECRET, SMTP_* etc.

# Launch all services
docker compose up -d

# Verify
curl http://localhost:3000/api/health
open http://localhost:5173
```

## Quick Start (Local Dev)

```bash
# Prerequisites: Node 20, MongoDB, PostgreSQL, Redis, (optional) Kafka

# Install all service dependencies
for dir in gateway services/*/; do (cd "$dir" && npm install); done
cd frontend && npm install && cd ..

# Run each service (separate terminals or use a process manager)
cd services/auth-service && PORT=3001 npm start
cd services/event-service && PORT=3002 npm start
cd services/booking-service && PORT=3003 npm start
cd services/review-service && PORT=3004 npm start
cd services/checkin-service && PORT=3005 npm start
cd services/notification-service && PORT=3006 npm start
cd services/analytics-service && PORT=3007 npm start
cd gateway && PORT=3000 npm start
cd frontend && npm run dev
```

---

## Project Structure

```
event-manager/
├── services/
│   ├── auth-service/          # JWT auth, refresh tokens, RBAC
│   ├── event-service/         # CRUD, search, Redis caching
│   ├── booking-service/       # PostgreSQL ACID bookings, QR
│   ├── review-service/        # Ratings, aggregation
│   ├── checkin-service/       # QR validation, Socket.IO
│   ├── notification-service/  # Kafka → email
│   └── analytics-service/     # Kafka → metrics
├── gateway/                   # API Gateway
├── shared/                    # Common utilities (JWT, Redis, Kafka, Logger)
├── frontend/                  # React + Vite SPA
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_GATEWAY.md
│   ├── SERVICES.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   └── KAFKA_EVENTS.md
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Documentation

| Doc | Description |
|-----|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, service map, Kafka topics |
| [API_GATEWAY.md](docs/API_GATEWAY.md) | Gateway routes, rate limits, config |
| [SERVICES.md](docs/SERVICES.md) | Per-service API reference |
| [DATABASE.md](docs/DATABASE.md) | MongoDB, PostgreSQL, Redis schemas |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Docker, local, AWS deployment |
| [KAFKA_EVENTS.md](docs/KAFKA_EVENTS.md) | Event schema & consumer groups |

---

## Demo Accounts (legacy monolith seed)

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@example.com | password |
| Organizer | organizer@example.com | password |
| Admin | admin@example.com | password |

---

## Tech Stack

**Backend:** Node.js 20, Express 5, Mongoose, `pg`, `kafkajs`, `ioredis`, `socket.io`, `jsonwebtoken`, `bcryptjs`, `nodemailer`, Winston  
**Frontend:** React 19, Vite 7, Tailwind CSS, Axios, Socket.IO client  
**Infrastructure:** Docker, Docker Compose, Kafka + Zookeeper, MongoDB 7, PostgreSQL 16, Redis 7  
**CI/CD:** GitHub Actions (lint, build, Docker push to GHCR)

---

## License

MIT
