import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/database.js';

export class Ticket {
  static create(ticketData) {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tickets (id, eventId, userId, attendeeName, attendeeEmail, qrCode, status, registeredAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, ticketData.eventId, ticketData.userId,
      ticketData.attendeeName, ticketData.attendeeEmail,
      ticketData.qrCode, ticketData.status || 'active', now
    );

    return this.findById(id);
  }

  static findById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  }

  static findByUser(userId) {
    const db = getDb();
    return db.prepare(`
      SELECT t.*, e.title as eventTitle, e.startDate, e.endDate, e.city, e.locationType, e.coverImage
      FROM tickets t
      JOIN events e ON t.eventId = e.id
      WHERE t.userId = ?
      ORDER BY t.registeredAt DESC
    `).all(userId);
  }

  static findByEvent(eventId) {
    const db = getDb();
    return db.prepare('SELECT * FROM tickets WHERE eventId = ? ORDER BY registeredAt DESC').all(eventId);
  }

  static findByUserAndEvent(userId, eventId) {
    const db = getDb();
    return db.prepare('SELECT * FROM tickets WHERE userId = ? AND eventId = ? AND status = ?').get(userId, eventId, 'active');
  }

  static findByQRCode(qrCode) {
    const db = getDb();
    return db.prepare('SELECT * FROM tickets WHERE qrCode = ?').get(qrCode);
  }

  static update(id, updates) {
    const db = getDb();
    const ALLOWED_FIELDS = ['attendeeName', 'attendeeEmail', 'status', 'checkedIn', 'checkedInAt'];
    const fields = Object.keys(updates).filter(k => ALLOWED_FIELDS.includes(k));
    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => updates[f]);

    db.prepare(`UPDATE tickets SET ${setClause} WHERE id = ?`).run(...values, id);
    return this.findById(id);
  }

  static cancel(id) {
    const db = getDb();
    db.prepare("UPDATE tickets SET status = 'cancelled' WHERE id = ?").run(id);
    return this.findById(id);
  }

  static checkIn(qrCode) {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare("UPDATE tickets SET checkedIn = 1, checkedInAt = ?, status = 'used' WHERE qrCode = ?").run(now, qrCode);
    return this.findByQRCode(qrCode);
  }
}
