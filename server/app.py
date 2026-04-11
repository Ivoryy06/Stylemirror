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


# ── FEATURE 8: LLM generation (OpenAI-compatible, streaming) ─────────────────
#
# Set these environment variables:
#   OPENAI_API_KEY   — your OpenAI key (or any OpenAI-compatible provider key)
#   OPENAI_BASE_URL  — override for other providers, e.g.:
#                        Anthropic via openai-compat: https://api.anthropic.com/v1
#                        Groq:  https://api.groq.com/openai/v1
#                        local Ollama: http://localhost:11434/v1
#   LLM_MODEL        — model name, default: gpt-4o-mini

LLM_API_KEY  = os.environ.get("OPENAI_API_KEY", "")
LLM_BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
LLM_MODEL    = os.environ.get("LLM_MODEL", "gpt-4o-mini")


@app.route("/api/generate", methods=["POST"])
def api_generate():
    import urllib.request, urllib.error, json as _json
    from flask import Response, stream_with_context

    if not LLM_API_KEY:
        return jsonify({"error": "OPENAI_API_KEY not set"}), 503

    data     = request.get_json()
    messages = [{"role": "system", "content": data.get("system", "")}] + data.get("messages", [])
    payload  = _json.dumps({
        "model":      LLM_MODEL,
        "messages":   messages,
        "stream":     True,
        "max_tokens": data.get("max_tokens", 1000),
    }).encode()

    req = urllib.request.Request(
        f"{LLM_BASE_URL}/chat/completions",
        data=payload,
        headers={
            "Content-Type":  "application/json",
            "Authorization": f"Bearer {LLM_API_KEY}",
        },
        method="POST",
    )
    try:
        resp = urllib.request.urlopen(req)
    except urllib.error.HTTPError as e:
        return jsonify({"error": f"LLM API error {e.code}: {e.read().decode()}"}), 502
    except urllib.error.URLError as e:
        return jsonify({"error": f"LLM not reachable: {e.reason}"}), 502

    def stream():
        for raw in resp:
            line = raw.decode().strip()
            if not line.startswith("data:"):
                continue
            payload_str = line[5:].strip()
            if payload_str == "[DONE]":
                break
            try:
                chunk = _json.loads(payload_str)
                text  = chunk["choices"][0]["delta"].get("content", "")
                if text:
                    yield f"data: {_json.dumps({'type':'content_block_delta','delta':{'text':text}})}\n\n"
            except (KeyError, _json.JSONDecodeError):
                pass

    return Response(stream_with_context(stream()), content_type="text/event-stream")


# ── health ────────────────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "has_pdf": HAS_PDF, "version": "2.0.0",
                    "llm_model": LLM_MODEL, "llm_ready": bool(LLM_API_KEY)})


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 8787))
    print(f"  StyleMirror API → http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
