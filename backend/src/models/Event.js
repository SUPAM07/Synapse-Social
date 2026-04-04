import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/database.js';

function parseEvent(event) {
  if (!event) return null;
  if (event.tags) {
    try { event.tags = JSON.parse(event.tags); } catch { event.tags = []; }
  }
  return event;
}

export class Event {
  static create(eventData) {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();
    const tags = eventData.tags ? JSON.stringify(eventData.tags) : null;

    db.prepare(`
      INSERT INTO events (id, title, description, slug, organizerId, category, tags,
        startDate, endDate, timezone, locationType, venue, address, city, state, country,
        capacity, ticketType, ticketPrice, coverImage, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, eventData.title, eventData.description, eventData.slug, eventData.organizerId,
      eventData.category, tags, eventData.startDate, eventData.endDate,
      eventData.timezone || 'UTC', eventData.locationType || 'physical',
      eventData.venue || null, eventData.address || null, eventData.city || null,
      eventData.state || null, eventData.country || null, eventData.capacity,
      eventData.ticketType || 'free', eventData.ticketPrice || 0,
      eventData.coverImage || null, eventData.status || 'published', now, now
    );

    return this.findById(id);
  }

  static findById(id) {
    const db = getDb();
    return parseEvent(db.prepare('SELECT * FROM events WHERE id = ?').get(id));
  }

  static findBySlug(slug) {
    const db = getDb();
    return parseEvent(db.prepare('SELECT * FROM events WHERE slug = ?').get(slug));
  }

  static findAll(filters = {}, pagination = {}) {
    const db = getDb();
    let query = 'SELECT * FROM events WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    } else {
      query += " AND status = 'published'";
    }

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.city) {
      query += ' AND city = ?';
      params.push(filters.city);
    }

    if (filters.country) {
      query += ' AND country = ?';
      params.push(filters.country);
    }

    if (filters.organizerId) {
      query += ' AND organizerId = ?';
      params.push(filters.organizerId);
    }

    if (filters.search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const total = db.prepare(countQuery).get(...params).count;

    query += ' ORDER BY createdAt DESC';

    if (pagination.limit !== undefined) {
      query += ' LIMIT ? OFFSET ?';
      params.push(pagination.limit, pagination.offset || 0);
    }

    const events = db.prepare(query).all(...params);
    return { events: events.map(parseEvent), total };
  }

  static findByOrganizer(organizerId) {
    const db = getDb();
    const events = db.prepare('SELECT * FROM events WHERE organizerId = ? ORDER BY createdAt DESC').all(organizerId);
    return events.map(parseEvent);
  }

  static update(id, updates) {
    const db = getDb();
    const now = new Date().toISOString();

    if (updates.tags && Array.isArray(updates.tags)) {
      updates.tags = JSON.stringify(updates.tags);
    }

    const fields = Object.keys(updates).filter(k => k !== 'id');
    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => updates[f]);

    db.prepare(`UPDATE events SET ${setClause}, updatedAt = ? WHERE id = ?`).run(...values, now, id);
    return this.findById(id);
  }

  static delete(id) {
    const db = getDb();
    return db.prepare('DELETE FROM events WHERE id = ?').run(id);
  }

  static incrementRegistrationCount(id) {
    const db = getDb();
    db.prepare('UPDATE events SET registrationCount = registrationCount + 1 WHERE id = ?').run(id);
  }

  static decrementRegistrationCount(id) {
    const db = getDb();
    db.prepare('UPDATE events SET registrationCount = MAX(0, registrationCount - 1) WHERE id = ?').run(id);
  }
}
