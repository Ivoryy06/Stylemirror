# StyleMirror

A writing assistant that learns your voice. Paste samples of your writing, and StyleMirror continues new pieces in your exact style — analyzing readability, vocabulary fingerprint, and originality along the way. All within your own local network.

Built with React + Vite (frontend) and Python/Flask (backend), powered by Ollama (fully local, no API key needed).

---

## Features

- **Style continuation** — generates new writing that matches your tone, voice, and vocabulary using Ollama
- **Readability scoring** — Flesch–Kincaid readability and grade level analysis
- **Vocabulary fingerprint** — type-token ratio, signature words, and content word frequency
- **Originality check** — n-gram similarity comparison against your own samples
- **Session persistence** — save, load, and delete writing sessions via SQLite
- **PDF export** — download your seed, continuation, and style score as a formatted PDF

---

## Stack

| Layer    | Tech                        |
|----------|-----------------------------|
| Frontend | React 18, Vite, plain CSS   |
| Backend  | Python 3.11+, Flask 3.x     |
| Database | SQLite (via `schema.sql`)   |
| AI       | Ollama (local)              |
| PDF      | fpdf2 (optional)            |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- [Ollama](https://ollama.com) installed and running locally

### 1. Ollama

```bash
# Install from https://ollama.com, then:
ollama pull llama3
ollama serve
```

### 2. Backend

```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

> To use a different model: `export OLLAMA_MODEL=mistral` (or any model you've pulled)

The API will be available at `http://localhost:8787`.

### 2. Frontend

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

> The Vite dev server proxies all `/api/*` requests to the backend, so no CORS configuration is needed.

---

## API Endpoints

| Method | Endpoint                 | Description                        |
|--------|--------------------------|------------------------------------|
| POST   | `/api/generate`          | Proxy Ollama call (streams)        |
| POST   | `/api/readability`       | Flesch–Kincaid scores for text     |
| POST   | `/api/vocab-fingerprint` | Vocabulary analysis for samples    |
| POST   | `/api/export-pdf`        | Export session as PDF              |
| POST   | `/api/originality`       | Similarity check against samples   |
| GET    | `/api/sessions`          | List saved sessions                |
| POST   | `/api/sessions`          | Save a session                     |
| GET    | `/api/sessions/:id`      | Load a session                     |
| DELETE | `/api/sessions/:id`      | Delete a session                   |
| GET    | `/api/health`            | Health check                       |

---

## Project Structure

```
Stylemirror/
├── StyleMirror.jsx       # Main React component
├── index.html
├── vite.config.js
├── src/
│   ├── main.jsx
│   └── index.css
├── server/
│   ├── app.py            # Flask API
│   ├── schema.sql        # SQLite schema
│   └── requirements.txt
├── scripts/
│   └── install.sh
└── public/
```

---

## License

MIT
