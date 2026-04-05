# Migration Guide – Upgrading Services to Event-Driven Patterns

This guide describes how to migrate an existing EMS microservice to use the new event-driven patterns introduced in the `backend/shared/` library.

---

## Prerequisites

1. Service lives under `backend/services/<service-name>/`.
2. Node.js ≥ 20 with ESM (`"type": "module"` in `package.json`).
3. Kafka reachable at `KAFKA_BROKERS` environment variable.

---

## Step 1 – Install the shared library

The shared library is currently referenced via relative path. Add it to your service's `package.json`:

```json
{
  "dependencies": {
    "@ems/shared": "file:../../shared"
  }
}
```

Run:
```bash
npm install
```

---

## Step 2 – Replace the legacy Kafka helper with `KafkaClient`

**Before (legacy `shared/kafka/index.js`):**
```js
import { createProducer, publishEvent, createConsumer, subscribeAndRun } from '@ems/shared/kafka/index.js';

await createProducer();
await publishEvent('ticket-booked', payload);

const consumer = await createConsumer('booking-group');
await subscribeAndRun(consumer, ['ticket-booked'], handler);
```

**After (new `KafkaClient` with DLQ):**
```js
import KafkaClient from '@ems/shared/kafka/kafkaClient.js';

const kafka = new KafkaClient({
  clientId: process.env.SERVICE_NAME ?? 'my-service',
  brokers: (process.env.KAFKA_BROKERS ?? 'kafka:29092').split(','),
});

await kafka.connect();

// Publish
await kafka.publish('ticket-booked', payload, bookingId);

// Consume with automatic DLQ routing
await kafka.subscribe('booking-group', ['ticket-booked'], async (topic, message) => {
  // handle message
}, { maxRetries: 3 });

// Graceful shutdown
process.on('SIGTERM', async () => {
  await kafka.disconnect();
  process.exit(0);
});
```

---

## Step 3 – Add event validation

Validate events **before publishing** and **after consuming**:

```js
import { assertValidEvent } from '@ems/shared/events/eventValidator.js';
import { randomUUID } from 'crypto';

// Build a compliant event envelope
const event = {
  eventId: randomUUID(),
  eventType: 'ticket-booked',
  version: 1,
  timestamp: new Date().toISOString(),
  correlationId: req.headers['x-correlation-id'] ?? randomUUID(),
  source: 'booking-service',
  metadata: { userId: req.user.id },
  payload: {
    bookingId: booking.id,
    eventId: booking.eventId,
    userId: booking.userId,
    ticketCount: booking.quantity,
    totalAmount: booking.totalPrice,
  },
};

// Throws Joi.ValidationError if schema is violated
const validatedEvent = assertValidEvent('ticket-booked', event);
await kafka.publish('ticket-booked', validatedEvent, booking.id);
```

---

## Step 4 – Protect synchronous HTTP calls with Circuit Breaker

Wrap any service-to-service HTTP request:

```js
import { CircuitBreaker } from '@ems/shared/resilience/circuitBreaker.js';

const eventServiceCb = new CircuitBreaker({
  name: 'event-service',
  failureThreshold: 5,
  resetTimeout: 30_000,
});

// Will throw if circuit is OPEN
const event = await eventServiceCb.call(async () => {
  const res = await fetch(`${process.env.EVENT_SERVICE_URL}/events/${eventId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
});
```

---

## Step 5 – Record events in the audit trail

```js
import { recordEvent } from '@ems/shared/audit/eventAudit.js';

// After successful processing
recordEvent({
  eventType: message.eventType,
  eventId: message.eventId,
  correlationId: message.correlationId,
  source: message.source,
  status: 'processed',
  metadata: message.metadata,
});

// On failure
recordEvent({
  eventType: message.eventType,
  eventId: message.eventId,
  correlationId: message.correlationId,
  source: message.source,
  status: 'failed',
  error: err.message,
});
```

---

## Step 6 – Add DLQ environment variable

Update `docker-compose.yml` to expose the DLQ topic name:

```yaml
environment:
  KAFKA_DLQ_TOPIC: my-service.dlq
```

And initialise `KafkaClient` with the suffix:

```js
const kafka = new KafkaClient({
  clientId: 'my-service',
  brokers: process.env.KAFKA_BROKERS.split(','),
  dlqSuffix: '.dlq',
});
```

---

## Checklist

- [ ] Updated `package.json` to reference `@ems/shared`
- [ ] Replaced legacy Kafka helpers with `KafkaClient`
- [ ] Added event envelope validation with `assertValidEvent`
- [ ] Wrapped HTTP calls with `CircuitBreaker`
- [ ] Implemented audit trail with `recordEvent`
- [ ] Added `KAFKA_DLQ_TOPIC` to docker-compose service environment
- [ ] Graceful shutdown disconnects Kafka client on `SIGTERM`
