# StyleMirror

A writing assistant that learns your voice. Paste samples of your writing, seed a new piece, and StyleMirror continues it in your exact style.

Built with **React + Vite** (frontend) and **Python / Flask** (backend), powered by any **OpenAI-compatible LLM API**.

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
| AI | Any OpenAI-compatible API (OpenAI, Groq, Mistral, Ollama) |
| PDF | fpdf2 |

---

## LLM Providers

The backend uses any OpenAI-compatible API. Set these environment variables:

| Variable | Description | Default |
|---|---|---|
| `OPENAI_API_KEY` | Your API key | *(required)* |
| `OPENAI_BASE_URL` | API base URL | `https://api.openai.com/v1` |
| `LLM_MODEL` | Model name | `gpt-4o-mini` |

**Provider examples:**

| Provider | `OPENAI_BASE_URL` | `LLM_MODEL` | Notes |
|---|---|---|---|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` | |
| Groq | `https://api.groq.com/openai/v1` | `llama3-8b-8192` | Free tier |
| Mistral | `https://api.mistral.ai/v1` | `mistral-small-latest` | Free tier |
| Ollama (local) | `http://localhost:11434/v1` | `llama3` | No key needed — set `OPENAI_API_KEY=ollama` |

---

## Setup — Local

### 🪟 Windows

**Prerequisites:** [Node.js 18+](https://nodejs.org), [Python 3.11+](https://www.python.org/downloads/), an API key

**1. Configure environment**
```bat
copy .env.example .env
:: edit .env and set OPENAI_API_KEY (and optionally OPENAI_BASE_URL / LLM_MODEL)
```

**2. Start the backend**
```bat
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

**3. Start the frontend**
```bat
cd ..
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

### 🐧 Linux / macOS

**Prerequisites:** [Node.js 18+](https://nodejs.org), [Python 3.11+](https://www.python.org/downloads/), an API key

**1. Configure environment**
```bash
cp .env.example .env
# edit .env and set OPENAI_API_KEY (and optionally OPENAI_BASE_URL / LLM_MODEL)
```

**2. Start the backend**
```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

**3. Start the frontend**
```bash
cd ..
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

### 📱 Android / iOS

StyleMirror does not have a native mobile app. To use it on Android or iOS:

1. **Deploy the backend** to a cloud provider (see [Deployment](#deployment) below) so it's reachable over the internet.
2. **Deploy the frontend** to Vercel or Netlify and set `VITE_API_BASE` to your backend URL.
3. Open the deployed frontend URL in your mobile browser (Chrome on Android, Safari on iOS).

The web app is fully responsive and works in mobile browsers without any installation required.

---

## Deployment

### Backend — Railway / Render / Fly.io

The repo includes a `Procfile` for one-command deploys.

**Railway (recommended):**

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Then set environment variables in the Railway dashboard:
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL` *(if not using OpenAI)*
- `LLM_MODEL` *(if not using gpt-4o-mini)*

**Render:** connect the repo, set root directory to `/`, build command to `pip install -r server/requirements.txt`, start command to `gunicorn --chdir server app:app`.

### Frontend — Vercel / Netlify

```bash
npm install -g vercel
vercel
```

Set `VITE_API_BASE` to your deployed backend URL (e.g. `https://your-app.railway.app`) in the Vercel dashboard, then redeploy.

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
Stylemirror/
├── StyleMirror.jsx       # Main React component (all UI + i18n)
├── index.html
├── vite.config.js
├── Procfile              # For Railway / Render / Heroku
├── .env.example          # Environment variable template
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
