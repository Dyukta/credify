import DatabaseConstructor, { Database } from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "credify.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db: Database = new DatabaseConstructor(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS analysis_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    url_hash TEXT NOT NULL UNIQUE,
    domain TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    risk_level TEXT NOT NULL,
    confidence INTEGER NOT NULL,
    signals TEXT NOT NULL,
    safety_checklist TEXT NOT NULL,
    analyzed_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_analysis_url_hash ON analysis_results(url_hash);
  CREATE INDEX IF NOT EXISTS idx_analysis_domain ON analysis_results(domain);
  CREATE INDEX IF NOT EXISTS idx_analysis_created ON analysis_results(created_at);

  CREATE TABLE IF NOT EXISTS domain_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL UNIQUE,
    domain_age_days INTEGER,
    web_presence_resolves INTEGER,
    web_presence_status_code INTEGER,
    is_job_board INTEGER NOT NULL DEFAULT 0,
    whois_last_checked TEXT,
    presence_last_checked TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_domain_cache_domain ON domain_cache(domain);
`);

export default db;