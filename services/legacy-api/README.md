# Legacy API

The original monolithic Express.js API located at `/api` has been superseded by the new microservice architecture.

## Migration

Please use the new microservices instead:

| Old Endpoint Pattern | New Service | Port |
|---|---|---|
| `/auth/*` | auth-service | 3001 |
| `/users/*` | user-service | 3002 |
| `/events/*` | event-service | 3003 |
| `/bookings/*` | booking-service | 3004 |
| `/payment/*` | payment-service | 3005 |
| `/notifications/*` | notification-service | 3006 |

All services are accessible via the **API Gateway** on port `3000`.

## Getting Started

```bash
cd infra/docker
cp .env.example .env
# Edit .env with your credentials
docker compose up -d
```

The API Gateway will be available at `http://localhost:3000`.
