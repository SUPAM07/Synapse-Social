# EMS Architecture

## Overview

EventManager has been transformed from a monolithic Express + React + MongoDB application into a **production-grade microservices platform** designed for scalability, resilience, and maintainability.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                       │
│                   http://localhost:5173                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ All API calls
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Gateway  :3000  (Express)                      │
│  • JWT verification        • Redis-backed rate limiting         │
│  • CORS handling           • Request routing                    │
│  • Morgan access logging   • 502 fallback handling              │
└───┬───────┬───────┬───────┬───────┬───────┬───────┬────────────┘
    │       │       │       │       │       │       │
    ▼       ▼       ▼       ▼       ▼       ▼       ▼
 :3001   :3002   :3003   :3004   :3005   :3006   :3007
 Auth   Event  Booking Review  Check-in  Notif Analytics
  │       │       │       │       │         │       │
  │       │       │       │       │         └───────┘
  │       │       │       │       │           Kafka Consumers
  │       │       └───────┴───────┘
  │       │         Kafka Producers
  │       │
  │       ▼
  │   ┌──────────────────────────────────────────────────┐
  │   │           Message / Data Layer                   │
  │   │  MongoDB :27017  PostgreSQL :5432                │
  │   │  Redis   :6379   Kafka :9092 / Zookeeper :2181   │
  │   └──────────────────────────────────────────────────┘
  │
  └─→  MongoDB (users)
```

## Services

| Service | Port | Language | Database | Description |
|---------|------|----------|----------|-------------|
| API Gateway | 3000 | Node.js/Express | Redis (rate limit) | Single entry point, routing, auth |
| Auth Service | 3001 | Node.js/Express | MongoDB | JWT auth, refresh tokens, RBAC |
| Event Service | 3002 | Node.js/Express | MongoDB + Redis | CRUD, search, Redis caching |
| Booking Service | 3003 | Node.js/Express | **PostgreSQL** | ACID bookings, QR code, Kafka events |
| Review Service | 3004 | Node.js/Express | MongoDB | Ratings, aggregation, Kafka events |
| Check-in Service | 3005 | Node.js/Express | Redis | QR validation, Socket.IO real-time |
| Notification Service | 3006 | Node.js/Express | — | Kafka consumer, email sending |
| Analytics Service | 3007 | Node.js/Express | Redis (in-memory) | Kafka consumer, metrics |
| Frontend | 5173/80 | React/Vite → Nginx | — | SPA, connects to Gateway |

## Technology Choices

### Why Polyglot Persistence?
- **MongoDB** for flexible document storage (users, events, reviews) – schema-less, horizontally scalable
- **PostgreSQL** for bookings – ACID compliance, unique constraints prevent double-booking, transaction isolation
- **Redis** for caching (TTL-based), session storage, rate limiting, Socket.IO adapter

### Why Kafka?
- Decouples producers (Booking, Event, Check-in, Review) from consumers (Notification, Analytics)
- Replay capability for analytics backfill
- Fault-tolerant: consumers can catch up if they were offline
- Partitioned topics allow parallel processing

### Why Socket.IO + Redis Adapter?
- Real-time check-in updates pushed to all connected dashboard clients
- Redis adapter enables horizontal scaling: multiple Check-in service instances share socket state

## Communication Patterns

### Synchronous (HTTP)
- Frontend → Gateway → Service (REST API calls)
- Booking Service → Event Service (update available seats)

### Asynchronous (Kafka)
- Booking Service emits `ticket-booked`, `ticket-cancelled`
- Event Service emits `event-created`, `event-approved`
- Check-in Service emits `checkin-success`
- Review Service emits `review-posted`
- Notification Service consumes: `ticket-booked`, `ticket-cancelled`, `event-approved`
- Analytics Service consumes: all topics

## Kafka Topics

| Topic | Partitions | Retention | Producers | Consumers |
|-------|-----------|-----------|-----------|-----------|
| `ticket-booked` | 3 | 7 days | Booking | Notification, Analytics |
| `ticket-cancelled` | 3 | 7 days | Booking | Notification, Analytics |
| `event-created` | 3 | 7 days | Event | Analytics |
| `event-approved` | 3 | 7 days | Event | Notification, Analytics |
| `checkin-success` | 3 | 7 days | Check-in | Analytics |
| `review-posted` | 3 | 7 days | Review | Analytics |

## Security

- JWT access tokens (15 min TTL) + refresh tokens (7 day TTL)
- Access token blacklist in Redis on logout
- Refresh token rotation (one-time use)
- RBAC via `role` field: `customer`, `organizer`, `admin`
- Redis-backed rate limiting at the gateway layer
- Helmet.js security headers on every service
- CORS restricted to the frontend origin at the gateway
