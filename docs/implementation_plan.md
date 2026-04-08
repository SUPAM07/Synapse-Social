# Full Microservices Transition Plan

This implementation plan has been updated to reflect the full, enterprise-grade folder structure you provided. This structure is identical to what you would see in a real FAANG production environment. It separates every domain into its own service, introduces an API Gateway, extracts shared utilities, and relies on **Apache Kafka** for event-driven communication.

## User Review Required

> [!CAUTION]
> **Complete Repository Restructure**
> This plan involves moving your existing Express app (`/api`) into this new structure, effectively ripping the monolith apart. We will create a massive amount of new files and folders. Your current frontend (`client` and `admin`) will remain visually unchanged, but they will eventually point to the `api-gateway` instead of the direct backend.
> 
> Are you ready to authorize this massive folder restructuring?

## Proposed Architecture Structure

The repository will be restructured into a true microservices monorepo:

### `api-gateway/`
- Acts as the single entry point for the React Client and Admin panel.
- Responsible for routing requests to the appropriate underling internal microservices (e.g., `/api/events` routes to `event-service`).

### `services/`
- `auth-service/`: Manages login, registration, and JWT generation.
- `user-service/`: Manages user profiles (separated from auth for security).
- `event-service/`: Core catalog for Events, Formats, and Themes.
- `booking-service/`: Handles the logic and concurrency for claiming tickets.
- `payment-service/`: Integrates with Stripe.
- `ticket-service/`: Handles the generation of actual tickets (e.g., QR codes, PDFs).
- `notification-service/`: Listens to Kafka and sends emails/alerts.
- `chat-service/`: (Future feature) Real-time messaging using WebSockets.
- `review-service/`: Extracts the `Comment` model into a dedicated review system.
- `search-service/`: Highly optimized search index (ElasticSearch/Redis) for events.

### `shared/`
- `kafka/`: Shared TypeScript types and utilities for Kafka producers and consumers so every microservice speaks the same language.
- `utils/`: Common error handlers, logger configurations (Winston), etc.
- `constants/`: Shared enums and validation schemas.

### `infra/`
- `docker/`: Contains the `docker-compose.yml` for standing up Kafka, MySQL, PostgreSQL, and Redis locally.

---

## Phase 1: Repository Skeleton & Infrastructure

We must lay the physical groundwork before moving code.

#### [NEW] [infra/docker/docker-compose.yml](file:///Users/supamroy/Uevent/infra/docker/docker-compose.yml)
- Configure **Apache Kafka** (with KRaft, no Zookeeper needed).
- Configure **MySQL** (for legacy models) and potentially **PostgreSQL** or **Redis** for new microservice state.

#### [NEW] Folder Restructure Commands
- Create the overarching folder structure: `services/`, `shared/`, `infra/`, and `api-gateway/`.

---

## Phase 2: The Shared Library & API Gateway

#### [NEW] [shared/kafka/client.ts](file:///Users/supamroy/Uevent/shared/kafka/client.ts)
- Configure the `kafkajs` client that all microservices will use to connect to the broker.
- Define strongly-typed interfaces for events (e.g., `TicketReservedEvent`).

#### [NEW] [api-gateway/index.ts](file:///Users/supamroy/Uevent/api-gateway/index.ts)
- Set up a lightweight Express or fastify server using `http-proxy-middleware` to proxy frontend requests to the upcoming microservices.

---

## Phase 3: Extracting the First Domains (The Strangler Approach)

We will not break the entire app in one go. We will start migrating domains one by one.

### Step 3a: Auth and User Service
- Extract the Logic from `api/controllers/auth.ts` into the new `services/auth-service/`.
- Extract `api/controllers/users.ts` and `profile.ts` into `services/user-service/`.
- Update the API Gateway to route `/auth` to the Auth Service.

### Step 3b: Event Service
- Move the core `Event`, `Company`, `Format`, and `Theme` CRUD logic into `services/event-service/`.

## Open Questions

1. **Database Splitting:** The hardest part of microservices is database fragmentation. The strictly "correct" way is to give `auth-service`, `event-service`, and `booking-service` their own isolated databases. However, that breaks Prisma relations across domains. Do you want to:
   - **Option A (Easier):** Keep one giant MySQL database that all microservices connect to (Distributed Monolith).
   - **Option B (FAANG Level):** Split the database into multiple logical databases and rely purely on Kafka events for eventual consistency (e.g., `booking-service` holds a replica of event prices so it doesn't have to query `event-service` synchronously).
2. **Current Monolith:** What should we do with the original `api/` folder? I suggest we move it entirely into `services/legacy-api/` to hold it as a backup while we manually extract logic out of it. 

## Verification Plan

### Automated Tests
1. After Phase 1, run `docker compose up -d` in the `infra/docker` folder and verify that the Kafka broker is healthy.

### Manual Verification
1. Verify the `api-gateway` successfully proxies a basic `GET /ping` request to the extracted `auth-service`.
