# API Gateway

## Overview

The API Gateway (`gateway/`) is the single entry point for all client requests. It handles:

- **Routing** – proxies requests to the correct microservice
- **JWT verification** – optional auth parse (downstream services enforce strictly)
- **Rate limiting** – Redis-backed, per IP
- **CORS** – only allow frontend origin
- **Logging** – Morgan access logs via Winston

## Port

`3000` (local) / configurable via `PORT` env var

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `PORT` | `3000` | Gateway listen port |
| `JWT_SECRET` | `dev_secret_change_me` | JWT signing secret |
| `REDIS_URL` | `redis://localhost:6379` | Redis for rate limiting |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin |
| `AUTH_SERVICE_URL` | `http://localhost:3001` | Auth service endpoint |
| `EVENT_SERVICE_URL` | `http://localhost:3002` | Event service endpoint |
| `BOOKING_SERVICE_URL` | `http://localhost:3003` | Booking service endpoint |
| `REVIEW_SERVICE_URL` | `http://localhost:3004` | Review service endpoint |
| `CHECKIN_SERVICE_URL` | `http://localhost:3005` | Check-in service endpoint |
| `NOTIFICATION_SERVICE_URL` | `http://localhost:3006` | Notification service endpoint |
| `ANALYTICS_SERVICE_URL` | `http://localhost:3007` | Analytics service endpoint |

## Route Map

| Path | Upstream Service |
|------|-----------------|
| `GET /api/health` | Gateway itself |
| `/api/auth/*` | Auth Service |
| `/api/events/*` | Event Service |
| `/api/bookings/*` | Booking Service |
| `/api/reviews/*` | Review Service |
| `/api/checkin/*` | Check-in Service |
| `/api/notifications/*` | Notification Service |
| `/api/analytics/*` | Analytics Service |

## Rate Limiting

| Endpoint | Window | Max Requests |
|----------|--------|-------------|
| `/api/auth/login` | 15 min | 30 |
| `/api/auth/signup` | 15 min | 30 |
| All other `/api/*` | 1 min | 120 |

Rate limits are stored in Redis. Falls back to in-memory if Redis is unavailable.

## Health Check

```
GET /api/health
→ 200 { success: true, message: "API Gateway is running", services: { ... } }
```
