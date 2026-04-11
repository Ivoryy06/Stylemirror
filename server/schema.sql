CREATE TABLE IF NOT EXISTS sessions (
    id             TEXT PRIMARY KEY,
    title          TEXT NOT NULL,
    profile        TEXT NOT NULL DEFAULT 'reflective',
    seed           TEXT NOT NULL DEFAULT '',
    continuation   TEXT NOT NULL DEFAULT '',
    samples_json   TEXT NOT NULL DEFAULT '[]',
    score_json     TEXT NOT NULL DEFAULT '{}',
    word_count     INTEGER NOT NULL DEFAULT 0,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
