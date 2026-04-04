# Deployment Guide

## Local Development (Docker Compose)

### Prerequisites
- Docker 24+
- Docker Compose v2

### Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd event-manager

# 2. Copy environment file
cp .env.example .env
# Edit .env and set real values for JWT_SECRET, SMTP credentials, etc.

# 3. Start all services
docker compose up -d

# 4. Check service health
docker compose ps
curl http://localhost:3000/api/health
```

### Ports
| Service | Port |
|---------|------|
| API Gateway | 3000 |
| Auth Service | 3001 |
| Event Service | 3002 |
| Booking Service | 3003 |
| Review Service | 3004 |
| Check-in Service | 3005 |
| Notification Service | 3006 |
| Analytics Service | 3007 |
| Frontend (Nginx) | 5173 |
| MongoDB | 27017 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Kafka | 9092 |
| Zookeeper | 2181 |

### Stopping Services
```bash
docker compose down          # stop, keep volumes
docker compose down -v       # stop + remove volumes (clean slate)
```

---

## Manual / Local (without Docker)

### Prerequisites
- Node.js 20+
- MongoDB 7
- PostgreSQL 16
- Redis 7
- Kafka 3 (optional – services degrade gracefully without it)

### Install Dependencies

```bash
# From repo root
cd gateway && npm install && cd ..
cd services/auth-service && npm install && cd ../..
cd services/event-service && npm install && cd ../..
cd services/booking-service && npm install && cd ../..
cd services/review-service && npm install && cd ../..
cd services/checkin-service && npm install && cd ../..
cd services/notification-service && npm install && cd ../..
cd services/analytics-service && npm install && cd ../..
cd frontend && npm install && cd ..
```

### Start Services (7 terminals)

```bash
# Terminal 1 – Auth Service
cd services/auth-service && PORT=3001 node src/server.js

# Terminal 2 – Event Service
cd services/event-service && PORT=3002 node src/server.js

# Terminal 3 – Booking Service
cd services/booking-service && PORT=3003 node src/server.js

# Terminal 4 – Review Service
cd services/review-service && PORT=3004 node src/server.js

# Terminal 5 – Check-in Service
cd services/checkin-service && PORT=3005 node src/server.js

# Terminal 6 – Notification + Analytics
cd services/notification-service && PORT=3006 node src/server.js &
cd services/analytics-service && PORT=3007 node src/server.js

# Terminal 7 – Gateway
cd gateway && PORT=3000 node src/server.js

# Terminal 8 – Frontend
cd frontend && npm run dev
```

---

## Production Deployment

### Environment Variables (required)

```env
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-domain.com
SMTP_USER=your@email.com
SMTP_PASS=yourpassword
```

### Docker Registry Push

Images are automatically built and pushed to GitHub Container Registry via the CI/CD pipeline (`docker-build.yml`) on every push to `main`.

```bash
# Pull and run manually
docker pull ghcr.io/<owner>/ems-gateway:latest
docker pull ghcr.io/<owner>/ems-auth-service:latest
# ... etc
```

### Kubernetes (Optional)

For FAANG-level production, create Kubernetes manifests:

1. **Namespace** per environment (staging, production)
2. **Deployments** for each service (2+ replicas)
3. **Services** (ClusterIP for internal, LoadBalancer for Gateway)
4. **ConfigMaps** for non-secret configuration
5. **Secrets** for JWT keys, DB passwords
6. **HorizontalPodAutoscaler** for Booking and Event services
7. **PersistentVolumeClaims** for MongoDB, PostgreSQL, Redis
8. **Ingress** (nginx-ingress or AWS ALB) for Gateway + Frontend

### AWS Deployment (ECS + RDS + ElastiCache)

1. Push images to ECR instead of GHCR
2. Use RDS PostgreSQL for booking service
3. Use ElastiCache Redis for caching + rate limiting
4. Use MSK (Managed Kafka) for event streaming
5. Use DocumentDB or MongoDB Atlas for MongoDB services
6. Use ECS Fargate for all microservices
7. Put Application Load Balancer in front of Gateway service
