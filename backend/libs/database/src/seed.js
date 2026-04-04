require('dotenv').config();
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const bcrypt = require('bcrypt');
const { users, events } = require('./schema/index');

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const [user] = await db.insert(users).values({
    email: 'demo@example.com',
    passwordHash,
    name: 'Demo User',
    hasCompletedOnboarding: true,
    locationCity: 'San Francisco',
    locationCountry: 'US',
    interests: ['technology', 'music', 'sports'],
    role: 'organizer',
  }).returning();

  await db.insert(events).values({
    title: 'Tech Conference 2025',
    description: 'Annual technology conference featuring the latest innovations',
    slug: 'tech-conference-2025',
    organizerId: user.id,
    organizerName: user.name,
    category: 'technology',
    tags: ['tech', 'innovation', 'networking'],
    startDate: new Date('2025-06-01T09:00:00Z'),
    endDate: new Date('2025-06-01T18:00:00Z'),
    timezone: 'America/Los_Angeles',
    locationType: 'physical',
    venue: 'Moscone Center',
    address: '747 Howard St',
    city: 'San Francisco',
    state: 'CA',
    country: 'US',
    capacity: 500,
    ticketType: 'paid',
    ticketPrice: 99.99,
  });

  console.log('Seed complete');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
