# AI Event Organiser — Backend

Express.js REST API for the AI Event Organiser platform. Uses SQLite (via better-sqlite3), JWT authentication, and ES modules throughout.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4
- **Database**: SQLite (better-sqlite3)
- **Auth**: JWT (access + refresh tokens)
- **Validation**: Joi
- **Email**: Nodemailer
- **Security**: Helmet, express-rate-limit, bcryptjs

## Project Structure

```
backend/
├── src/
│   ├── config/        # env, constants, database
│   ├── controllers/   # request handlers
│   ├── middleware/    # auth, cors, logger, error handler, validation
│   ├── models/        # User, Event, Ticket, db init
│   ├── routes/        # Express routers
│   ├── services/      # business logic
│   ├── utils/         # errors, helpers, jwt, responses, validation schemas
│   └── server.js      # entry point
├── data/              # SQLite database (auto-created)
├── .env.example
├── docker-compose.yml
└── package.json
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment
cp .env.example .env
# Edit .env with your secrets

# 3. Start development server
npm run dev

# 4. Start production server
npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `JWT_SECRET` | — | **Required in prod** — Access token secret |
| `JWT_REFRESH_SECRET` | — | **Required in prod** — Refresh token secret |
| `JWT_EXPIRES_IN` | `1h` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |
| `DB_PATH` | `./data/events.db` | SQLite file path |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP host |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_USER` | — | SMTP username |
| `EMAIL_PASSWORD` | — | SMTP password / app password |
| `EMAIL_FROM` | `noreply@...` | From address |
| `BCRYPT_ROUNDS` | `12` | bcrypt cost factor |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |

## API Endpoints

### Health
```
GET /api/health
```

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/logout` | ✓ | Logout (revoke refresh token) |
| GET  | `/api/auth/me` | ✓ | Get current user |
| POST | `/api/auth/refresh-token` | — | Refresh access token |
| PATCH | `/api/auth/profile` | ✓ | Update profile |

### Events
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/events` | — | List events (filter: category, city, country, search, page, limit) |
| GET | `/api/events/me` | ✓ | My events |
| GET | `/api/events/slug/:slug` | — | Get event by slug |
| GET | `/api/events/:id` | — | Get event by ID |
| POST | `/api/events` | ✓ | Create event |
| PUT | `/api/events/:id` | ✓ | Update event |
| DELETE | `/api/events/:id` | ✓ | Delete event |
| GET | `/api/events/:id/attendees` | ✓ | Get attendees (organizer only) |

### Tickets
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tickets` | ✓ | My tickets |
| GET | `/api/tickets/:id` | ✓ | Get ticket |
| POST | `/api/tickets/event/:eventId` | ✓ | Purchase/register ticket |
| PATCH | `/api/tickets/:id/cancel` | ✓ | Cancel ticket |
| PATCH | `/api/tickets/:qrCode/checkin` | ✓ | Check in attendee |

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/:id` | ✓ | Get user profile |
| PUT | `/api/users/:id` | ✓ | Update user |
| GET | `/api/users/:id/events` | — | Get user's events |
| GET | `/api/users/:id/tickets` | ✓ | Get user's tickets |

## Frontend Integration

```js
// Base URL
const API = 'http://localhost:5000/api';

// Register
const res = await fetch(`${API}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, name }),
});
const { data: { accessToken, refreshToken, user } } = await res.json();

// Authenticated request
const events = await fetch(`${API}/events`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});

// Refresh tokens
const refresh = await fetch(`${API}/auth/refresh-token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken }),
});
```

## Docker

```bash
# Build and run
docker-compose up --build

# Or run standalone
docker build -t ai-event-organiser-backend .
docker run -p 5000:5000 --env-file .env ai-event-organiser-backend
```

## Database Schema

Tables: `users`, `events`, `tickets`, `refresh_tokens`

The database is auto-created at the path configured in `DB_PATH` on first start. Run `npm run db:init` to initialize manually.

## User Roles & Limits

- `user` — default role; can create **1 free event**
- `organizer` — no event creation limits
- `admin` — full access

Free event limit is defined in `src/config/constants.js` (`FREE_EVENT_LIMIT = 1`).
