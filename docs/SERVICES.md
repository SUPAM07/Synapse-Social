# Services Reference

## Auth Service (`:3001`)

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/register` | — | Register new user |
| `POST` | `/signup` | — | Alias for `/register` |
| `POST` | `/login` | — | Login, get access + refresh tokens |
| `POST` | `/refresh` | — | Exchange refresh token for new access token |
| `POST` | `/logout` | ✅ | Blacklist access token, remove refresh token |
| `GET` | `/verify` | — | Verify an access token |
| `GET` | `/profile` | ✅ | Get current user's profile |
| `GET` | `/health` | — | Health check |

### Token Lifecycle
1. Login → receive `accessToken` (15 min) + `refreshToken` (7 days)
2. Include `Authorization: Bearer <accessToken>` in all protected requests
3. When access token expires, call `POST /api/auth/refresh` with `{ refreshToken }`
4. On logout, access token is blacklisted in Redis

---

## Event Service (`:3002`)

### Endpoints

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| `GET` | `/` | — | — | List all events (paginated) |
| `GET` | `/search` | — | — | Search events with filters |
| `GET` | `/trending` | — | — | Top 10 events (cached 30 min) |
| `GET` | `/:id` | — | — | Get event by ID (cached 1 hr) |
| `POST` | `/` | ✅ | organizer, admin | Create event |
| `PUT` | `/:id` | ✅ | organizer, admin | Update event |
| `DELETE` | `/:id` | ✅ | organizer, admin | Delete event |
| `POST` | `/:id/approve` | ✅ | admin | Approve event |
| `POST` | `/:id/reject` | ✅ | admin | Reject event |
| `PATCH` | `/:id/seats` | internal | — | Update available seats |
| `GET` | `/health` | — | — | Health check |

### Caching
- Individual events cached at `event:{id}` for 1 hour
- Trending events cached at `trending:events` for 30 minutes
- Cache invalidated on create, update, delete, approve, reject

---

## Booking Service (`:3003`)

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/` | ✅ | Create booking (PostgreSQL transaction) |
| `GET` | `/:id` | ✅ | Get booking by ID |
| `GET` | `/user/:userId` | ✅ | Get all bookings for a user |
| `PUT` | `/:id/cancel` | ✅ | Cancel booking |
| `GET` | `/:id/qr` | ✅ | Get QR code data URL |
| `GET` | `/health` | — | Health check |

### Transaction Flow (Double-Booking Prevention)
```sql
BEGIN TRANSACTION
  1. Fetch event from Event Service → verify approved + available seats
  2. SELECT * FROM bookings WHERE user_id=? AND event_id=?  → check duplicate
  3. INSERT INTO bookings ... (UNIQUE constraint as safety net)
  4. PATCH /events/:id/seats  (decrement by 1)
COMMIT
```

### Kafka Events Emitted
- `ticket-booked` – on successful booking
- `ticket-cancelled` – on cancellation

---

## Review Service (`:3004`)

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/event/:eventId` | ✅ | Create review |
| `GET` | `/event/:eventId` | — | List reviews for event |
| `GET` | `/stats/event/:eventId` | — | Aggregate rating stats |
| `PUT` | `/:id` | ✅ | Update own review |
| `DELETE` | `/:id` | ✅ | Delete own review |
| `GET` | `/health` | — | Health check |

### Kafka Events Emitted
- `review-posted` – on new review

---

## Check-in Service (`:3005`)

### HTTP Endpoints

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| `POST` | `/qr` | ✅ | organizer, admin | Validate QR scan and check in |
| `POST` | `/manual` | ✅ | organizer, admin | Manual check-in by userId |
| `GET` | `/event/:eventId` | ✅ | organizer, admin | Get check-in stats for event |
| `GET` | `/health` | — | — | Health check |

### WebSocket (Socket.IO)
Connect to `ws://localhost:3005` then:
- Emit `join-event` with `eventId` to subscribe to live check-ins
- Listen for `checkin` events: `{ userId, eventId, checkedInAt }`
- Redis adapter enables multiple instances to share socket state

### Kafka Events Emitted
- `checkin-success` – on each check-in

---

## Notification Service (`:3006`)

Kafka consumer-only service. No public HTTP endpoints except `/health`.

### Consumed Topics
| Topic | Action |
|-------|--------|
| `ticket-booked` | Send booking confirmation email |
| `ticket-cancelled` | Send cancellation email |
| `event-approved` | Send approval notification to organizer |

---

## Analytics Service (`:3007`)

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/overview` | Total bookings, cancellations, check-ins, reviews, events |
| `GET` | `/top-events` | Top 10 events by bookings and check-ins |
| `GET` | `/activity` | Last 100 activity events |
| `GET` | `/health` | Health check |

### Consumed Kafka Topics
`ticket-booked`, `ticket-cancelled`, `event-created`, `checkin-success`, `review-posted`
