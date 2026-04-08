# FAANG Resume Project Audit: Uevent

You asked for a brutally honest review of this project for a FAANG-level resume, so I am going to evaluate it with the strict, high-bar criteria that tech companies like Meta, Amazon, Apple, Netflix, and Google use when screening candidates.

## 🌟 The Good: What's Working Well

Before tearing into the gaps, here is what you did right. This project is well above average for an entry-level portfolio:

1. **Production-Ready Tech Stack:** You're using a very relevant, modern stack: React, TypeScript, RTK Query, Node.js, Express, and Prisma. 
2. **Beyond Basic CRUD:** Integrating third-party APIs like Stripe (for payments) and Google Maps adds real-world complexity that interviewers like to see.
3. **Structured Monolith:** Your backend is well-organized with clear separation of concerns (Controllers, Services, Routes, Validation). You didn't just dump all your business logic into your Express routes.
4. **Three-Tier Architecture:** Having a user client, an API, and an admin panel shows you understand role-based access and system boundaries. 
5. **Clear Documentation:** The README with an ER diagram and GIF demos is excellent. It shows you know how to communicate your work.

---

## 🛑 The Brutally Honest Critique: Why it Falls Short of FAANG

If I were a FAANG engineer reviewing this Github repo, here is exactly what would raise red flags or cause your project to be viewed as "just another boot-camp CRUD app."

### 1. Absolute Zero Testing (The Biggest Red Flag)
I searched your entire repository for `.test.ts` or `.spec.ts` files, and **I found none**. 
In FAANG, code without tests is considered broken. If you put this on your resume, the first question an interviewer will ask is, *"How do you know this works?"* Relying purely on manual testing is a massive negative signal for top-tier engineering roles.
*   **What's missing:** Unit tests (Jest/Vitest), API integration tests (Supertest), and E2E tests (Cypress/Playwright).

### 2. The "Ticketmaster Problem" (Concurrency & Scalability)
You are building an event booking app. The classic system design question for this domain is: *"What happens when Taylor Swift announces a concert and 100,000 people try to buy 100 tickets at the exact same millisecond?"*
Looking at your `EventService` and Prisma schema:
*   You don't have optimistic concurrency control (e.g., a version column).
*   You aren't using database transactions with row-level locks (`SELECT ... FOR UPDATE`) to prevent double-booking tickets.
*   If two users click "buy" at the exact same time for the last ticket, your app will likely sell 2 tickets and result in negative `ticketsAvailable`. 

### 3. Lack of Advanced Infrastructure / DevOps
Modern FAANG engineering expects an understanding of deployment and infrastructure.
*   **No Docker:** There are no `Dockerfile` or `docker-compose.yml` files. A senior engineer reading this has to run `npm install` and manually set up MySQL and Stripe to run your app, rather than just running `docker compose up`.
*   **No CI/CD:** You don't have GitHub Actions, Travis CI, or CircleCI set up. There is no automated pipeline that lints, builds, and (theoretically) tests your code on PRs.

### 4. It's Synchronous and Monolithic
While a monolith is fine to start, "Uevent" is begging for asynchronous, event-driven architecture (ironically, given the name). 
*   When a user buys a ticket, the email notification, the payment processing, and the database update likely happen synchronously in the HTTP request thread. This blocks the main thread and scales poorly.
*   There's no message queue (RabbitMQ, Kafka, or AWS SQS) or background job processor (Redis + BullMQ) for handling heavy tasks asynchronously.

### 5. Caching and Performance
Every request seemingly hits your MySQL database. If the home page loads the list of popular upcoming events, it queries MySQL every time. A FAANG system design will always look for a caching layer (like Redis) for heavily read, rarely mutated data (like an event catalog).

---

## 🚀 How to Make It FAANG-Ready (Action Plan)

You have a solid foundation. Here is exactly what you need to do to turn this from an "average CRUD app" into a standout FAANG-caliber project:

### Tier 1: The Non-Negotiables
1. **Write Tests:** Add Jest. Write unit tests for your complex services (like `EventService`). Write integration tests using Supertest for your booking API endpoint. Aim for at least 60% coverage on the backend.
2. **Fix Concurrency:** Implement a robust ticket-booking transaction. Add concurrency control to ensure it is impossible to double-sell a ticket under heavy load. Document how you solved this race condition in your README.

### Tier 2: The Infrastructure
3. **Dockerize It:** Create a `docker-compose.yml` that spins up the MySQL database, the Express API, the React client, and maybe a Redis instance all at once.
4. **Add CI/CD:** Set up a simple GitHub Action that runs `npm run lint` and `npm run test` every time you push to the `main` branch. 

### Tier 3: The "Wow" Factor (System Architect Architecture)
5. **Add a Caching Layer:** Implement Redis. Cache the results of the `GET /events` endpoint, and invalidate the cache when a new event is added or a ticket is sold. 
6. **Implement Background Jobs:** Extract email sending out of the main request loop. When a user registers or buys a ticket, drop a message into a queue (e.g., BullMQ) and have a background worker pick it up and send the Stripe receipt.

### Final Verdict
Right now, this is a **strong junior-level portfolio piece**. It proves you can build full-stack applications and integrate APIs.

If you implement the changes above (Testing, Docker, Concurrency handling, and Queues/Caching), it becomes a **highly competitive, FAANG-ready mid-level project** that gives you massive talking points during behavioral and system design interviews.
