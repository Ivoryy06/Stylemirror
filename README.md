# StyleMirror

A writing assistant that learns your voice. Paste samples of your writing, seed a new piece, and StyleMirror continues it in your exact style — fully local, no API keys, no subscriptions.

Powered by **[Ollama](https://ollama.com)** running on your own machine.

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
| Database | SQLite |
| AI | Ollama (local) |
| PDF | fpdf2 |

---

## Requirements

- [Ollama](https://ollama.com) — runs the AI model locally
- [Node.js 18+](https://nodejs.org)
- [Python 3.11+](https://www.python.org/downloads/)
- [Git](https://git-scm.com)

---

## Installation

### Step 1 — Install Ollama and pull a model

Download Ollama from [ollama.com](https://ollama.com), install it, then run:

```bash
ollama pull llama3
```

That's the only AI setup needed. No accounts, no keys.

---

### Step 2 — Clone the repo

```bash
git clone https://github.com/Ivoryy06/Stylemirror.git
cd stylemirror
```

---

## 🖥️ Windows / Linux / macOS

Open **two separate terminals**.

**Terminal 1 — backend** (run from the `server` folder):
```bash
cd server

# Create and activate the virtual environment:
python -m venv venv                  # Windows
python3 -m venv venv                 # Linux / macOS

venv\Scripts\activate                # Windows
source venv/bin/activate             # Linux / macOS

pip install -r requirements.txt

python app.py                        # Windows
python3 app.py                       # Linux / macOS
```

**Terminal 2 — frontend** (run from the project root):
```bash
npm install
npm run dev
```

Visit `http://localhost:5173` ✅

---

## 📱 Android (Termux)

StyleMirror can run entirely on Android using [Termux](https://termux.dev).

Install Termux from [F-Droid](https://f-droid.org/packages/com.termux/) (not the Play Store version — it's outdated).

**All commands below are typed inside the Termux app.**

**1. Install dependencies:**
```bash
pkg update && pkg upgrade -y
pkg install -y git nodejs python
```

**2. Install Ollama for Android:**
```bash
pkg install -y ollama
ollama serve &
ollama pull llama3
```

> If `ollama` isn't available via `pkg`, install it via the [Ollama Linux ARM64 binary](https://ollama.com/download/linux) and place it in `~/bin`.

**3. Clone and set up the backend** (still in Termux):
```bash
git clone https://github.com/Ivoryy06/Stylemirror.git
cd stylemirror/server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py &
```

**4. Set up and run the frontend** (open a second Termux session with a long-press swipe, or use `tmux`):
```bash
cd ~/stylemirror
npm install
npm run dev
```

Open `http://localhost:5173` in your Android browser ✅

> **Tip:** Use `tmux` to manage multiple sessions in one Termux window — `pkg install tmux`, then `tmux new-session` and split panes with `Ctrl+B %`.

---

## Usage

1. **Style Samples tab** — paste 1–3 pieces you've written (essays, blog posts, journal entries). Each sample should be at least a paragraph.
2. **New Piece tab** — pick a style mode, write your opening sentences (30+ words), set an output length, then click *Continue in My Voice*.
3. **Output tab** — review the continuation alongside readability, tone, structure, and originality analysis. Save the session or export to PDF.
4. **Sessions tab** — reload any previously saved session.

---

## Configuration

No configuration is required for local use. If you want to change the model or point to a remote Ollama instance, set these environment variables before starting the backend:

| Variable | Default | Description |
|---|---|---|
| `LLM_MODEL` | `llama3` | Any model you've pulled with `ollama pull` |
| `OPENAI_BASE_URL` | `http://localhost:11434/v1` | Ollama API URL |

Example with a different model:
```bash
LLM_MODEL=mistral python3 app.py
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/generate` | Streams LLM continuation (SSE) |
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
stylemirror/
├── StyleMirror.jsx       # Main React component (all UI + i18n)
├── index.html
├── vite.config.js        # Dev server on :5173, proxies /api → :8787
├── package.json
├── .env.example
├── src/
│   ├── main.jsx
│   └── index.css
├── server/
│   ├── app.py            # Flask API — runs on port 8787
│   ├── schema.sql
│   ├── requirements.txt
│   └── stylemirror.db    # Created automatically on first run
├── scripts/
│   └── install.sh        # Optional one-shot installer (Linux/macOS)
└── public/
```

---

## License

MIT
