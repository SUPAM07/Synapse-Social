<head>
    <div align="center">
        <h1 align="center">Uevent — Event-Driven Microservices Platform</h1>
    </div>
</head>

## Architecture Overview

```
                         ┌──────────────┐
         Client          │  API Gateway │  :3000
         (React)  ──────▶│  (Express)   │◀──── Admin Panel
                         └──────┬───────┘
                                │  HTTP Proxy
          ┌─────────────────────┼──────────────────────┐
          │                     │                      │
     ┌────▼────┐          ┌─────▼─────┐         ┌────▼────┐
     │  Auth   │          │   User    │         │  Event  │
     │ Service │          │  Service  │         │ Service │
     │  :3001  │          │   :3002   │         │  :3003  │
     └────┬────┘          └─────┬─────┘         └────┬────┘
          │                     │                      │
          └─────────────────────┼──────────────────────┘
                                │
                       ┌────────▼────────┐
                       │   Apache Kafka  │
                       │  (Event Bus)    │
                       └────────┬────────┘
                                │
          ┌─────────────────────┼──────────────────────┐
          │                     │                      │
     ┌────▼────┐          ┌─────▼─────┐         ┌────▼────────┐
     │Booking  │          │  Payment  │         │Notification │
     │ Service │◀────────▶│  Service  │         │  Service    │
     │  :3004  │          │   :3005   │         │    :3006    │
     └────┬────┘          └─────┬─────┘         └─────────────┘
          │(PostgreSQL)         │(PostgreSQL+Stripe)
```

## Services

| Service | Port | Database | Description |
|---|---|---|---|
| **API Gateway** | 3000 | — | Reverse proxy, rate limiting, CORS |
| **Auth Service** | 3001 | PostgreSQL | JWT auth, registration, password reset |
| **User Service** | 3002 | PostgreSQL | User profiles, companies, subscriptions |
| **Event Service** | 3003 | PostgreSQL | Events, formats, themes, comments |
| **Booking Service** | 3004 | PostgreSQL | Bookings, status management |
| **Payment Service** | 3005 | PostgreSQL + Stripe | Stripe payments, Kafka consumer |
| **Notification Service** | 3006 | — | Email notifications via Nodemailer |

## Event Flow

```
User creates booking
        │
        ▼
  booking-service  ──[booking.initiated]──▶  payment-service
                                                    │
                          ┌─────────────────────────┤
                          │                         │
               [payment.processed]        [payment.failed]
                          │                         │
                          ▼                         ▼
                  booking-service ──[booking.confirmed/cancelled]──▶ notification-service
                                                                              │
                                                                              ▼
                                                                       Send Email
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### Local Development with Docker Compose

```bash
cd infra/docker
cp .env.example .env
# Edit .env with your credentials
docker compose up -d
```

API Gateway available at: `http://localhost:3000`

### Individual Service Development

```bash
# Install dependencies for a specific service
cd services/auth-service
cp .env.example .env
npm install
npm run db:generate
npm run dev
```

## API Gateway Routes

| Method | Path | Service |
|---|---|---|
| `POST` | `/auth/register` | auth-service |
| `POST` | `/auth/login` | auth-service |
| `GET` | `/auth/confirm-email` | auth-service |
| `POST` | `/auth/refresh` | auth-service |
| `GET/PATCH` | `/users/:id` | user-service |
| `GET` | `/me/profile` | user-service |
| `GET/POST` | `/companies` | user-service |
| `GET/POST` | `/events` | event-service |
| `GET/POST` | `/formats` | event-service |
| `GET/POST` | `/themes` | event-service |
| `GET/POST` | `/bookings` | booking-service |
| `GET` | `/payment/:id` | payment-service |
| `GET` | `/health` | api-gateway (aggregated) |

## Kafka Topics

| Topic | Producer | Consumer |
|---|---|---|
| `user.registered` | auth-service | notification-service |
| `user.updated` | auth/user service | — |
| `event.created` | event-service | notification-service |
| `booking.initiated` | booking-service | payment-service |
| `booking.confirmed` | booking-service | notification-service |
| `booking.cancelled` | booking-service | notification-service |
| `payment.processed` | payment-service | booking-service, notification-service |
| `payment.failed` | payment-service | booking-service, notification-service |

## Deployment

### Kubernetes with Helm

```bash
helm upgrade --install uevent infra/helm/uevent \
  --namespace uevent \
  --create-namespace \
  --set authService.image.tag=v1.0.0
```

### CI/CD

- **CI**: Runs on push to `main`/`develop` and PRs — lint, build, test, Docker image build
- **CD**: Runs on version tags (`v*`) — builds and pushes images, deploys via Helm

## Project Structure

```
uevent/
├── api-gateway/          # API Gateway (port 3000)
├── services/
│   ├── auth-service/     # Auth service (port 3001)
│   ├── user-service/     # User service (port 3002)
│   ├── event-service/    # Event service (port 3003)
│   ├── booking-service/  # Booking service (port 3004)
│   ├── payment-service/  # Payment service (port 3005)
│   ├── notification-service/ # Notification service (port 3006)
│   └── legacy-api/       # Migration docs for old monolith
├── shared/
│   ├── kafka/            # @uevent/kafka — shared Kafka client
│   └── utils/            # @uevent/utils — logger, error classes
├── infra/
│   ├── docker/           # Docker Compose for local dev
│   ├── k8s/              # Kubernetes manifests
│   └── helm/             # Helm chart
├── client/               # React frontend (Vite + Chakra UI)
├── admin/                # React Admin panel
└── api/                  # Legacy monolith (see services/legacy-api/MIGRATION.md)
```

<div align="center">
  <img alt="Node.js" src="https://img.shields.io/badge/-Node.js-339933.svg?style=for-the-badge&logo=node.js&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/-Express-000000.svg?style=for-the-badge&logo=express&logoColor=white" />
  <img alt="MySQL" src="https://img.shields.io/badge/-MySQL-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/-Prisma-2D3748.svg?style=for-the-badge&logo=prisma&logoColor=white" />
  <img alt="JSON Web Tokens" src="https://img.shields.io/badge/-JWT-000000.svg?style=for-the-badge&logo=JSONWebTokens&logoColor=white" />
  <img alt=".ENV" src="https://img.shields.io/badge/-.ENV-ECD53F.svg?style=for-the-badge&logo=.ENV&logoColor=black" />
  <img alt="Nodemon" src="https://img.shields.io/badge/-Nodemon-76D04B.svg?style=for-the-badge&logo=nodemon&logoColor=white" />
  <img alt="Swagger" src="https://img.shields.io/badge/-Swagger-85EA2D.svg?style=for-the-badge&logo=Swagger&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/-TypeScript-3178C6.svg?style=for-the-badge&logo=TypeScript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/-Vite-646CFF.svg?style=for-the-badge&logo=Vite&logoColor=white" />
  <img alt="react" src="https://img.shields.io/badge/-React-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black" />
  <img alt="redux" src="https://img.shields.io/badge/-Redux-764ABC.svg?style=for-the-badge&logo=redux&logoColor=white" />
  <img alt="react router" src="https://img.shields.io/badge/-React%20Router-CA4245.svg?style=for-the-badge&logo=react-router&logoColor=white" />
  <img alt="Chakra UI" src="https://img.shields.io/badge/-Chakra%20UI-319795.svg?style=for-the-badge&logo=ChakraUI&logoColor=white" />
  <img alt="react admin" src="https://img.shields.io/badge/-React%20admin-1a237e.svg?style=for-the-badge&logo=react&logoColor=white" />
  <img alt="Stripe" src="https://img.shields.io/badge/-Stripe-008CDD.svg?style=for-the-badge&logo=Stripe&logoColor=white" />
  <img alt="Google Maps" src="https://img.shields.io/badge/-Google%20Maps-4285F4.svg?style=for-the-badge&logo=Google-Maps&logoColor=white" />
</div>

<div align="center">
  <h3>An event-booking application.</h3>
  
  <h3>Demo</h3>
  <p><a href="https://youtu.be/nUErIMJcQec" target="_blank">Demo video</a></p>
</div>

<br/>

## Install & run

[Server](api/README.md)

[Client](client/README.md)

[Admin panel](admin/README.md)

<br/>

## Entity-relationship diagram

![Entity-relationship diagram](https://user-images.githubusercontent.com/32570823/231519268-dd62702f-b62f-4f72-ac1e-0f76770859a5.png)

## Client Use-case diagram

![use_case](https://user-images.githubusercontent.com/32570823/231520536-d8f04be2-98d5-4665-9697-db651fb9cefd.jpg)

## Admin panel Use-case diagram

![use_case](https://user-images.githubusercontent.com/32570823/231520809-5d36f20c-04de-4498-9560-3af8b66d2162.jpg)

<br/>

## Snapshots
### Login
![2022-12-08](https://user-images.githubusercontent.com/32570823/231525820-cdcc36de-b9ce-4dc1-8cd2-190bef360596.gif)

### Home page

#### gif
![2022-12-08 (3)](https://user-images.githubusercontent.com/32570823/231530998-00b12d79-b4f0-4c98-acf7-cdef2c4ef25a.gif)

#### png
![2022-12-08 (3)](https://user-images.githubusercontent.com/32570823/231531670-d67a9769-25fe-4c3a-9167-d1638a7a1850.png)
