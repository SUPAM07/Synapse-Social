const { pgTable, text, timestamp, boolean, integer, real, pgEnum, uuid } = require('drizzle-orm/pg-core');

const locationTypeEnum = pgEnum('location_type', ['physical', 'online']);
const ticketTypeEnum = pgEnum('ticket_type', ['free', 'paid']);
const registrationStatusEnum = pgEnum('registration_status', ['confirmed', 'cancelled']);
const sessionStatusEnum = pgEnum('session_status', ['active', 'revoked']);

const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  imageUrl: text('image_url'),
  hasCompletedOnboarding: boolean('has_completed_onboarding').notNull().default(false),
  locationCity: text('location_city'),
  locationState: text('location_state'),
  locationCountry: text('location_country'),
  interests: text('interests').array(),
  freeEventsCreated: integer('free_events_created').notNull().default(0),
  role: text('role').notNull().default('attendee'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  slug: text('slug').notNull().unique(),
  organizerId: uuid('organizer_id').notNull().references(() => users.id),
  organizerName: text('organizer_name').notNull(),
  category: text('category').notNull(),
  tags: text('tags').array().notNull().default([]),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  timezone: text('timezone').notNull(),
  locationType: locationTypeEnum('location_type').notNull(),
  venue: text('venue'),
  address: text('address'),
  city: text('city').notNull(),
  state: text('state'),
  country: text('country').notNull(),
  capacity: integer('capacity').notNull(),
  ticketType: ticketTypeEnum('ticket_type').notNull(),
  ticketPrice: real('ticket_price'),
  registrationCount: integer('registration_count').notNull().default(0),
  coverImage: text('cover_image'),
  themeColor: text('theme_color').default('#1e3a8a'),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  attendeeName: text('attendee_name').notNull(),
  attendeeEmail: text('attendee_email').notNull(),
  qrCode: text('qr_code').notNull().unique(),
  checkedIn: boolean('checked_in').notNull().default(false),
  checkedInAt: timestamp('checked_in_at'),
  status: registrationStatusEnum('status').notNull().default('confirmed'),
  registeredAt: timestamp('registered_at').notNull().defaultNow(),
});

const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  status: sessionStatusEnum('status').notNull().default('active'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

module.exports = { users, events, tickets, sessions, locationTypeEnum, ticketTypeEnum, registrationStatusEnum, sessionStatusEnum };
