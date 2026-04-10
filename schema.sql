-- StyleMirror Database Schema
-- SQLite 3.x

CREATE TABLE IF NOT EXISTS sessions (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    profile       TEXT NOT NULL DEFAULT 'reflective',
    seed          TEXT NOT NULL DEFAULT '',
    continuation  TEXT NOT NULL DEFAULT '',
    samples_json  TEXT NOT NULL DEFAULT '[]',
    score_json    TEXT NOT NULL DEFAULT '{}',
    word_count    INTEGER NOT NULL DEFAULT 0,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS style_history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id    TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    confidence    INTEGER,
    traits_json   TEXT DEFAULT '[]',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vocab_snapshots (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_hash TEXT NOT NULL UNIQUE,
    ttr           REAL,
    signature_json TEXT DEFAULT '[]',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_session  ON style_history(session_id);

-- trigger: auto-update updated_at
CREATE TRIGGER IF NOT EXISTS sessions_updated
    AFTER UPDATE ON sessions
    BEGIN
        UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
