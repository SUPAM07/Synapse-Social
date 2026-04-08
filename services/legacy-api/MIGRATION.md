# Migration Guide: Legacy API → Microservices

## Controller → Service Mapping

### Auth Controller (`api/src/controllers/auth.controller.ts`)
- `POST /auth/register` → **auth-service** `POST /auth/register`
- `POST /auth/login` → **auth-service** `POST /auth/login`
- `POST /auth/logout` → **auth-service** `POST /auth/logout`
- `GET /auth/confirm-email` → **auth-service** `GET /auth/confirm-email`
- `POST /auth/password-reset/send` → **auth-service** `POST /auth/password-reset/send`
- `POST /auth/password-reset/reset` → **auth-service** `POST /auth/password-reset/reset`

### User Controller (`api/src/controllers/user.controller.ts`)
- `GET /users/:id` → **user-service** `GET /users/:id`
- `PATCH /users/:id` → **user-service** `PATCH /users/:id`
- `DELETE /users/:id` → **user-service** `DELETE /users/:id`
- `GET /me/profile` → **user-service** `GET /me/profile`

### Company Controller (`api/src/controllers/company.controller.ts`)
- `GET /users/:id/companies` → **user-service** `GET /users/:id/companies`
- `POST /companies` → **user-service** `POST /companies`
- `PATCH /companies/:id` → **user-service** `PATCH /companies/:companyId`
- `DELETE /companies/:id` → **user-service** `DELETE /companies/:companyId`
- `POST /companies/:id/subscribe` → **user-service** `POST /companies/:companyId/subscribe`
- `DELETE /companies/:id/subscribe` → **user-service** `DELETE /companies/:companyId/subscribe`

### Event Controller (`api/src/controllers/event.controller.ts`)
- `GET /events` → **event-service** `GET /events`
- `GET /events/:id` → **event-service** `GET /events/:id`
- `POST /events` → **event-service** `POST /events`
- `PATCH /events/:id` → **event-service** `PATCH /events/:id`
- `DELETE /events/:id` → **event-service** `DELETE /events/:id`

### Format/Theme Controllers
- `GET /formats` → **event-service** `GET /formats`
- `POST /formats` → **event-service** `POST /formats`
- `GET /themes` → **event-service** `GET /themes`
- `POST /themes` → **event-service** `POST /themes`

### Comment Controller
- `GET /events/:eventId/comments` → **event-service** `GET /events/:eventId/comments`
- `POST /events/:eventId/comments` → **event-service** `POST /events/:eventId/comments`
- `DELETE /comments/:id` → **event-service** `DELETE /comments/:id`

### Booking Controller (`api/src/controllers/booking.controller.ts`)
- `GET /bookings` → **booking-service** `GET /bookings`
- `GET /bookings/:id` → **booking-service** `GET /bookings/:id`
- `POST /bookings` → **booking-service** `POST /bookings`
- `PATCH /bookings/:id/cancel` → **booking-service** `PATCH /bookings/:id/cancel`

### Payment Controller (`api/src/controllers/payment.controller.ts`)
- `GET /payment/:id` → **payment-service** `GET /payment/:id`
- `GET /payment/booking/:bookingId` → **payment-service** `GET /payment/booking/:bookingId`

## Key Architecture Changes

1. **Authentication**: JWT validation now handled per-service; tokens issued by auth-service
2. **Database**: MySQL monolith → separate PostgreSQL per service (service owns its data)
3. **Async Events**: Direct DB calls → Kafka events (e.g., booking triggers payment asynchronously)
4. **Stripe**: Payment processing now in payment-service, triggered by `booking.initiated` Kafka event

## Authentication Header

All protected routes require:
```
Authorization: Bearer <access_token>
```

Obtain tokens from `POST /auth/login` via the API Gateway.
