import { getDb } from '../config/database.js';

export function initDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT NOT NULL,
      imageUrl TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      interests TEXT,
      role TEXT DEFAULT 'user',
      freeEventsCreated INTEGER DEFAULT 0,
      isOnboarded INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      organizerId TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      timezone TEXT DEFAULT 'UTC',
      locationType TEXT DEFAULT 'physical',
      venue TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      capacity INTEGER NOT NULL,
      registrationCount INTEGER DEFAULT 0,
      ticketType TEXT DEFAULT 'free',
      ticketPrice REAL DEFAULT 0,
      coverImage TEXT,
      status TEXT DEFAULT 'published',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organizerId) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      userId TEXT NOT NULL,
      attendeeName TEXT NOT NULL,
      attendeeEmail TEXT NOT NULL,
      qrCode TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active',
      checkedIn INTEGER DEFAULT 0,
      checkedInAt TEXT,
      registeredAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (eventId) REFERENCES events(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active',
      expiresAt TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  console.log('Database initialized successfully');
  return db;
}

initDatabase();

export { getDb } from '../config/database.js';
