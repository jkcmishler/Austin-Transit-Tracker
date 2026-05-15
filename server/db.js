import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || join(__dirname, "data.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id TEXT NOT NULL,
    stop_id TEXT NOT NULL,
    scheduled_arrival INTEGER NOT NULL,
    value TEXT NOT NULL CHECK (value IN ('showed','missed')),
    device_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE (trip_id, stop_id, scheduled_arrival, device_id)
  );

  CREATE INDEX IF NOT EXISTS idx_feedback_trip
    ON feedback (trip_id, stop_id, scheduled_arrival);

  CREATE TABLE IF NOT EXISTS delay_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    captured_at INTEGER NOT NULL,
    trip_id TEXT NOT NULL,
    route_id TEXT NOT NULL,
    next_stop_id TEXT NOT NULL,
    scheduled_arrival INTEGER NOT NULL,
    delay_sec INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_snapshots_route_time
    ON delay_snapshots (route_id, captured_at);
`);
