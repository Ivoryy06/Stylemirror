# StyleMirror

A writing assistant that learns your voice. Paste samples of your writing, seed a new piece, and StyleMirror continues it in your exact style — fully local, no API key needed.

Built with **React + Vite** (frontend) and **Python / Flask** (backend), powered by **Ollama**.

---

## Features

| Feature | Description |
|---|---|
| Style continuation | Streams a continuation that matches your tone, rhythm, and vocabulary |
| Readability scoring | Flesch–Kincaid score and grade level, live as you type |
| Vocabulary fingerprint | Type-token ratio, signature words, content word frequency |
| Tone analysis | Detects dominant mood across samples and continuation |
| Sentence heatmap | Visual breakdown of sentence length variation |
| Structure fingerprint | Avg sentence length, variance, punctuation habits |
| Style drift | Compares structural fingerprint of samples vs continuation |
| Originality check | N-gram similarity against your own samples |
| Word goal tracker | Set a target word count with a live progress bar |
| Output length control | Choose Short / Medium / Long before generating |
| Focus mode | Fullscreen distraction-free writing overlay |
| Sessions | Save, load, and delete writing sessions (SQLite) |
| PDF export | Download seed + continuation + style score as a PDF |
| Themes | 6 accent colour presets |
| Languages | EN 🇬🇧 · EN 🇺🇸 · ID · JA · FR · ES · DE · PT · VI |

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 5 |
| Backend | Python 3.11+, Flask 3.x |
| Database | SQLite (`schema.sql`) |
| AI | Ollama (local) |
| PDF | fpdf2 |

---

## Setup — Windows

### Prerequisites
- [Node.js 18+](https://nodejs.org)
- [Python 3.11+](https://www.python.org/downloads/)
- [Ollama for Windows](https://ollama.com/download/windows)

### 1. Install and start Ollama

Download and run the Ollama installer, then open **Command Prompt** or **PowerShell**:

```bat
ollama pull llama3
```

Ollama runs as a background service automatically after install. If it isn't running:

```bat
ollama serve
```

### 2. Start the backend

```bat
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The API will be available at `http://localhost:8787`.

> To use a different model, set the environment variable before starting:
> ```bat
> set OLLAMA_MODEL=mistral
> python app.py
> ```

### 3. Start the frontend

Open a **second** Command Prompt / PowerShell window in the project root:

```bat
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Setup — Linux / macOS

### Prerequisites
- Node.js 18+ — via [nvm](https://github.com/nvm-sh/nvm) or your package manager
- Python 3.11+ — usually pre-installed; check with `python3 --version`
- [Ollama](https://ollama.com/download)

### 1. Install and start Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3
ollama serve          # runs in the foreground; open a new terminal for the next steps
```

### 2. Start the backend

```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

The API will be available at `http://localhost:8787`.

> To use a different model:
> ```bash
> OLLAMA_MODEL=mistral python app.py
> ```

### 3. Start the frontend

Open a **new terminal** in the project root:

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Usage

1. **Style Samples tab** — paste 1–3 pieces you've written (essays, blog posts, journal entries). Each sample should be at least a paragraph.
2. **New Piece tab** — pick a style mode, write your opening sentences (30+ words), set an output length, then click *Continue in My Voice*.
3. **Output tab** — review the continuation alongside readability, tone, structure, and originality analysis. Save the session or export to PDF.
4. **Sessions tab** — reload any previously saved session.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/generate` | Streams Ollama continuation |
| POST | `/api/readability` | Flesch–Kincaid scores |
| POST | `/api/vocab-fingerprint` | Vocabulary analysis |
| POST | `/api/tone` | Tone / mood detection |
| POST | `/api/structure` | Structure fingerprint or drift |
| POST | `/api/originality` | N-gram similarity check |
| POST | `/api/export-pdf` | PDF export |
| GET | `/api/sessions` | List sessions |
| POST | `/api/sessions` | Save session |
| GET | `/api/sessions/:id` | Load session |
| DELETE | `/api/sessions/:id` | Delete session |
| GET | `/api/health` | Health check |

---

## Project Structure

```
Stylemirror/
├── StyleMirror.jsx       # Main React component (all UI + i18n)
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
