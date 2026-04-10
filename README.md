# StyleMirror v2.0

> **Your voice, continued.**  
> A full-stack AI writing assistant that mirrors your unique style.

---

## Stack

| Layer    | Language / Tech           | Location            |
|----------|---------------------------|---------------------|
| Frontend | React 18 + JSX + CSS      | `src/`              |
| Backend  | Python 3.11 + Flask 3     | `server/app.py`     |
| Database | SQL (SQLite 3)            | `db/schema.sql`     |
| CLI tool | Rust (2021 edition)       | `cli/src/main.rs`   |
| Installer| Bash                      | `scripts/install.sh`|

---

## Quick Start

```bash
# 1 — clone and install everything
git clone https://github.com/yourname/stylemirror
cd stylemirror
bash scripts/install.sh

# 2 — start Python backend (terminal A)
cd server && source venv/bin/activate && python app.py

# 3 — start React frontend (terminal B)
npm run dev
# → http://localhost:5173
```

---

## Five New Features (v2.0)

### 1. Readability Scoring  `Python → JSX`
Flesch–Kincaid readability score computed server-side by `server/app.py`.  
Displayed live as you type your seed and on every generated continuation.

**Endpoint:** `POST /api/readability`  
```json
{ "text": "..." }
→ { "flesch": 68.4, "grade": 9.2, "level": "Standard", "avg_sentence_len": 18.3, ... }
```

### 2. Vocabulary Fingerprint  `Python → JSX`
Analyses type–token ratio, signature words, and top content words across all your style samples.

**Endpoint:** `POST /api/vocab-fingerprint`  
```json
{ "samples": ["essay text 1", "essay text 2"] }
→ { "ttr": 0.423, "signature_words": ["nevertheless","liminal",...], ... }
```

### 3. PDF Export  `Python (fpdf2) → JSX`
One-click download of the full seed + continuation as a styled PDF, with style score embedded.

**Endpoint:** `POST /api/export-pdf` → returns `application/pdf`

### 4. Session Persistence  `Python + SQLite → JSX`
Save any generation to SQLite. Load, browse, or delete past sessions from the Sessions tab.

**Endpoints:**
- `GET  /api/sessions`         — list all
- `POST /api/sessions`         — save new
- `GET  /api/sessions/:id`     — load one
- `DELETE /api/sessions/:id`   — delete one

### 5. Originality Check  `Python → JSX`
4-gram Jaccard similarity between the new continuation and your saved style samples — flags self-plagiarism or over-repetition.

**Endpoint:** `POST /api/originality`  
```json
{ "text": "...", "samples": [{ "title": "...", "text": "..." }] }
→ { "originality_pct": 87.3, "flag": false, "matches": [...] }
```

---

## Rust CLI

```bash
# analyse a single file
stylemirror-cli analyze myessay.txt

# compare two files for similarity
stylemirror-cli compare draft1.txt draft2.txt
```

Outputs: Flesch score, grade level, type–token ratio, top content words, ASCII sentence-length heatmap.

---

## File Map

```
stylemirror/
├── src/
│   ├── StyleMirror.jsx      ← main React app (all UI + API calls)
│   ├── main.jsx             ← React entry point
│   └── styles/
│       └── index.css        ← animations, heatmap classes, dark mode, print
├── server/
│   ├── app.py               ← Flask API (5 feature endpoints)
│   └── requirements.txt
├── db/
│   └── schema.sql           ← SQLite schema (sessions, style_history, vocab_snapshots)
├── cli/
│   ├── Cargo.toml
│   └── src/main.rs          ← Rust offline analysis CLI
├── scripts/
│   └── install.sh           ← Bash installer (Node + Python + Rust)
├── package.json
├── vite.config.js           ← Vite proxy → Python backend
├── index.html
└── README.md
```

---

## Environment

`.env` (auto-created by installer):
```env
VITE_API_BASE=http://localhost:8787
PORT=8787
```

---

## Backend Health Check

```bash
curl http://localhost:8787/api/health
# → { "status": "ok", "has_pdf": true, "version": "2.0.0" }
```
