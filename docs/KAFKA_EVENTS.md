# Kafka Events Reference

## Overview

All Kafka messages follow a standard envelope schema:

```json
{
  "eventId": "string",
  "userId": "string",
  "timestamp": "ISO8601",
  "data": { /* topic-specific payload */ }
}
```

## Topics

### `ticket-booked`
Emitted by: **Booking Service**  
Consumed by: **Notification Service**, **Analytics Service**

```json
{
  "eventId": "event-mongo-id",
  "userId": "user-mongo-id",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "bookingId": 42,
    "userEmail": "user@example.com",
    "eventTitle": "Tech Conference 2024"
  }
}
```

---

### `ticket-cancelled`
Emitted by: **Booking Service**  
Consumed by: **Notification Service**, **Analytics Service**

```json
{
  "eventId": "event-mongo-id",
  "userId": "user-mongo-id",
  "timestamp": "2024-01-15T11:00:00.000Z",
  "data": {
    "bookingId": 42,
    "userEmail": "user@example.com"
  }
}
```

---

### `event-created`
Emitted by: **Event Service**  
Consumed by: **Analytics Service**

```json
{
  "eventId": "event-mongo-id",
  "userId": "organizer-mongo-id",
  "timestamp": "2024-01-15T09:00:00.000Z",
  "data": {
    "title": "Tech Conference 2024"
  }
}
```

---

### `event-approved`
Emitted by: **Event Service**  
Consumed by: **Notification Service**, **Analytics Service**

```json
{
  "eventId": "event-mongo-id",
  "timestamp": "2024-01-15T09:30:00.000Z",
  "data": {
    "title": "Tech Conference 2024",
    "organizerEmail": "organizer@example.com"
  }
}
```

---

### `checkin-success`
Emitted by: **Check-in Service**  
Consumed by: **Analytics Service**

```json
{
  "eventId": "event-mongo-id",
  "userId": "user-mongo-id",
  "timestamp": "2024-01-20T09:05:00.000Z",
  "data": {
    "method": "qr"
  }
}
```

---

### `review-posted`
Emitted by: **Review Service**  
Consumed by: **Analytics Service**

```json
{
  "eventId": "event-mongo-id",
  "userId": "user-mongo-id",
  "timestamp": "2024-01-21T14:00:00.000Z",
  "data": {
    "reviewId": "review-mongo-id",
    "rating": 5
  }
}
```

---

## Consumer Groups

| Consumer Group | Topics Subscribed |
|----------------|-------------------|
| `notification-group` | `ticket-booked`, `ticket-cancelled`, `event-approved` |
| `analytics-group` | `ticket-booked`, `ticket-cancelled`, `event-created`, `event-approved`, `checkin-success`, `review-posted` |

## Retry Strategy

Services use `kafkajs` with default retry configuration:
- **Initial retry time:** 300ms
- **Max retry time:** 30s
- **Retry factor:** 0.2 (exponential backoff)

For production, implement dead-letter topics (`*.dlq`) for messages that fail after max retries.
