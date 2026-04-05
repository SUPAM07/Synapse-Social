# Event-Driven Architecture – Best Practices & Patterns

## Overview

This document describes the event-driven architecture used across the EMS (Event Management System) microservices. All inter-service communication for asynchronous operations is performed through Kafka events rather than synchronous HTTP calls.

---

## Core Principles

### 1. Event Envelope Standard
Every Kafka message **must** conform to the base event envelope defined in `backend/shared/events/eventValidator.js`:

```json
{
  "eventId": "<uuid-v4>",
  "eventType": "ticket-booked",
  "version": 1,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "correlationId": "<uuid-v4>",
  "source": "booking-service",
  "retryCount": 0,
  "metadata": {
    "userId": "user-123",
    "tenantId": "tenant-abc"
  },
  "payload": { }
}
```

### 2. Event Versioning
- Start at `version: 1`.
- Increment the version **only** on breaking payload changes.
- Consumers must handle older versions gracefully (forward compatibility).

### 3. Correlation IDs
Every event carries a `correlationId` UUID that propagates across service boundaries. This enables end-to-end request tracing. Generate it at the entry point (API Gateway or first producer) and pass it through all downstream events.

### 4. Idempotent Consumers
Consumers must be idempotent – processing the same event twice must produce the same result. Use `eventId` as a deduplication key in your data store.

---

## Dead Letter Queue (DLQ) Pattern

When a consumer fails to process a message after exhausting its retry budget, the message is forwarded to the corresponding DLQ topic:

```
<original-topic>.dlq
```

Examples:
- `ticket-booked` → `ticket-booked.dlq`
- `booking-service.dlq` (service-level DLQ)

DLQ messages include the original payload, the error details, and a `failedAt` timestamp. A separate monitoring process should alert on DLQ activity and support manual replay.

### Using the Enhanced Kafka Client

```js
import KafkaClient from '@ems/shared/kafka/kafkaClient.js';

const client = new KafkaClient({
  clientId: 'booking-service',
  brokers: process.env.KAFKA_BROKERS.split(','),
  dlqSuffix: '.dlq',
});

await client.connect();

// Publish
await client.publish('ticket-booked', eventPayload, bookingId);

// Subscribe with automatic DLQ routing on failure
await client.subscribe('booking-consumer-group', ['ticket-booked'], async (topic, payload) => {
  // process message
}, { maxRetries: 3 });
```

---

## Resilience Patterns

### Circuit Breaker
Protect synchronous service calls with the circuit breaker from `backend/shared/resilience/circuitBreaker.js`:

```js
import { CircuitBreaker } from '@ems/shared/resilience/circuitBreaker.js';

const cb = new CircuitBreaker({ name: 'event-service', failureThreshold: 5 });

const data = await cb.call(() => fetch('http://event-service:3002/events/123'));
```

States:
- **CLOSED** – requests pass through normally.
- **OPEN** – requests fail immediately; no upstream calls are made.
- **HALF_OPEN** – one probe request is allowed; success → CLOSED, failure → OPEN.

### Exponential Backoff Retry

```js
import { retryWithBackoff } from '@ems/shared/resilience/circuitBreaker.js';

const result = await retryWithBackoff(
  () => externalApi.call(),
  { maxRetries: 3, baseDelay: 300 }
);
```

---

## Event Validation

Validate events before publishing **and** after consuming:

```js
import { assertValidEvent } from '@ems/shared/events/eventValidator.js';

// Throws Joi.ValidationError on invalid events
const validEvent = assertValidEvent('ticket-booked', rawEvent);
await client.publish('ticket-booked', validEvent);
```

---

## Event Audit Trail

All processed, failed, and DLQ-routed events should be recorded in the audit log:

```js
import { recordEvent } from '@ems/shared/audit/eventAudit.js';

recordEvent({
  eventType: 'ticket-booked',
  eventId: event.eventId,
  correlationId: event.correlationId,
  source: event.source,
  status: 'processed',
});
```

---

## Topic Naming Conventions

| Pattern | Example |
|---|---|
| `<entity>-<past-tense-verb>` | `ticket-booked`, `event-created` |
| `<service>.dlq` | `booking-service.dlq` |
| `<entity>-<past-tense-verb>.dlq` | `ticket-booked.dlq` |

---

## Directory Structure

```
backend/
├── gateway/          # API Gateway
├── services/         # Individual microservices
├── shared/
│   ├── events/       # Event schemas & Joi validation
│   ├── kafka/        # KafkaJS wrappers (producer, consumer, DLQ)
│   ├── resilience/   # Circuit breaker & retry utilities
│   ├── audit/        # Event audit trail
│   ├── config/       # Shared configuration
│   ├── redis/        # Redis client utilities
│   └── utils/        # Auth, JWT, logging, responses
└── docs/             # Architecture documentation
```
