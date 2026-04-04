import pg from 'pg';
import { env } from './config.js';

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: env.postgresUri });
  }
  return pool;
}

export async function initDB() {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id          SERIAL PRIMARY KEY,
        user_id     VARCHAR(100)  NOT NULL,
        event_id    VARCHAR(100)  NOT NULL,
        status      VARCHAR(20)   NOT NULL DEFAULT 'confirmed'
                    CHECK (status IN ('confirmed', 'cancelled', 'attended')),
        qr_code     TEXT,
        booked_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
        cancelled_at TIMESTAMP,
        UNIQUE (user_id, event_id)
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings (event_id, status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_user  ON bookings (user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_time  ON bookings (booked_at DESC);`);
    console.log('Booking service: PostgreSQL schema initialised');
  } finally {
    client.release();
  }
}
