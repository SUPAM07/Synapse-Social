import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/database.js';
import { sanitizeUser } from '../utils/helpers.js';

export class User {
  static create(userData) {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();
    const interests = userData.interests ? JSON.stringify(userData.interests) : null;

    db.prepare(`
      INSERT INTO users (id, email, passwordHash, name, imageUrl, city, state, country, interests, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, userData.email, userData.passwordHash, userData.name,
      userData.imageUrl || null, userData.city || null, userData.state || null,
      userData.country || null, interests, userData.role || 'user', now, now
    );

    return this.findById(id);
  }

  static findById(id) {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return null;
    if (user.interests) {
      try { user.interests = JSON.parse(user.interests); } catch { user.interests = []; }
    }
    return user;
  }

  static findByEmail(email) {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return null;
    if (user.interests) {
      try { user.interests = JSON.parse(user.interests); } catch { user.interests = []; }
    }
    return user;
  }

  static update(id, updates) {
    const db = getDb();
    const now = new Date().toISOString();

    const ALLOWED_FIELDS = ['name', 'imageUrl', 'city', 'state', 'country', 'interests',
      'role', 'freeEventsCreated', 'isOnboarded'];

    if (updates.interests && Array.isArray(updates.interests)) {
      updates.interests = JSON.stringify(updates.interests);
    }

    const fields = Object.keys(updates).filter(k => ALLOWED_FIELDS.includes(k));
    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => updates[f]);

    db.prepare(`UPDATE users SET ${setClause}, updatedAt = ? WHERE id = ?`).run(...values, now, id);
    return this.findById(id);
  }

  static delete(id) {
    const db = getDb();
    return db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }

  static incrementFreeEventsCreated(id) {
    const db = getDb();
    db.prepare('UPDATE users SET freeEventsCreated = freeEventsCreated + 1 WHERE id = ?').run(id);
  }
}
