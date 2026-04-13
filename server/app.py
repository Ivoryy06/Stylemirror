"""
StyleMirror Backend Server
Python 3.11+ | Flask 3.x
Provides: readability scoring, vocabulary fingerprinting, PDF export,
          session persistence, and originality checking.
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3, json, re, io, os, hashlib, datetime
from collections import Counter
from pathlib import Path

# ── optional heavy deps (graceful fallback) ──────────────────────────────────
try:
    from fpdf import FPDF
    HAS_PDF = True
except ImportError:
    HAS_PDF = False

try:
    import nltk
    from nltk.corpus import stopwords
    nltk.download("stopwords", quiet=True)
    STOPWORDS = set(stopwords.words("english"))
except Exception:
    STOPWORDS = {"the","a","an","and","or","but","in","on","at","to","for",
                 "of","with","by","is","was","are","were","be","been","have",
                 "has","had","do","does","did","will","would","could","should"}

app = Flask(__name__)
CORS(app)  # allow all origins — restrict to your frontend domain in production

# ── FIX: DB and schema live in the same directory as app.py (repo root) ──────
ROOT     = Path(__file__).parent          # repo root (where app.py lives)
DB_PATH  = ROOT / "stylemirror.db"
SCHEMA   = ROOT / "schema.sql"


# ── database helpers ──────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_db() as conn:
        conn.executescript(SCHEMA.read_text())


# ── FEATURE 1: Flesch–Kincaid readability scoring ────────────────────────────

def count_syllables(word: str) -> int:
    word = word.lower().strip(".,!?;:'\"")
    if len(word) <= 3:
        return 1
    word = re.sub(r"(?:[^aeiou]es|ed|[^aeiou]e)$", "", word)
    count = len(re.findall(r"[aeiou]+", word))
    return max(1, count)


def readability_scores(text: str) -> dict:
    sentences = re.split(r"[.!?]+", text.strip())
    sentences = [s.strip() for s in sentences if s.strip()]
    words     = re.findall(r"\b\w+\b", text)
    if not sentences or not words:
        return {"flesch": 0, "grade": 0, "level": "N/A", "avg_sentence_len": 0,
                "total_words": 0, "total_sentences": 0}

    total_syllables = sum(count_syllables(w) for w in words)
    asl = len(words) / len(sentences)
    asw = total_syllables / len(words)

    flesch = 206.835 - (1.015 * asl) - (84.6 * asw)
    flesch = max(0, min(100, round(flesch, 1)))
    grade  = max(0, round((0.39 * asl) + (11.8 * asw) - 15.59, 1))

    levels = [(90,"Very Easy"),(80,"Easy"),(70,"Fairly Easy"),
              (60,"Standard"),(50,"Fairly Difficult"),(30,"Difficult"),(0,"Very Confusing")]
    level = next(lbl for thr, lbl in levels if flesch >= thr)

    return {"flesch": flesch, "grade": grade, "level": level,
            "avg_sentence_len": round(asl, 1),
            "total_words": len(words), "total_sentences": len(sentences)}


@app.route("/api/readability", methods=["POST"])
def api_readability():
    data = request.get_json()
    return jsonify(readability_scores(data.get("text", "")))


# ── FEATURE 2: Vocabulary fingerprint ────────────────────────────────────────

def vocab_fingerprint(samples: list) -> dict:
    all_words = []
    for s in samples:
        all_words.extend(re.findall(r"\b[a-z]+\b", s.lower()))

    if not all_words:
        return {"ttr": 0, "signature_words": [], "avg_word_length": 0,
                "unique_words": 0, "total_words": 0, "top_content_words": []}

    unique  = set(all_words)
    content = [w for w in all_words if w not in STOPWORDS and len(w) > 3]
    freq    = Counter(content)

    sample_400 = all_words[:400]
    ttr = round(len(set(sample_400)) / len(sample_400), 3) if sample_400 else 0
    sig = [w for w, c in freq.most_common(60) if 2 <= c <= 12][:15]
    avg_len = round(sum(len(w) for w in all_words) / len(all_words), 2)

    return {"ttr": ttr, "unique_words": len(unique), "total_words": len(all_words),
            "signature_words": sig, "avg_word_length": avg_len,
            "top_content_words": [w for w, _ in freq.most_common(10)]}


@app.route("/api/vocab-fingerprint", methods=["POST"])
def api_vocab():
    data = request.get_json()
    return jsonify(vocab_fingerprint(data.get("samples", [])))


# ── FEATURE 3: Export to PDF ──────────────────────────────────────────────────

@app.route("/api/export-pdf", methods=["POST"])
def api_export_pdf():
    if not HAS_PDF:
        return jsonify({"error": "fpdf2 not installed — run: pip install fpdf2"}), 501

    data  = request.get_json()
    title = data.get("title", "StyleMirror Export")
    seed  = data.get("seed", "")
    cont  = data.get("continuation", "")
    score = data.get("score", {})

    pdf = FPDF()
    pdf.set_margins(20, 20, 20)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(83, 74, 183)
    pdf.cell(0, 12, title, new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(136, 135, 128)
    pdf.cell(0, 6, f"Generated by StyleMirror — {datetime.date.today()}",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())
    pdf.ln(6)

    if score:
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(44, 44, 42)
        pdf.cell(0, 7, f"Style Match: {score.get('confidence','?')}%",
                 new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(95, 94, 90)
        pdf.multi_cell(0, 5, "Traits: " + ", ".join(score.get("traits", [])))
        feedback = score.get("feedback", "")
        if feedback:
            pdf.set_font("Helvetica", "I", 9)
            pdf.multi_cell(0, 5, f'"{feedback}"')
        pdf.ln(4)

    pdf.set_font("Helvetica", "BI", 10)
    pdf.set_text_color(83, 74, 183)
    pdf.cell(0, 6, "YOUR SEED", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "I", 11)
    pdf.set_text_color(95, 94, 90)
    pdf.multi_cell(0, 6, seed)
    pdf.ln(4)

    pdf.set_font("Helvetica", "BI", 10)
    pdf.set_text_color(83, 74, 183)
    pdf.cell(0, 6, "CONTINUATION", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(44, 44, 42)
    pdf.multi_cell(0, 6, cont)

    buf = io.BytesIO()
    pdf.output(buf)
    buf.seek(0)
    return send_file(buf, mimetype="application/pdf",
                     as_attachment=True, download_name="stylemirror_export.pdf")


# ── FEATURE 4: Session persistence ───────────────────────────────────────────

@app.route("/api/sessions", methods=["GET"])
def list_sessions():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, title, profile, created_at, word_count FROM sessions "
            "ORDER BY created_at DESC LIMIT 30"
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/sessions", methods=["POST"])
def save_session():
    data  = request.get_json()
    sid   = hashlib.sha256(
        (data.get("seed", "") + str(datetime.datetime.now())).encode()
    ).hexdigest()[:12]
    title = data.get("title") or f"Session {datetime.date.today()}"
    with get_db() as conn:
        conn.execute(
            "INSERT INTO sessions "
            "(id, title, profile, seed, continuation, samples_json, score_json, word_count) "
            "VALUES (?,?,?,?,?,?,?,?)",
            (sid, title,
             data.get("profile", "reflective"),
             data.get("seed", ""),
             data.get("continuation", ""),
             json.dumps(data.get("samples", [])),
             json.dumps(data.get("score", {})),
             len(re.findall(r"\b\w+\b", data.get("continuation", "")))))
    return jsonify({"id": sid, "title": title})


@app.route("/api/sessions/<sid>", methods=["GET"])
def load_session(sid):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM sessions WHERE id=?", (sid,)).fetchone()
    if not row:
        return jsonify({"error": "Not found"}), 404
    d = dict(row)
    d["samples"] = json.loads(d.get("samples_json") or "[]")
    d["score"]   = json.loads(d.get("score_json")   or "{}")
    return jsonify(d)


@app.route("/api/sessions/<sid>", methods=["DELETE"])
def delete_session(sid):
    with get_db() as conn:
        conn.execute("DELETE FROM sessions WHERE id=?", (sid,))
    return jsonify({"deleted": sid})


@app.route("/api/export", methods=["GET"])
def export_data():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM sessions ORDER BY created_at ASC").fetchall()
    sessions = []
    for r in rows:
        d = dict(r)
        d["samples"] = json.loads(d.get("samples_json") or "[]")
        d["score"]   = json.loads(d.get("score_json")   or "{}")
        sessions.append(d)
    payload = json.dumps({"version": 1, "exported_at": datetime.datetime.utcnow().isoformat(), "sessions": sessions})
    buf = io.BytesIO(payload.encode())
    return send_file(buf, mimetype="application/json",
                     as_attachment=True, download_name="stylemirror_backup.json")


@app.route("/api/import", methods=["POST"])
def import_data():
    try:
        data = request.get_json()
        sessions = data.get("sessions", [])
    except Exception:
        return jsonify({"error": "Invalid JSON"}), 400

    imported = 0
    with get_db() as conn:
        for s in sessions:
            try:
                conn.execute(
                    "INSERT OR IGNORE INTO sessions "
                    "(id, title, profile, seed, continuation, samples_json, score_json, word_count, created_at) "
                    "VALUES (?,?,?,?,?,?,?,?,?)",
                    (s["id"], s.get("title","Untitled"), s.get("profile","reflective"),
                     s.get("seed",""), s.get("continuation",""),
                     json.dumps(s.get("samples",[])), json.dumps(s.get("score",{})),
                     s.get("word_count",0), s.get("created_at", datetime.datetime.utcnow().isoformat())))
                imported += 1
            except Exception:
                pass
    return jsonify({"imported": imported, "total": len(sessions)})


# ── FEATURE 5: Originality check ─────────────────────────────────────────────

def similarity_score(text_a: str, text_b: str) -> float:
    def ngrams(t, n=4):
        words = re.findall(r"\b[a-z]+\b", t.lower())
        return set(tuple(words[i:i+n]) for i in range(len(words) - n + 1))
    a, b = ngrams(text_a), ngrams(text_b)
    if not a or not b:
        return 0.0
    return round(len(a & b) / len(a | b), 3)


@app.route("/api/originality", methods=["POST"])
def api_originality():
    data     = request.get_json()
    new_text = data.get("text", "")
    scores   = []
    for s in data.get("samples", []):
        sim = similarity_score(new_text, s.get("text", ""))
        scores.append({"title": s.get("title", "Untitled"), "similarity": sim})
    scores.sort(key=lambda x: x["similarity"], reverse=True)
    max_sim     = scores[0]["similarity"] if scores else 0.0
    originality = round((1 - max_sim) * 100, 1)
    return jsonify({"originality_pct": originality, "flag": originality < 60, "matches": scores})


# ── FEATURE 6: Tone / mood analysis ─────────────────────────────────────────

TONE_LEXICON = {
    "joyful":     ["happy","joy","delight","wonderful","love","beautiful","bright","hope","laugh","smile","warm","celebrate","grateful","bliss","elated"],
    "melancholic":["sad","loss","grief","lonely","empty","hollow","ache","mourn","sorrow","miss","fade","gone","tears","heavy","quiet"],
    "anxious":    ["worry","fear","dread","uncertain","nervous","tense","panic","overwhelm","restless","uneasy","doubt","fragile","edge","spiral"],
    "angry":      ["anger","rage","furious","bitter","resent","frustrat","injust","betray","disgust","hostile","harsh","blunt","sharp","cold"],
    "contemplative":["wonder","reflect","ponder","question","perhaps","maybe","consider","think","meaning","truth","understand","seek","why","how"],
    "confident":  ["certain","clear","strong","bold","decisive","direct","assert","know","will","must","power","lead","stand","resolve"],
}

def tone_analysis(text: str) -> dict:
    words = re.findall(r"\b[a-z]+\b", text.lower())
    if not words:
        return {"dominant": "neutral", "scores": {}, "intensity": 0}
    scores = {}
    for tone, lexicon in TONE_LEXICON.items():
        count = sum(1 for w in words if any(w.startswith(stem) for stem in lexicon))
        scores[tone] = round(count / len(words) * 100, 2)
    dominant  = max(scores, key=scores.get)
    intensity = round(min(100, scores[dominant] * 12), 1)
    if intensity < 3:
        dominant = "neutral"
    return {"dominant": dominant, "scores": scores, "intensity": intensity}


@app.route("/api/tone", methods=["POST"])
def api_tone():
    data = request.get_json()
    texts = data.get("texts", [])
    if isinstance(texts, list):
        return jsonify([tone_analysis(t) for t in texts])
    return jsonify(tone_analysis(data.get("text", "")))


# ── FEATURE 7: Sentence structure fingerprint ────────────────────────────────

def structure_fingerprint(text: str) -> dict:
    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    if not sentences:
        return {}
    lengths   = [len(re.findall(r"\b\w+\b", s)) for s in sentences]
    avg       = sum(lengths) / len(lengths)
    variance  = round(sum((l - avg) ** 2 for l in lengths) / len(lengths), 1)

    # punctuation habits
    em_dashes    = len(re.findall(r"—", text))
    semicolons   = len(re.findall(r";", text))
    ellipses     = len(re.findall(r"\.\.\.", text))
    questions    = len(re.findall(r"\?", text))
    exclamations = len(re.findall(r"!", text))

    # paragraph rhythm
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    para_lens  = [len(re.findall(r"\b\w+\b", p)) for p in paragraphs]

    return {
        "sentence_count":    len(sentences),
        "avg_length":        round(avg, 1),
        "length_variance":   variance,
        "short_ratio":       round(sum(1 for l in lengths if l <= 10) / len(lengths), 2),
        "long_ratio":        round(sum(1 for l in lengths if l >= 30) / len(lengths), 2),
        "em_dashes":         em_dashes,
        "semicolons":        semicolons,
        "ellipses":          ellipses,
        "questions":         questions,
        "exclamations":      exclamations,
        "paragraph_count":   len(paragraphs),
        "avg_para_words":    round(sum(para_lens) / len(para_lens), 1) if para_lens else 0,
    }


def structure_drift(samples_text: str, continuation_text: str) -> dict:
    """Compare structural fingerprint of samples vs continuation."""
    s = structure_fingerprint(samples_text)
    c = structure_fingerprint(continuation_text)
    if not s or not c:
        return {"drift_score": 0, "flags": []}

    flags = []
    drift = 0

    len_diff = abs(s["avg_length"] - c["avg_length"])
    if len_diff > 8:
        drift += 30
        flags.append(f"Sentence length shifted by {len_diff:.0f}w (samples: {s['avg_length']}w → continuation: {c['avg_length']}w)")

    var_diff = abs(s["length_variance"] - c["length_variance"])
    if var_diff > 40:
        drift += 20
        flags.append("Sentence rhythm variety changed significantly")

    for mark, label in [("em_dashes","em-dash"), ("semicolons","semicolon"), ("ellipses","ellipsis")]:
        sv = s.get(mark, 0); cv = c.get(mark, 0)
        if sv == 0 and cv >= 3:
            drift += 15
            flags.append(f"New {label} usage not present in samples")
        elif sv >= 2 and cv == 0:
            drift += 10
            flags.append(f"Missing {label} usage common in your samples")

    return {"drift_score": min(100, drift), "flags": flags, "sample_struct": s, "cont_struct": c}


@app.route("/api/structure", methods=["POST"])
def api_structure():
    data = request.get_json()
    if "samples_text" in data and "continuation_text" in data:
        return jsonify(structure_drift(data["samples_text"], data["continuation_text"]))
    return jsonify(structure_fingerprint(data.get("text", "")))


# ── FEATURE 8: LLM generation ────────────────────────────────────────────────
#
# Hybrid mode:
#   offline / localhost → Ollama  (OPENAI_BASE_URL / LLM_MODEL)
#   online              → provider chosen by frontend: "groq"
#
# Env vars:
#   GROQ_API_KEY     — Groq API key
#   OPENAI_BASE_URL  — override base URL (default: http://localhost:11434/v1)
#   LLM_MODEL        — default Ollama model (default: llama3)

LLM_API_KEY  = os.environ.get("OPENAI_API_KEY", "ollama")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
LLM_BASE_URL = os.environ.get("OPENAI_BASE_URL", "http://localhost:11434/v1")
LLM_MODEL    = os.environ.get("LLM_MODEL", "llama3")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_MODEL    = "llama3-8b-8192"


@app.route("/api/config")
def api_config():
    return jsonify({
        "key_configured":  bool(LLM_API_KEY and LLM_API_KEY != "ollama"),
        "groq_configured": bool(GROQ_API_KEY),
    })


def _stream_openai_compat(base_url, key, model, messages, max_tokens):
    """Stream from any OpenAI-compatible endpoint (Ollama, OpenAI, etc.)."""
    import urllib.request, urllib.error, json as _json
    payload = _json.dumps({
        "model": model, "messages": messages,
        "stream": True, "max_tokens": max_tokens,
    }).encode()
    req = urllib.request.Request(
        f"{base_url}/chat/completions", data=payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
        method="POST",
    )
    try:
        resp = urllib.request.urlopen(req)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"LLM API error {e.code}: {e.read().decode()}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"LLM not reachable: {e.reason}")

    for raw in resp:
        line = raw.decode().strip()
        if not line.startswith("data:"):
            continue
        s = line[5:].strip()
        if s == "[DONE]":
            break
        try:
            text = _json.loads(s)["choices"][0]["delta"].get("content", "")
            if text:
                yield text
        except (KeyError, _json.JSONDecodeError):
            pass


def _stream_gemini(key, model, messages, max_tokens):
    """Stream from Gemini generateContent (SSE)."""
    import urllib.request, urllib.error, json as _json
    # Convert messages → Gemini contents format
    system_parts = [m["content"] for m in messages if m["role"] == "system"]
    contents = [
        {"role": "user" if m["role"] == "user" else "model", "parts": [{"text": m["content"]}]}
        for m in messages if m["role"] != "system"
    ]
    body = {
        "contents": contents,
        "generationConfig": {"maxOutputTokens": max_tokens},
    }
    if system_parts:
        body["systemInstruction"] = {"parts": [{"text": "\n".join(system_parts)}]}

    gemini_model = model or "gemini-1.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:streamGenerateContent?alt=sse&key={key}"
    req = urllib.request.Request(
        url, data=_json.dumps(body).encode(),
        headers={"Content-Type": "application/json"}, method="POST",
    )
    try:
        resp = urllib.request.urlopen(req)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Gemini API error {e.code}: {e.read().decode()}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"Gemini not reachable: {e.reason}")

    for raw in resp:
        line = raw.decode().strip()
        if not line.startswith("data:"):
            continue
        try:
            chunk = _json.loads(line[5:].strip())
            text = chunk["candidates"][0]["content"]["parts"][0].get("text", "")
            if text:
                yield text
        except (KeyError, IndexError, _json.JSONDecodeError):
            pass


@app.route("/api/generate", methods=["POST"])
def api_generate():
    import json as _json
    from flask import Response, stream_with_context

    data       = request.get_json()
    provider   = data.get("provider", "ollama")
    max_tokens = data.get("max_tokens", 1000)
    messages   = [{"role": "system", "content": data.get("system", "")}] + data.get("messages", [])

    if provider == "groq":
        key   = data.get("api_key") or GROQ_API_KEY
        if not key:
            return jsonify({"error": "Groq API key required"}), 400
        gen = _stream_openai_compat(GROQ_BASE_URL, key, GROQ_MODEL, messages, max_tokens)
    else:
        key      = data.get("api_key") or LLM_API_KEY
        base_url = data.get("base_url") or LLM_BASE_URL
        model    = data.get("model") or LLM_MODEL
        if provider == "openai" and (not key or key == "ollama"):
            return jsonify({"error": "OpenAI API key required"}), 400
        gen = _stream_openai_compat(base_url, key, model, messages, max_tokens)

    def stream():
        try:
            for text in gen:
                yield f"data: {_json.dumps({'type':'content_block_delta','delta':{'text':text}})}\n\n"
        except RuntimeError as e:
            yield f"data: {_json.dumps({'type':'error','message':str(e)})}\n\n"

    return Response(stream_with_context(stream()), content_type="text/event-stream")


# ── FEATURE 9: Style comparison ──────────────────────────────────────────────

@app.route("/api/style-compare", methods=["POST"])
def api_style_compare():
    data = request.get_json()
    your_text    = "\n\n".join(data.get("samples", []))
    compare_text = data.get("compare_text", "")
    if not your_text or not compare_text:
        return jsonify({"error": "samples and compare_text required"}), 400

    yours   = structure_fingerprint(your_text)
    theirs  = structure_fingerprint(compare_text)
    yours_v = vocab_fingerprint(data.get("samples", []))
    theirs_v= vocab_fingerprint([compare_text])

    diffs = []
    for key, label in [("avg_length","Avg sentence length"), ("length_variance","Sentence rhythm"),
                       ("short_ratio","Short sentence ratio"), ("long_ratio","Long sentence ratio"),
                       ("em_dashes","Em-dash usage"), ("semicolons","Semicolon usage")]:
        yv = yours.get(key, 0); tv = theirs.get(key, 0)
        diffs.append({"label": label, "yours": yv, "theirs": tv,
                      "delta": round(tv - yv, 2)})

    return jsonify({
        "structure_diff": diffs,
        "yours_ttr":   yours_v.get("ttr", 0),
        "theirs_ttr":  theirs_v.get("ttr", 0),
        "yours_sig":   yours_v.get("signature_words", [])[:10],
        "theirs_sig":  theirs_v.get("signature_words", [])[:10],
        "yours_tone":  tone_analysis(your_text),
        "theirs_tone": tone_analysis(compare_text),
    })


# ── FEATURE 10: Revision suggestions ─────────────────────────────────────────

@app.route("/api/revision-suggestions", methods=["POST"])
def api_revision_suggestions():
    data          = request.get_json()
    samples_text  = "\n\n".join(data.get("samples", []))
    continuation  = data.get("continuation", "")
    if not samples_text or not continuation:
        return jsonify({"suggestions": []})

    ref = structure_fingerprint(samples_text)
    ref_avg = ref.get("avg_length", 15)
    ref_var = ref.get("length_variance", 20)

    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", continuation) if s.strip()]
    suggestions = []
    for i, sent in enumerate(sentences):
        words = re.findall(r"\b\w+\b", sent)
        length = len(words)
        issues = []
        if ref_avg > 0:
            deviation = abs(length - ref_avg) / max(ref_avg, 1)
            if deviation > 0.8 and length > 5:
                direction = "much longer" if length > ref_avg else "much shorter"
                issues.append(f"Sentence is {direction} than your typical style ({length}w vs avg {ref_avg:.0f}w)")
        # check for punctuation habits mismatch
        if ref.get("em_dashes", 0) == 0 and "—" in sent:
            issues.append("Em-dash not typical in your samples")
        if ref.get("semicolons", 0) == 0 and ";" in sent:
            issues.append("Semicolon not typical in your samples")
        if issues:
            suggestions.append({"index": i, "sentence": sent, "issues": issues})

    return jsonify({"suggestions": suggestions[:8]})  # cap at 8


# ── FEATURE 11: Markdown export ───────────────────────────────────────────────

@app.route("/api/export-md", methods=["POST"])
def api_export_md():
    data  = request.get_json()
    title = data.get("title", "StyleMirror Export")
    seed  = data.get("seed", "")
    cont  = data.get("continuation", "")
    score = data.get("score", {})

    lines = [f"# {title}", "", f"*Generated by StyleMirror — {datetime.date.today()}*", ""]
    if score:
        lines += [f"**Style Match:** {score.get('confidence','?')}%", ""]
        if score.get("traits"):
            lines += ["**Traits:** " + ", ".join(score["traits"]), ""]
        if score.get("feedback"):
            lines += [f"> {score['feedback']}", ""]
    lines += ["---", "", "## Your Seed", "", seed, "", "---", "", "## Continuation", "", cont, ""]

    md = "\n".join(lines)
    buf = io.BytesIO(md.encode("utf-8"))
    return send_file(buf, mimetype="text/markdown",
                     as_attachment=True, download_name="stylemirror_export.md")


# ── FEATURE 12: Writing stats ─────────────────────────────────────────────────

@app.route("/api/sessions/stats", methods=["GET"])
def api_session_stats():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT date(created_at) as day, SUM(word_count) as words "
            "FROM sessions GROUP BY day ORDER BY day DESC LIMIT 30"
        ).fetchall()
    return jsonify([dict(r) for r in rows])


# ── health ────────────────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "has_pdf": HAS_PDF, "version": "2.1.0",
                    "llm_model": LLM_MODEL, "llm_ready": bool(LLM_API_KEY)})


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 8787))
    print(f"  StyleMirror API → http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
