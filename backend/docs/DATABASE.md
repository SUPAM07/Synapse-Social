# Database Design

## MongoDB

Three separate databases, one per service.

### `ems_auth` – Auth Service

#### `users` Collection
```json
{
  "_id": "ObjectId",
  "name": "string (required)",
  "email": "string (unique, lowercase)",
  "password": "string (hashed, bcrypt, select:false)",
  "role": "enum: customer | organizer | admin",
  "isBlocked": "boolean",
  "points": "number",
  "interests": "string[]",
  "avatarUrl": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### `ems_events` – Event Service

#### `events` Collection
```json
{
  "_id": "ObjectId",
  "title": "string (required, text-indexed)",
  "description": "string (required, text-indexed)",
  "category": "string (required)",
  "date": "Date (required)",
  "location": "string (required)",
  "capacity": "number",
  "availableSeats": "number",
  "organizerId": "string",
  "organizerName": "string",
  "posterUrl": "string",
  "status": "enum: pending | approved | rejected",
  "tags": "string[] (text-indexed)",
  "averageRating": "number",
  "price": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**Indexes:**
```js
{ date: 1, status: 1 }     // date-status compound
{ organizerId: 1 }          // organizer lookup
{ category: 1 }             // category filter
{ title: 'text', description: 'text', tags: 'text' }  // full-text search
```

### `ems_reviews` – Review Service

#### `reviews` Collection
```json
{
  "_id": "ObjectId",
  "userId": "string (required)",
  "userName": "string",
  "eventId": "string (required)",
  "rating": "number (1–5, required)",
  "comment": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**Indexes:**
```js
{ userId: 1, eventId: 1 }  // unique – one review per user per event
{ eventId: 1 }              // list reviews for event
```

---

## PostgreSQL

### `ems_bookings` Database – Booking Service

#### `bookings` Table
```sql
CREATE TABLE bookings (
  id            SERIAL PRIMARY KEY,
  user_id       VARCHAR(100)  NOT NULL,
  event_id      VARCHAR(100)  NOT NULL,
  status        VARCHAR(20)   NOT NULL DEFAULT 'confirmed'
                CHECK (status IN ('confirmed', 'cancelled', 'attended')),
  qr_code       TEXT,
  booked_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
  cancelled_at  TIMESTAMP,
  UNIQUE (user_id, event_id)
);

CREATE INDEX idx_bookings_event ON bookings (event_id, status);
CREATE INDEX idx_bookings_user  ON bookings (user_id);
CREATE INDEX idx_bookings_time  ON bookings (booked_at DESC);
```

Key design decisions:
- `UNIQUE(user_id, event_id)` – database-level double-booking prevention
- `CHECK` constraint on `status` – data integrity
- `booked_at DESC` index – efficient user booking history queries
- Separate `cancelled_at` timestamp – audit trail

---

## Redis

| Key Pattern | Type | TTL | Description |
|-------------|------|-----|-------------|
| `event:{eventId}` | String (JSON) | 1 hour | Cached event data |
| `trending:events` | String (JSON) | 30 min | Top 10 trending events |
| `refresh:{userId}` | String | 7 days | Refresh token per user |
| `blacklist:{token}` | String | 15 min | Blacklisted access tokens |
| `checkin:{eventId}:{userId}` | String (JSON) | 24 hours | Check-in record |
| Rate limit keys | Counter | 1 min or 15 min | Express rate limiter |
