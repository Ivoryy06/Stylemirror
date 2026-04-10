// StyleMirror v2.0 — src/StyleMirror.jsx
// New features wired to Python backend (http://localhost:8787):
//   1. Readability scoring panel   → GET /api/readability
//   2. Vocabulary fingerprint       → GET /api/vocab-fingerprint
//   3. PDF export                   → POST /api/export-pdf
//   4. Session save / load          → /api/sessions
//   5. Originality check            → POST /api/originality
//
// CSS: imported from ./styles/index.css (see that file for animations etc.)

import { useState, useRef, useCallback, useEffect } from "react";
import "./styles/index.css";

// ── constants ────────────────────────────────────────────────────────────────

const API_BASE = import.meta?.env?.VITE_API_BASE ?? "http://localhost:8787";
const ANTHROPIC = "https://api.anthropic.com/v1/messages";

const FONTS = {
  display: "var(--font-display)",
  body:    "var(--font-body)",
  mono:    "var(--font-mono)",
  ui:      "var(--font-ui)",
};

const STYLE_PROFILES = {
  reflective:     { label:"Reflective",     icon:"◎", desc:"Introspective, personal, meditative",      prompt:"Write in a reflective, introspective tone — personal, meditative, exploring inner thoughts and feelings with nuance." },
  formal:         { label:"Formal",         icon:"◈", desc:"Structured, authoritative, precise",       prompt:"Write in a formal, authoritative tone — structured arguments, precise vocabulary, academic register." },
  narrative:      { label:"Narrative",      icon:"◇", desc:"Storytelling, vivid, immersive",           prompt:"Write in a narrative, storytelling tone — vivid scenes, immersive prose, character and place." },
  conversational: { label:"Conversational", icon:"◉", desc:"Warm, direct, accessible",                prompt:"Write in a conversational, warm tone — direct, accessible, like speaking to a smart friend." },
};

const TABS = [
  { id:"samples",      label:"Style Samples",   icon:"◎" },
  { id:"write",        label:"New Piece",        icon:"◇" },
  { id:"sessions",     label:"Sessions",         icon:"⊞" },
  { id:"output",       label:"Output",           icon:"◈", resultOnly: true },
];

const REFLECTION_PROMPTS = [
  "What's the single most important idea you want the reader to carry away?",
  "Is there a moment in your seed that you glossed over but could linger in?",
  "What tension or contradiction is driving this piece — and have you named it?",
  "Which sentence in the continuation surprised you? Why?",
];

// ── helpers ───────────────────────────────────────────────────────────────────

const wordCount = t => t.trim().split(/\s+/).filter(Boolean).length;

const parseResponse = raw => {
  const marker = "STYLE_SCORE_JSON:";
  const idx    = raw.lastIndexOf(marker);
  if (idx === -1) return { text: raw.trim(), score: null };
  const text = raw.slice(0, idx).trim();
  try   { return { text, score: JSON.parse(raw.slice(idx + marker.length).trim()) }; }
  catch { return { text, score: null }; }
};

const readabilityClass = level => ({
  "Very Easy":       "rdbl-very-easy",
  "Easy":            "rdbl-easy",
  "Fairly Easy":     "rdbl-fairly-easy",
  "Standard":        "rdbl-standard",
  "Fairly Difficult":"rdbl-fairly-diff",
  "Difficult":       "rdbl-difficult",
  "Very Confusing":  "rdbl-very-confusing",
}[level] ?? "rdbl-standard");

const SYSTEM_PROMPT = (styleDesc, sampleText) => `You are StyleMirror, a writing assistant that continues text in the exact voice, tone, and style of a specific writer.

WRITER'S STYLE PROFILE (derived from their past writing):
${sampleText ? `<style_samples>\n${sampleText}\n</style_samples>` : "No prior samples provided — use the new input as the style anchor."}

STYLE MODE: ${styleDesc}

Your task:
1. Analyze the writer's unique patterns: sentence length variation, vocabulary register, use of punctuation, paragraph rhythm, use of metaphor/abstraction vs concreteness, how they open and close ideas.
2. Continue their NEW PIECE seamlessly — it must read as if the same person wrote every word.
3. After your continuation, add a JSON block at the very end (no markdown fences) in this exact format:
STYLE_SCORE_JSON:{"confidence":85,"traits":["long sinuous sentences","em-dash pauses","abstract-to-concrete moves","second-person address"],"feedback":"Your piece opens strongly with that pivot from the abstract to the sensory — lean into that more in the next draft."}

Rules:
- The continuation should be 3–5 paragraphs.
- DO NOT introduce new topics not present in the seed text.
- DO NOT explain what you're doing — just write.
- Match paragraph count rhythm to the samples.
- The JSON must appear at the very end, prefixed with exactly "STYLE_SCORE_JSON:" and be valid JSON.`;

// ── small shared components ───────────────────────────────────────────────────

const Pill = ({ children, color = "#5F5E5A", bg = "#F1EFE8" }) => (
  <span style={{ display:"inline-block", padding:"3px 10px", background:bg, color, borderRadius:20, fontSize:12, fontFamily:FONTS.ui, margin:"2px 3px 2px 0", border:"0.5px solid #D3D1C7" }}>
    {children}
  </span>
);

const Tab = ({ label, icon, active, onClick }) => (
  <button onClick={onClick} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", border:"none", cursor:"pointer", background: active?"#fff":"transparent", borderBottom: active?"2px solid #534AB7":"2px solid transparent", color: active?"#534AB7":"#888780", fontFamily:FONTS.ui, fontSize:13, fontWeight: active?500:400, transition:"all 0.15s" }}>
    <span style={{ fontSize:14 }}>{icon}</span>{label}
  </button>
);

const ScoreRing = ({ value }) => {
  const r = 28, circ = 2*Math.PI*r, dash = (value/100)*circ;
  const color = value>=80?"#1D9E75":value>=60?"#BA7517":"#D85A30";
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#E5E3DC" strokeWidth="5"/>
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
        transform="rotate(-90 36 36)" className="score-ring-arc"/>
      <text x="36" y="40" textAnchor="middle" fontSize="16" fontWeight="500" fill={color} fontFamily={FONTS.ui}>{value}</text>
    </svg>
  );
};

const Card = ({ children, style={} }) => (
  <div style={{ background:"#fff", border:"0.5px solid #D3D1C7", borderRadius:12, padding:"1.25rem 1.5rem", ...style }}>
    {children}
  </div>
);

const Label = ({ children }) => (
  <div style={{ fontSize:11, color:"#888780", fontFamily:FONTS.ui, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>
    {children}
  </div>
);

const ErrorBox = ({ msg }) => msg ? (
  <div style={{ padding:"10px 14px", background:"#FAECE7", border:"0.5px solid #F0997B", borderRadius:8, fontSize:13, color:"#993C1D", marginBottom:"1rem" }}>
    {msg}
  </div>
) : null;

const Spinner = () => (
  <span style={{ display:"inline-block", width:14, height:14, border:"2px solid #AFA9EC", borderTopColor:"#534AB7", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
);

// ── FEATURE 1: Readability Panel ─────────────────────────────────────────────

const ReadabilityPanel = ({ text }) => {
  const [data, setData]  = useState(null);
  const [busy, setBusy]  = useState(false);
  const prevText = useRef("");

  useEffect(() => {
    if (!text || text === prevText.current) return;
    prevText.current = text;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await fetch(`${API_BASE}/api/readability`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ text }),
        });
        if (r.ok) setData(await r.json());
      } catch { /* backend offline — silent */ }
      finally { setBusy(false); }
    }, 800);
    return () => clearTimeout(t);
  }, [text]);

  if (!text || wordCount(text) < 20) return null;

  const barW = data ? Math.round((data.flesch/100)*120) : 0;
  const cls  = data ? readabilityClass(data.level) : "";

  return (
    <div className="animate-fadeIn" style={{ marginTop:"1rem", padding:"12px 16px", background:"#F9F8F5", border:"0.5px solid #D3D1C7", borderRadius:10 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <Label>Readability {busy && <Spinner/>}</Label>
        {data && <span className={cls} style={{ fontSize:11, padding:"2px 8px", borderRadius:12, fontFamily:FONTS.ui }}>{data.level}</span>}
      </div>
      {data ? (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <div style={{ flex:1, height:5, background:"#E5E3DC", borderRadius:3, overflow:"hidden" }}>
              <div style={{ width:barW, height:"100%", background:"#534AB7", borderRadius:3, transition:"width 0.8s ease" }}/>
            </div>
            <span style={{ fontSize:12, fontFamily:FONTS.mono, color:"#534AB7", minWidth:32 }}>{data.flesch}</span>
          </div>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            {[["Grade",data.grade], ["Words",data.total_words], ["Avg sent",`${data.avg_sentence_len}w`]].map(([k,v]) => (
              <span key={k} style={{ fontSize:11, color:"#888780", fontFamily:FONTS.ui }}>
                <b style={{ color:"#2C2C2A", fontWeight:500 }}>{v}</b> {k}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className="skeleton" style={{ height:20, width:"60%", borderRadius:4 }}/>
      )}
    </div>
  );
};

// ── FEATURE 2: Vocabulary Fingerprint Panel ───────────────────────────────────

const VocabPanel = ({ samples }) => {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!samples.length) return;
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/vocab-fingerprint`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ samples: samples.map(s=>s.text) }),
      });
      if (r.ok) setData(await r.json());
    } catch { /* silent */ }
    finally { setBusy(false); }
  };

  return (
    <Card style={{ marginTop:"1rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <Label>Vocabulary Fingerprint</Label>
        <button onClick={run} disabled={busy || !samples.length} style={{ padding:"5px 12px", background:samples.length?"#534AB7":"#D3D1C7", color:"#fff", border:"none", borderRadius:7, cursor:samples.length?"pointer":"not-allowed", fontFamily:FONTS.ui, fontSize:12, display:"flex", alignItems:"center", gap:6 }}>
          {busy && <Spinner/>} Analyse
        </button>
      </div>
      {data ? (
        <>
          <div style={{ display:"flex", gap:16, marginBottom:10, flexWrap:"wrap" }}>
            {[["TTR",data.ttr],["Unique",data.unique_words],["Avg len",`${data.avg_word_length}c`]].map(([k,v])=>(
              <div key={k} style={{ textAlign:"center" }}>
                <div style={{ fontSize:18, fontWeight:500, color:"#534AB7", fontFamily:FONTS.ui }}>{v}</div>
                <div style={{ fontSize:11, color:"#888780" }}>{k}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:6 }}>
            <div style={{ fontSize:11, color:"#888780", marginBottom:4 }}>Signature words</div>
            <div>{data.signature_words?.map(w=><Pill key={w} color="#534AB7" bg="#EEEDFE">{w}</Pill>)}</div>
          </div>
          <div>
            <div style={{ fontSize:11, color:"#888780", marginBottom:4 }}>Top content words</div>
            <div>{data.top_content_words?.map(w=><Pill key={w}>{w}</Pill>)}</div>
          </div>
        </>
      ) : (
        <p style={{ fontSize:13, color:"#888780", fontFamily:FONTS.ui }}>
          {samples.length ? "Click Analyse to fingerprint your vocabulary." : "Add style samples first."}
        </p>
      )}
    </Card>
  );
};

// ── FEATURE 3: PDF Export Button ──────────────────────────────────────────────

const ExportPDF = ({ seed, continuation, score, profile }) => {
  const [busy,  setBusy]  = useState(false);
  const [toast, setToast] = useState("");

  const doExport = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/export-pdf`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ title:`StyleMirror — ${STYLE_PROFILES[profile].label}`, seed, continuation, score }),
      });
      if (!r.ok) { setToast("PDF export failed — is the backend running?"); return; }
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = "stylemirror_export.pdf"; a.click();
      URL.revokeObjectURL(url);
      setToast("PDF downloaded!");
    } catch { setToast("Backend offline — start the Python server first."); }
    finally { setBusy(false); setTimeout(()=>setToast(""), 3500); }
  };

  return (
    <div style={{ position:"relative" }}>
      <button onClick={doExport} disabled={busy} style={{ width:"100%", padding:"10px", background:busy?"#D3D1C7":"#fff", border:"0.5px solid #D3D1C7", borderRadius:10, cursor:busy?"not-allowed":"pointer", fontFamily:FONTS.ui, fontSize:13, color:"#2C2C2A", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        {busy && <Spinner/>} Export PDF
      </button>
      {toast && (
        <div className="animate-fadeIn" style={{ position:"absolute", top:"-40px", left:"50%", transform:"translateX(-50%)", background:"#2C2C2A", color:"#fff", fontSize:12, padding:"5px 12px", borderRadius:8, whiteSpace:"nowrap", fontFamily:FONTS.ui }}>
          {toast}
        </div>
      )}
    </div>
  );
};

// ── FEATURE 4: Sessions Panel ─────────────────────────────────────────────────

const SessionsPanel = ({ onLoad }) => {
  const [sessions, setSessions] = useState([]);
  const [busy,     setBusy]     = useState(false);
  const [toast,    setToast]    = useState("");

  const fetchSessions = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/sessions`);
      if (r.ok) setSessions(await r.json());
      else setToast("Backend offline");
    } catch { setToast("Could not reach backend — is the Python server running?"); }
    finally { setBusy(false); }
  };

  useEffect(() => { fetchSessions(); }, []);

  const del = async (id) => {
    try {
      await fetch(`${API_BASE}/api/sessions/${id}`, { method:"DELETE" });
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch { /* silent */ }
  };

  const load = async (id) => {
    try {
      const r = await fetch(`${API_BASE}/api/sessions/${id}`);
      if (r.ok) { const d = await r.json(); onLoad(d); }
    } catch { /* silent */ }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
        <Label>Saved Sessions</Label>
        <button onClick={fetchSessions} style={{ padding:"5px 12px", background:"#F1EFE8", border:"0.5px solid #D3D1C7", borderRadius:7, cursor:"pointer", fontFamily:FONTS.ui, fontSize:12, display:"flex", alignItems:"center", gap:6 }}>
          {busy && <Spinner/>} Refresh
        </button>
      </div>

      {toast && <div style={{ fontSize:13, color:"#993C1D", background:"#FAECE7", padding:"8px 12px", borderRadius:8, marginBottom:"1rem" }}>{toast}</div>}

      {sessions.length === 0 && !busy && (
        <p style={{ fontSize:13, color:"#888780", fontFamily:FONTS.ui, textAlign:"center", padding:"2rem" }}>
          No sessions yet. Generate a piece and save it.
        </p>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {sessions.map(s => (
          <Card key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:500, color:"#2C2C2A", fontFamily:FONTS.ui }}>{s.title}</div>
              <div style={{ display:"flex", gap:8, marginTop:3 }}>
                <Pill>{STYLE_PROFILES[s.profile]?.icon} {s.profile}</Pill>
                <Pill>{s.word_count}w</Pill>
                <span style={{ fontSize:11, color:"#888780", fontFamily:FONTS.ui, alignSelf:"center" }}>
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={()=>load(s.id)} style={{ padding:"5px 10px", background:"#EEEDFE", color:"#534AB7", border:"0.5px solid #AFA9EC", borderRadius:7, cursor:"pointer", fontFamily:FONTS.ui, fontSize:12 }}>Load</button>
              <button onClick={()=>del(s.id)} style={{ padding:"5px 10px", background:"none", color:"#D85A30", border:"0.5px solid #F0997B", borderRadius:7, cursor:"pointer", fontFamily:FONTS.ui, fontSize:12 }}>Del</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ── FEATURE 5: Originality Check ─────────────────────────────────────────────

const OriginalityCheck = ({ text, samples }) => {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const check = async () => {
    if (!text) return;
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/originality`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ text, samples }),
      });
      if (r.ok) setData(await r.json());
    } catch { /* silent */ }
    finally { setBusy(false); }
  };

  const color = data ? (data.originality_pct >= 70 ? "#1D9E75" : data.originality_pct >= 50 ? "#BA7517" : "#D85A30") : "#888780";

  return (
    <Card style={{ marginTop:"1rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <Label>Originality Check</Label>
        <button onClick={check} disabled={busy || !text} style={{ padding:"5px 12px", background:text?"#534AB7":"#D3D1C7", color:"#fff", border:"none", borderRadius:7, cursor:text?"pointer":"not-allowed", fontFamily:FONTS.ui, fontSize:12, display:"flex", alignItems:"center", gap:6 }}>
          {busy && <Spinner/>} Check
        </button>
      </div>
      {data ? (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
            <div style={{ fontSize:28, fontWeight:500, color, fontFamily:FONTS.ui }}>{data.originality_pct}%</div>
            <div>
              <div style={{ fontSize:13, color, fontFamily:FONTS.ui, fontWeight:500 }}>{data.flag ? "⚠ Significant overlap detected" : "✓ Looks original"}</div>
              <div style={{ fontSize:11, color:"#888780" }}>vs your style samples</div>
            </div>
          </div>
          {data.matches?.length > 0 && (
            <div>
              {data.matches.map((m,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#5F5E5A", padding:"3px 0", borderBottom:"0.5px solid #F1EFE8" }}>
                  <span style={{ fontFamily:FONTS.ui }}>{m.title}</span>
                  <span style={{ fontFamily:FONTS.mono, color: m.similarity>0.3?"#D85A30":m.similarity>0.15?"#BA7517":"#1D9E75" }}>
                    {(m.similarity*100).toFixed(1)}% overlap
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p style={{ fontSize:13, color:"#888780", fontFamily:FONTS.ui }}>
          Check how original your continuation is vs your saved samples.
        </p>
      )}
    </Card>
  );
};

// ── Sentence Heatmap (JS port of Rust heatmap) ───────────────────────────────

const SentenceHeatmap = ({ text }) => {
  if (!text || wordCount(text) < 30) return null;
  const sents = text.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);
  const lens  = sents.map(s => s.split(/\s+/).filter(Boolean).length);
  const max   = Math.max(...lens, 1);

  return (
    <Card style={{ marginTop:"1rem" }}>
      <Label>Sentence Length Heatmap</Label>
      <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
        {lens.map((len,i) => {
          const pct = (len/max)*100;
          const cls = len>30?"sent-bar-long":len>15?"sent-bar-mid":"sent-bar-short";
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:20, fontSize:10, color:"#888780", fontFamily:FONTS.mono, textAlign:"right" }}>{i+1}</div>
              <div style={{ flex:1, height:8, background:"#F1EFE8", borderRadius:4, overflow:"hidden" }}>
                <div className={cls} style={{ width:`${pct}%`, height:"100%", borderRadius:4, transition:"width 0.5s ease" }}/>
              </div>
              <div style={{ width:24, fontSize:10, color:"#888780", fontFamily:FONTS.mono }}>{len}w</div>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:12, marginTop:8 }}>
        {[["sent-bar-short","≤15 words"],["sent-bar-mid","16–30"],["sent-bar-long","30+"]].map(([c,l])=>(
          <div key={c} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div className={c} style={{ width:10, height:10, borderRadius:2 }}/>
            <span style={{ fontSize:10, color:"#888780", fontFamily:FONTS.ui }}>{l}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ── Save Session Button ───────────────────────────────────────────────────────

const SaveSession = ({ seed, continuation, score, samples, profile, onSaved }) => {
  const [title, setTitle]  = useState("");
  const [busy,  setBusy]   = useState(false);
  const [toast, setToast]  = useState("");
  const [open,  setOpen]   = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/sessions`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ title, seed, continuation, score, samples, profile }),
      });
      if (r.ok) { const d = await r.json(); setToast(`Saved: ${d.title}`); setOpen(false); onSaved?.(); }
      else setToast("Save failed — is the backend running?");
    } catch { setToast("Backend offline"); }
    finally { setBusy(false); setTimeout(()=>setToast(""), 3000); }
  };

  return (
    <div>
      {!open ? (
        <button onClick={()=>setOpen(true)} style={{ width:"100%", padding:"10px", background:"#fff", border:"0.5px solid #D3D1C7", borderRadius:10, cursor:"pointer", fontFamily:FONTS.ui, fontSize:13, color:"#2C2C2A" }}>
          Save Session
        </button>
      ) : (
        <div style={{ display:"flex", gap:6 }}>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Session title…" style={{ flex:1, padding:"8px 10px", border:"0.5px solid #D3D1C7", borderRadius:8, fontFamily:FONTS.ui, fontSize:13, color:"#2C2C2A", background:"#F9F8F5" }}/>
          <button onClick={save} disabled={busy} style={{ padding:"8px 14px", background:"#534AB7", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontFamily:FONTS.ui, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
            {busy && <Spinner/>} Save
          </button>
          <button onClick={()=>setOpen(false)} style={{ padding:"8px 10px", background:"none", border:"0.5px solid #D3D1C7", borderRadius:8, cursor:"pointer", color:"#888780", fontSize:13 }}>✕</button>
        </div>
      )}
      {toast && <div style={{ fontSize:12, color:"#1D9E75", fontFamily:FONTS.ui, marginTop:4 }}>{toast}</div>}
    </div>
  );
};

// ── Main App ──────────────────────────────────────────────────────────────────

export default function StyleMirror() {
  const [tab,          setTab]         = useState("samples");
  const [samples,      setSamples]     = useState([]);
  const [sampleInput,  setSampleInput] = useState("");
  const [sampleTitle,  setSampleTitle] = useState("");
  const [seed,         setSeed]        = useState("");
  const [profile,      setProfile]     = useState("reflective");
  const [result,       setResult]      = useState(null);
  const [streaming,    setStreaming]    = useState(false);
  const [streamText,   setStreamText]  = useState("");
  const [error,        setError]       = useState("");
  const [feedbackOpen, setFeedbackOpen]= useState(false);
  const [backendOk,    setBackendOk]   = useState(null);  // null=checking, true/false
  const streamRef  = useRef("");
  const outputRef  = useRef(null);

  // check backend health on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setBackendOk(!!d))
      .catch(() => setBackendOk(false));
  }, []);

  const addSample = () => {
    if (sampleInput.trim().length < 50) { setError("Please paste at least a paragraph of your writing."); return; }
    setSamples(prev => [...prev, { title: sampleTitle || `Sample ${prev.length+1}`, text: sampleInput.trim() }]);
    setSampleInput(""); setSampleTitle(""); setError("");
  };

  const removeSample = i => setSamples(prev => prev.filter((_,idx)=>idx!==i));

  const generate = useCallback(async () => {
    if (wordCount(seed) < 30) { setError("Please write at least 3 meaningful sentences (30+ words) to anchor the new piece."); return; }
    setError(""); setResult(null); setStreamText(""); setStreaming(true);
    streamRef.current = "";

    const sampleText = samples.map((s,i)=>`--- Sample ${i+1}: "${s.title}" ---\n${s.text}`).join("\n\n");
    try {
      const resp = await fetch(ANTHROPIC, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:      "claude-sonnet-4-20250514",
          max_tokens: 1500,
          stream:     true,
          system:     SYSTEM_PROMPT(STYLE_PROFILES[profile].prompt, sampleText),
          messages:   [{ role:"user", content:`Here is my new piece. Please continue it in my voice:\n\n${seed}` }],
        }),
      });
      if (!resp.ok) throw new Error(`API error ${resp.status}`);
      const reader = resp.body.getReader();
      const dec    = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n").filter(l=>l.startsWith("data:"))) {
          try {
            const d = JSON.parse(line.slice(5));
            if (d.type==="content_block_delta" && d.delta?.text) {
              streamRef.current += d.delta.text;
              setStreamText(streamRef.current);
            }
          } catch { /* skip */ }
        }
      }
      const parsed = parseResponse(streamRef.current);
      setResult(parsed);
      setStreamText("");
      setTab("output");
      setTimeout(()=>outputRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 100);
    } catch(e) {
      setError("Something went wrong: " + e.message);
    } finally {
      setStreaming(false);
    }
  }, [samples, seed, profile]);

  // load a session back into state
  const handleLoadSession = (d) => {
    if (d.seed)         setSeed(d.seed);
    if (d.profile)      setProfile(d.profile);
    if (d.samples)      setSamples(d.samples);
    if (d.continuation) setResult({ text: d.continuation, score: d.score||null });
    setTab("output");
  };

  const seedWords = wordCount(seed);
  const visibleTabs = TABS.filter(t => !t.resultOnly || result);

  return (
    <div style={{ fontFamily:FONTS.ui, maxWidth:800, margin:"0 auto", padding:"2rem 1rem" }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        button:hover { opacity:0.87; }
        textarea:focus, input:focus { outline:2px solid #AFA9EC; outline-offset:1px; }
      `}</style>

      {/* ── header ── */}
      <div style={{ marginBottom:"1.5rem" }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:10, flexWrap:"wrap" }}>
          <h1 style={{ fontFamily:FONTS.display, fontSize:32, fontWeight:700, margin:0, color:"#2C2C2A", letterSpacing:"-0.5px" }}>StyleMirror</h1>
          <span style={{ fontSize:13, color:"#888780", fontStyle:"italic", fontFamily:FONTS.body }}>your voice, continued</span>
          <span style={{ marginLeft:"auto", fontSize:11, padding:"3px 8px", borderRadius:8,
            background: backendOk===null?"#F1EFE8":backendOk?"#EAF3DE":"#FAECE7",
            color:      backendOk===null?"#888780":backendOk?"#3B6D11":"#993C1D",
            border:     "0.5px solid", borderColor: backendOk===null?"#D3D1C7":backendOk?"#97C459":"#F0997B",
            fontFamily: FONTS.ui,
          }}>
            {backendOk===null?"checking backend…":backendOk?"backend ✓ connected":"backend offline"}
          </span>
        </div>
      </div>

      {/* ── tabs ── */}
      <div style={{ display:"flex", borderBottom:"0.5px solid #D3D1C7", marginBottom:"1.5rem", gap:4, overflowX:"auto" }}>
        {visibleTabs.map(t => (
          <Tab key={t.id} label={t.label} icon={t.icon} active={tab===t.id} onClick={()=>setTab(t.id)}/>
        ))}
      </div>

      {/* ══ TAB: SAMPLES ══════════════════════════════════════════════════════ */}
      {tab==="samples" && (
        <div className="animate-fadeIn">
          <p style={{ fontSize:13, color:"#5F5E5A", marginBottom:"1rem", lineHeight:1.7 }}>
            Paste 1–3 essays or pieces you've written. Each sample should be at least a paragraph long.
          </p>

          {samples.length>0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:"1.5rem" }}>
              {samples.map((s,i) => (
                <Card key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 16px" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:500, color:"#2C2C2A" }}>{s.title}</span>
                      <Pill>{wordCount(s.text)} words</Pill>
                    </div>
                    <p style={{ fontSize:12, color:"#888780", margin:"4px 0 0", lineHeight:1.5 }}>{s.text.slice(0,120)}…</p>
                  </div>
                  <button onClick={()=>removeSample(i)} style={{ background:"none", border:"none", cursor:"pointer", color:"#D85A30", fontSize:16, padding:2 }}>✕</button>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <input value={sampleTitle} onChange={e=>setSampleTitle(e.target.value)} placeholder="Sample title (optional)"
              style={{ width:"100%", padding:"8px 12px", marginBottom:10, border:"0.5px solid #D3D1C7", borderRadius:8, fontFamily:FONTS.ui, fontSize:13, color:"#2C2C2A", background:"#F9F8F5", boxSizing:"border-box" }}/>
            <textarea value={sampleInput} onChange={e=>setSampleInput(e.target.value)}
              placeholder="Paste your writing here — an essay, blog post, journal entry, or any piece that represents your natural voice…"
              rows={8} style={{ width:"100%", padding:"10px 12px", border:"0.5px solid #D3D1C7", borderRadius:8, fontFamily:FONTS.body, fontSize:14, lineHeight:1.8, color:"#2C2C2A", background:"#FAFAF8", resize:"vertical", boxSizing:"border-box" }}/>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
              <span style={{ fontSize:12, color:"#B4B2A9" }}>{wordCount(sampleInput)} words</span>
              <button onClick={addSample} style={{ padding:"8px 20px", background:"#534AB7", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontFamily:FONTS.ui, fontSize:13, fontWeight:500 }}>Add Sample →</button>
            </div>
          </Card>

          <ErrorBox msg={error}/>

          {/* Vocab fingerprint lives in the samples tab */}
          <VocabPanel samples={samples}/>

          {samples.length>0 && (
            <button onClick={()=>setTab("write")} style={{ marginTop:"1rem", width:"100%", padding:"12px", background:"#F1EFE8", color:"#534AB7", border:"0.5px solid #AFA9EC", borderRadius:10, cursor:"pointer", fontFamily:FONTS.ui, fontSize:14, fontWeight:500 }}>
              Continue to New Piece →
            </button>
          )}
        </div>
      )}

      {/* ══ TAB: WRITE ════════════════════════════════════════════════════════ */}
      {tab==="write" && (
        <div className="animate-fadeIn">
          {/* style mode */}
          <div style={{ marginBottom:"1.5rem" }}>
            <Label>Style Mode</Label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
              {Object.entries(STYLE_PROFILES).map(([key,p]) => (
                <button key={key} onClick={()=>setProfile(key)} style={{ padding:"10px 14px", textAlign:"left", background:profile===key?"#EEEDFE":"#fff", border:profile===key?"0.5px solid #AFA9EC":"0.5px solid #D3D1C7", borderRadius:10, cursor:"pointer", transition:"all 0.15s" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                    <span style={{ color:profile===key?"#534AB7":"#888780", fontSize:14 }}>{p.icon}</span>
                    <span style={{ fontSize:13, fontWeight:500, color:profile===key?"#3C3489":"#2C2C2A", fontFamily:FONTS.ui }}>{p.label}</span>
                  </div>
                  <span style={{ fontSize:11, color:"#888780", fontFamily:FONTS.ui }}>{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* seed */}
          <div style={{ marginBottom:"1rem" }}>
            <Label>Your Opening — Seed the New Piece</Label>
            <textarea value={seed} onChange={e=>setSeed(e.target.value)}
              placeholder="Write at least 3 meaningful sentences on your new topic. This anchors the direction — StyleMirror will continue from here in your voice…"
              rows={7} style={{ width:"100%", padding:"14px 16px", border:"0.5px solid #D3D1C7", borderRadius:12, fontFamily:FONTS.body, fontSize:15, lineHeight:1.9, color:"#2C2C2A", background:"#FAFAF8", resize:"vertical", boxSizing:"border-box" }}/>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
              <span style={{ fontSize:12, color:seedWords>=30?"#1D9E75":"#D85A30" }}>{seedWords} / 30 words minimum</span>
              {samples.length===0 && <span style={{ fontSize:12, color:"#BA7517" }}>⚠ No style samples</span>}
            </div>
          </div>

          {/* live readability on seed */}
          <ReadabilityPanel text={seed}/>

          <ErrorBox msg={error}/>

          <button onClick={generate} disabled={streaming} style={{ width:"100%", padding:"14px", background:streaming?"#D3D1C7":"#534AB7", color:"#fff", border:"none", borderRadius:12, cursor:streaming?"not-allowed":"pointer", fontFamily:FONTS.ui, fontSize:15, fontWeight:500, transition:"background 0.2s", marginTop:"1rem" }}>
            {streaming ? "Mirroring your voice…" : "Continue in My Voice →"}
          </button>

          {/* streaming preview */}
          {streaming && streamText && (
            <div style={{ marginTop:"1.5rem", padding:"1.25rem 1.5rem", background:"#F9F8F5", border:"0.5px solid #D3D1C7", borderRadius:12 }}>
              <div style={{ fontSize:11, color:"#888780", marginBottom:10, fontFamily:FONTS.ui, letterSpacing:"0.05em" }}>GENERATING…</div>
              <p style={{ fontFamily:FONTS.body, fontSize:15, lineHeight:1.9, color:"#2C2C2A", margin:0, whiteSpace:"pre-wrap" }}>
                {streamText.split("STYLE_SCORE_JSON:")[0]}
                <span className="cursor-blink" style={{ display:"inline-block", width:2, height:"1em", background:"#534AB7", verticalAlign:"middle", marginLeft:2 }}/>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: SESSIONS ═════════════════════════════════════════════════════ */}
      {tab==="sessions" && (
        <div className="animate-fadeIn">
          <SessionsPanel onLoad={handleLoadSession}/>
        </div>
      )}

      {/* ══ TAB: OUTPUT ═══════════════════════════════════════════════════════ */}
      {tab==="output" && result && (
        <div ref={outputRef} className="animate-fadeIn">
          {/* score card */}
          {result.score && (
            <Card style={{ display:"flex", alignItems:"flex-start", gap:20, marginBottom:"1.5rem" }}>
              <div style={{ flexShrink:0 }}>
                <ScoreRing value={result.score.confidence}/>
                <div style={{ fontSize:11, color:"#888780", textAlign:"center", marginTop:4, fontFamily:FONTS.ui }}>Style Match</div>
              </div>
              <div style={{ flex:1 }}>
                <Label>Detected Traits</Label>
                <div style={{ marginBottom:12 }}>{result.score.traits?.map((t,i)=><Pill key={i} color="#534AB7" bg="#EEEDFE">{t}</Pill>)}</div>
                <div style={{ background:"#EEEDFE", borderRadius:8, padding:"10px 14px", fontSize:13, fontFamily:FONTS.body, fontStyle:"italic", color:"#3C3489", lineHeight:1.7 }}>
                  "{result.score.feedback}"
                </div>
              </div>
            </Card>
          )}

          {/* the text */}
          <div style={{ background:"#FAFAF8", border:"0.5px solid #D3D1C7", borderRadius:12, padding:"2rem 2.5rem", marginBottom:"1rem" }}>
            <div style={{ fontSize:11, color:"#888780", marginBottom:"1.5rem", fontFamily:FONTS.ui, letterSpacing:"0.05em" }}>
              YOUR SEED · {STYLE_PROFILES[profile].icon} {STYLE_PROFILES[profile].label}
            </div>
            <p style={{ fontFamily:FONTS.body, fontSize:15, lineHeight:1.9, color:"#5F5E5A", margin:"0 0 1.5rem", paddingBottom:"1.5rem", borderBottom:"0.5px solid #E5E3DC", fontStyle:"italic" }}>
              {seed}
            </p>
            <div style={{ fontSize:11, color:"#888780", marginBottom:"1.2rem", fontFamily:FONTS.ui, letterSpacing:"0.05em" }}>CONTINUATION</div>
            <div style={{ fontFamily:FONTS.body, fontSize:15.5, lineHeight:2, color:"#2C2C2A", whiteSpace:"pre-wrap" }}>{result.text}</div>
          </div>

          {/* readability of continuation */}
          <ReadabilityPanel text={result.text}/>

          {/* sentence heatmap */}
          <SentenceHeatmap text={result.text}/>

          {/* originality check */}
          <OriginalityCheck text={result.text} samples={samples}/>

          {/* actions */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:"1rem", marginBottom:"1rem" }}>
            <button onClick={()=>navigator.clipboard.writeText(seed+"\n\n"+result.text)} style={{ padding:"10px", background:"#fff", border:"0.5px solid #D3D1C7", borderRadius:10, cursor:"pointer", fontFamily:FONTS.ui, fontSize:13, color:"#2C2C2A" }}>Copy Text</button>
            <ExportPDF seed={seed} continuation={result.text} score={result.score} profile={profile}/>
            <button onClick={()=>{ setResult(null); setSeed(""); setTab("write"); }} style={{ padding:"10px", background:"#fff", border:"0.5px solid #D3D1C7", borderRadius:10, cursor:"pointer", fontFamily:FONTS.ui, fontSize:13, color:"#2C2C2A" }}>New Piece</button>
          </div>

          {/* save session */}
          <SaveSession seed={seed} continuation={result.text} score={result.score} samples={samples} profile={profile} onSaved={()=>setTab("sessions")}/>

          {/* reflection prompts */}
          <div style={{ marginTop:"1rem", background:"#F1EFE8", border:"0.5px solid #D3D1C7", borderRadius:10, overflow:"hidden" }}>
            <button onClick={()=>setFeedbackOpen(v=>!v)} style={{ width:"100%", padding:"12px 16px", background:"none", border:"none", cursor:"pointer", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center", fontFamily:FONTS.ui, fontSize:13, color:"#5F5E5A" }}>
              <span>◎ Refine your thinking — reflection prompts</span>
              <span style={{ transform:feedbackOpen?"rotate(180deg)":"rotate(0)", transition:"transform 0.2s", fontSize:10 }}>▼</span>
            </button>
            {feedbackOpen && (
              <div style={{ padding:"0 16px 16px", display:"flex", flexDirection:"column", gap:8 }}>
                {REFLECTION_PROMPTS.map((q,i)=>(
                  <div key={i} style={{ padding:"8px 12px", background:"#fff", border:"0.5px solid #D3D1C7", borderRadius:8, fontSize:13, color:"#2C2C2A", fontFamily:FONTS.body, fontStyle:"italic", lineHeight:1.6 }}>{q}</div>
                ))}
              </div>
            )}
          </div>

          {/* add to samples */}
          <div style={{ marginTop:"1rem", padding:"12px 16px", background:"#EAF3DE", border:"0.5px solid #C0DD97", borderRadius:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:13, color:"#3B6D11", fontFamily:FONTS.ui }}>Add this piece to your style profile to improve future mirrors</span>
            <button onClick={()=>{ setSamples(prev=>[...prev,{ title:`Generated ${new Date().toLocaleDateString()}`, text:seed+"\n\n"+result.text }]); setTab("samples"); }} style={{ padding:"6px 14px", background:"#3B6D11", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontFamily:FONTS.ui, fontSize:12, fontWeight:500, whiteSpace:"nowrap", marginLeft:12 }}>
              Add to Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
