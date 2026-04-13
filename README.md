# StyleMirror

A writing assistant that learns your voice. Paste samples of your writing, seed a new piece, and StyleMirror continues it in your exact style.

**Hybrid AI mode** — uses Ollama locally when offline, and lets you pick ChatGPT or Gemini when online.

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
| Markdown export | Download seed + continuation + style score as a `.md` file |
| Style comparison | Paste any external text and see a side-by-side fingerprint diff against your own style |
| Revision suggestions | Highlights individual sentences in the continuation that drift from your style, with reasons |
| Writing stats | Daily word count chart, streak counter, and total words written |
| Context note | Add a one-line context hint (genre, register) that guides generation without overriding style learning |
| Inline editing | Edit the continuation in-place and re-analyse without regenerating |
| Sample quality warnings | Flags samples that are too short or have repetitive vocabulary before you generate |
| Themes | Custom accent and background colour pickers |
| Languages | EN 🇬🇧 · EN 🇺🇸 · ID · JA · FR · ES · DE · PT · VI |

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 5 |
| Backend | Python 3.11+, Flask 3.x |
| Database | SQLite |
| AI | Ollama (local) · OpenAI · Gemini |
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

### Hybrid AI mode

StyleMirror automatically switches AI provider based on your connection:

| Situation | Provider | Key needed? |
|---|---|---|
| Offline / localhost | Ollama (local) | No |
| Online — ChatGPT | OpenAI `gpt-4o-mini` | Yes (paste in UI or set `OPENAI_API_KEY`) |
| Online — Gemini | Google `gemini-1.5-flash` | Yes (paste in UI or set `GEMINI_API_KEY`) |

When you're online, a **ChatGPT / Gemini** toggle appears above the generate button. Paste your API key there — it's saved to `localStorage` and never sent anywhere except the respective provider's API (via your own backend).

To pre-configure keys on the server instead of entering them in the UI:

```bash
OPENAI_API_KEY=sk-...   python3 app.py   # ChatGPT
GEMINI_API_KEY=AIza...  python3 app.py   # Gemini
```

### Other options

No configuration is required for local/offline use. To change the Ollama model or point to a remote instance:

| Variable | Default | Description |
|---|---|---|
| `LLM_MODEL` | `llama3` | Any model you've pulled with `ollama pull` |
| `OPENAI_BASE_URL` | `http://localhost:11434/v1` | Ollama API URL |
| `OPENAI_API_KEY` | — | OpenAI key (ChatGPT, online mode) |
| `GEMINI_API_KEY` | — | Google Gemini key (online mode) |

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
| POST | `/api/style-compare` | Side-by-side fingerprint diff vs external text |
| POST | `/api/revision-suggestions` | Sentences that drift from your style |
| POST | `/api/export-pdf` | PDF export |
| POST | `/api/export-md` | Markdown export |
| GET | `/api/sessions` | List sessions |
| POST | `/api/sessions` | Save session |
| GET | `/api/sessions/:id` | Load session |
| DELETE | `/api/sessions/:id` | Delete session |
| GET | `/api/sessions/stats` | Word counts per day (last 30 days) |
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
