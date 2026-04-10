"""
StyleMirror Backend Server
Python 3.11+ | Flask 3.x
Provides: readability scoring, vocabulary fingerprinting, PDF export,
          session persistence, and originality checking.
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3, json, math, re, io, os, hashlib, datetime
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
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

DB_PATH = Path(__file__).parent.parent / "db" / "stylemirror.db"


# ── database helpers ──────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_db() as conn:
        conn.executescript(open(Path(__file__).parent.parent / "db" / "schema.sql").read())


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
        return {"flesch": 0, "grade": 0, "level": "N/A", "avg_sentence_len": 0}

    total_syllables = sum(count_syllables(w) for w in words)
    asl = len(words) / len(sentences)          # avg sentence length
    asw = total_syllables / len(words)          # avg syllables per word

    flesch = 206.835 - (1.015 * asl) - (84.6 * asw)
    flesch = max(0, min(100, round(flesch, 1)))

    # Flesch–Kincaid grade level
    grade  = max(0, round((0.39 * asl) + (11.8 * asw) - 15.59, 1))

    levels = [(90, "Very Easy"), (80, "Easy"), (70, "Fairly Easy"),
              (60, "Standard"), (50, "Fairly Difficult"),
              (30, "Difficult"), (0,  "Very Confusing")]
    level = next(lbl for thr, lbl in levels if flesch >= thr)

    return {
        "flesch":           flesch,
        "grade":            grade,
        "level":            level,
        "avg_sentence_len": round(asl, 1),
        "total_words":      len(words),
        "total_sentences":  len(sentences),
    }


@app.route("/api/readability", methods=["POST"])
def api_readability():
    data = request.get_json()
    text = data.get("text", "")
    return jsonify(readability_scores(text))


# ── FEATURE 2: Vocabulary fingerprint (lexical richness + signature words) ───

def vocab_fingerprint(samples: list[str]) -> dict:
    all_words   = []
    for s in samples:
        all_words.extend(re.findall(r"\b[a-z]+\b", s.lower()))

    if not all_words:
        return {"ttr": 0, "signature_words": [], "avg_word_length": 0}

    unique      = set(all_words)
    content     = [w for w in all_words if w not in STOPWORDS and len(w) > 3]
    freq        = Counter(content)

    # type–token ratio (on first 400 tokens to normalise length)
    sample_400  = all_words[:400]
    ttr         = round(len(set(sample_400)) / len(sample_400), 3) if sample_400 else 0

    # signature words = medium frequency (not so rare they're noise, not stopwords)
    sig = [w for w, c in freq.most_common(60) if 2 <= c <= 12][:15]

    avg_len = round(sum(len(w) for w in all_words) / len(all_words), 2)

    return {
        "ttr":              ttr,
        "unique_words":     len(unique),
        "total_words":      len(all_words),
        "signature_words":  sig,
        "avg_word_length":  avg_len,
        "top_content_words": [w for w, _ in freq.most_common(10)],
    }


@app.route("/api/vocab-fingerprint", methods=["POST"])
def api_vocab():
    data    = request.get_json()
    samples = data.get("samples", [])
    return jsonify(vocab_fingerprint(samples))


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

    # header
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(83, 74, 183)
    pdf.cell(0, 12, title, ln=True)

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(136, 135, 128)
    pdf.cell(0, 6, f"Generated by StyleMirror — {datetime.date.today()}", ln=True)
    pdf.ln(4)
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())
    pdf.ln(6)

    # style score
    if score:
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(44, 44, 42)
        pdf.cell(0, 7, f"Style Match: {score.get('confidence', '?')}%", ln=True)
        traits = ", ".join(score.get("traits", []))
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(95, 94, 90)
        pdf.multi_cell(0, 5, f"Traits: {traits}")
        feedback = score.get("feedback", "")
        if feedback:
            pdf.set_font("Helvetica", "I", 9)
            pdf.multi_cell(0, 5, f'"{feedback}"')
        pdf.ln(4)

    # seed
    pdf.set_font("Helvetica", "BI", 10)
    pdf.set_text_color(83, 74, 183)
    pdf.cell(0, 6, "YOUR SEED", ln=True)
    pdf.set_font("Helvetica", "I", 11)
    pdf.set_text_color(95, 94, 90)
    pdf.multi_cell(0, 6, seed)
    pdf.ln(4)

    # continuation
    pdf.set_font("Helvetica", "BI", 10)
    pdf.set_text_color(83, 74, 183)
    pdf.cell(0, 6, "CONTINUATION", ln=True)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(44, 44, 42)
    pdf.multi_cell(0, 6, cont)

    buf = io.BytesIO()
    pdf.output(buf)
    buf.seek(0)
    return send_file(buf, mimetype="application/pdf",
                     as_attachment=True, download_name="stylemirror_export.pdf")


# ── FEATURE 4: Session persistence (save / load sessions) ────────────────────

@app.route("/api/sessions", methods=["GET"])
def list_sessions():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, title, profile, created_at, word_count FROM sessions ORDER BY created_at DESC LIMIT 30"
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/sessions", methods=["POST"])
def save_session():
    data   = request.get_json()
    sid    = hashlib.sha256(
        (data.get("seed","") + str(datetime.datetime.now())).encode()
    ).hexdigest()[:12]
    title  = data.get("title") or f"Session {datetime.date.today()}"
    with get_db() as conn:
        conn.execute("""
            INSERT INTO sessions (id, title, profile, seed, continuation, samples_json, score_json, word_count)
            VALUES (?,?,?,?,?,?,?,?)
        """, (
            sid, title,
            data.get("profile", "reflective"),
            data.get("seed",""),
            data.get("continuation",""),
            json.dumps(data.get("samples", [])),
            json.dumps(data.get("score", {})),
            len(re.findall(r"\b\w+\b", data.get("continuation",""))),
        ))
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


# ── FEATURE 5: Originality / self-plagiarism check ───────────────────────────

def similarity_score(text_a: str, text_b: str) -> float:
    """Jaccard similarity on 4-grams."""
    def ngrams(t, n=4):
        words = re.findall(r"\b[a-z]+\b", t.lower())
        return set(tuple(words[i:i+n]) for i in range(len(words)-n+1))
    a, b = ngrams(text_a), ngrams(text_b)
    if not a or not b:
        return 0.0
    return round(len(a & b) / len(a | b), 3)


@app.route("/api/originality", methods=["POST"])
def api_originality():
    data         = request.get_json()
    new_text     = data.get("text", "")
    past_samples = data.get("samples", [])

    scores = []
    for s in past_samples:
        sim = similarity_score(new_text, s.get("text",""))
        scores.append({"title": s.get("title","Untitled"), "similarity": sim})

    scores.sort(key=lambda x: x["similarity"], reverse=True)
    max_sim = scores[0]["similarity"] if scores else 0.0
    originality = round((1 - max_sim) * 100, 1)

    return jsonify({
        "originality_pct": originality,
        "flag": originality < 60,
        "matches": scores,
    })


# ── health & startup ──────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "has_pdf": HAS_PDF, "version": "2.0.0"})


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 8787))
    print(f"  StyleMirror API → http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
