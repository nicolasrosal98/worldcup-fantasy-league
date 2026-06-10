import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let db;

export function getDb() {
  if (db) return db;
  db = new Database(path.join(DATA_DIR, 'league.db'));
  db.pragma('journal_mode = WAL');
  init(db);
  return db;
}

function init(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      avatar TEXT NOT NULL DEFAULT '⚽',
      winner_pick TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage TEXT NOT NULL,
      home TEXT NOT NULL,
      away TEXT NOT NULL,
      kickoff TEXT NOT NULL,            -- ISO datetime UTC
      venue TEXT,
      home_score INTEGER,               -- null until result entered
      away_score INTEGER,
      scorers TEXT,                     -- JSON array of player names
      notes TEXT                        -- extra match info (cards, MOTM, etc.)
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      match_id INTEGER NOT NULL REFERENCES matches(id),
      home_score INTEGER NOT NULL,
      away_score INTEGER NOT NULL,
      scorers TEXT NOT NULL DEFAULT '[]',  -- JSON array, predicted scorers (max 3)
      first_goal_half INTEGER,             -- 1 or 2, bonus bet (null = no bet)
      boost INTEGER NOT NULL DEFAULT 0,    -- daily boost: doubles match points
      points INTEGER,                      -- computed when result entered
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, match_id)
    );
  `);

  const count = db.prepare('SELECT COUNT(*) AS c FROM matches').get().c;
  if (count === 0) seedMatches(db);
}

// Opening week of the 2026 World Cup. Results are entered via /admin as
// matches finish; more fixtures can be added there too.
function seedMatches(db) {
  const fixtures = [
    ['Group A', 'Mexico', 'South Africa', '2026-06-11T19:00:00Z', 'Estadio Azteca, Mexico City'],
    ['Group A', 'South Korea', 'Jordan', '2026-06-12T01:00:00Z', 'Estadio Akron, Guadalajara'],
    ['Group B', 'Canada', 'Switzerland', '2026-06-12T19:00:00Z', 'BMO Field, Toronto'],
    ['Group B', 'Qatar', 'Norway', '2026-06-12T22:00:00Z', 'BC Place, Vancouver'],
    ['Group D', 'USA', 'Paraguay', '2026-06-12T23:00:00Z', 'SoFi Stadium, Los Angeles'],
    ['Group C', 'Brazil', 'Morocco', '2026-06-13T17:00:00Z', 'MetLife Stadium, New York/New Jersey'],
    ['Group C', 'Croatia', 'Ghana', '2026-06-13T20:00:00Z', 'Gillette Stadium, Boston'],
    ['Group E', 'Germany', 'Ecuador', '2026-06-13T23:00:00Z', 'NRG Stadium, Houston'],
    ['Group D', 'Australia', 'Tunisia', '2026-06-14T00:00:00Z', 'Levi’s Stadium, San Francisco'],
    ['Group F', 'Netherlands', 'Japan', '2026-06-14T17:00:00Z', 'AT&T Stadium, Dallas'],
    ['Group E', 'Ivory Coast', 'Uzbekistan', '2026-06-14T20:00:00Z', 'Arrowhead Stadium, Kansas City'],
    ['Group G', 'Belgium', 'Egypt', '2026-06-14T23:00:00Z', 'Lumen Field, Seattle'],
    ['Group F', 'Uruguay', 'Saudi Arabia', '2026-06-15T00:00:00Z', 'Estadio BBVA, Monterrey'],
    ['Group H', 'Spain', 'New Zealand', '2026-06-15T17:00:00Z', 'Mercedes-Benz Stadium, Atlanta'],
    ['Group G', 'Senegal', 'Panama', '2026-06-15T20:00:00Z', 'Hard Rock Stadium, Miami'],
    ['Group H', 'Colombia', 'Scotland', '2026-06-15T23:00:00Z', 'Lincoln Financial Field, Philadelphia'],
    ['Group I', 'France', 'Curacao', '2026-06-16T17:00:00Z', 'MetLife Stadium, New York/New Jersey'],
    ['Group I', 'Austria', 'Algeria', '2026-06-16T20:00:00Z', 'BMO Field, Toronto'],
    ['Group J', 'Argentina', 'Iran', '2026-06-16T23:00:00Z', 'SoFi Stadium, Los Angeles'],
    ['Group J', 'Denmark', 'Cape Verde', '2026-06-17T00:00:00Z', 'Estadio Azteca, Mexico City'],
    ['Group K', 'England', 'Haiti', '2026-06-17T17:00:00Z', 'NRG Stadium, Houston'],
    ['Group K', 'Ukraine', 'Jamaica', '2026-06-17T20:00:00Z', 'Gillette Stadium, Boston'],
    ['Group L', 'Portugal', 'Uzbekistan', '2026-06-17T23:00:00Z', 'AT&T Stadium, Dallas'],
    ['Group L', 'Italy', 'Costa Rica', '2026-06-18T00:00:00Z', 'Lumen Field, Seattle'],
  ];
  const ins = db.prepare(
    'INSERT INTO matches (stage, home, away, kickoff, venue) VALUES (?, ?, ?, ?, ?)'
  );
  for (const f of fixtures) ins.run(...f);
}
