# StyleMirror

A writing assistant that learns your voice. Paste samples of your writing, seed a new piece, and StyleMirror continues it in your exact style.

**Hybrid AI mode** — uses Ollama locally when offline, and Groq when online.

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
| Style comparison | Paste any external text and see a side-by-side fingerprint diff |
| Revision suggestions | Highlights sentences that drift from your style, with reasons |
| Writing stats | Daily word count chart, streak counter, and total words written |
| Context note | Add a one-line context hint that guides generation |
| Inline editing | Edit the continuation in-place and re-analyse without regenerating |
| Sample quality warnings | Flags samples that are too short or have repetitive vocabulary |
| Themes | Custom accent and background colour pickers |
| Languages | EN 🇬🇧 · EN 🇺🇸 · ID · JA · FR · ES · DE · PT · VI |

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 5 |
| Backend | Python 3.11+, Flask 3.x |
| Database | SQLite |
| AI | Ollama (local) · Groq — Llama 3 |
| PDF | fpdf2 |

---

## Requirements

- [Node.js 18+](https://nodejs.org)
- [Python 3.11+](https://www.python.org/downloads/)
- [Git](https://git-scm.com)

### Offline / local AI (Ollama)

> ⚠️ **Hardware requirement:** Running Ollama locally requires a minimum of **16 GB RAM** and a **dedicated GPU** (NVIDIA or AMD with ≥ 8 GB VRAM). On machines below this spec, generation will be extremely slow or fail entirely.
>
> If your device doesn't meet this requirement, use the **web version** at [ivoryy06.github.io/Stylemirror](https://ivoryy06.github.io/Stylemirror) with a Groq API key instead — free, no local hardware needed.

---

## Installation

### Step 1 — Install Ollama and pull a model (local mode only)

Download Ollama from [ollama.com](https://ollama.com), install it, then run:

```bash
ollama pull llama3
```

### Step 2 — Clone the repo

```bash
git clone https://github.com/Ivoryy06/Stylemirror.git
cd Stylemirror
```

---

## Running

Open **two separate terminals**.

**Terminal 1 — backend:**
```bash
cd server
python -m venv venv && source venv/bin/activate   # Linux/macOS
pip install -r requirements.txt
python app.py
```

**Terminal 2 — frontend:**
```bash
npm install
npm run dev
```

Visit `http://localhost:5173` ✅

---

## Configuration

### Hybrid AI mode

| Situation | Provider | Key needed? |
|---|---|---|
| Offline / localhost | Ollama (local) | No (requires 16 GB RAM + GPU) |
| Online | Groq — Llama 3 | Yes — free at [console.groq.com](https://console.groq.com) |

To pre-configure the Groq key on the server:

```bash
GROQ_API_KEY=gsk_... python3 app.py
```

### Other options

| Variable | Default | Description |
|---|---|---|
| `LLM_MODEL` | `llama3` | Any model pulled with `ollama pull` |
| `OPENAI_BASE_URL` | `http://localhost:11434/v1` | Ollama API URL |
| `GROQ_API_KEY` | — | Groq key (online mode) |

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
| POST | `/api/style-compare` | Side-by-side fingerprint diff |
| POST | `/api/revision-suggestions` | Sentences that drift from your style |
| POST | `/api/export-pdf` | PDF export |
| POST | `/api/export-md` | Markdown export |
| GET | `/api/sessions` | List sessions |
| POST | `/api/sessions` | Save session |
| GET | `/api/sessions/:id` | Load session |
| DELETE | `/api/sessions/:id` | Delete session |
| GET | `/api/health` | Health check |

---

## License

MIT
