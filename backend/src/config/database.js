import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { config } from './env.js';

let db = null;

export function getDb() {
  if (!db) {
    mkdirSync(dirname(config.DB_PATH), { recursive: true });
    db = new Database(config.DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}
