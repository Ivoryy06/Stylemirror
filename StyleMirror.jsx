// StyleMirror v2.0 — StyleMirror.jsx

import { useState, useRef, useCallback, useEffect } from "react";
import "./src/index.css";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8787";

const FONTS = {
  display: "'Georgia', serif",
  body:    "'Georgia', serif",
  mono:    "ui-monospace, Consolas, monospace",
  ui:      "'Inter', system-ui, sans-serif",
};

// ── i18n ──────────────────────────────────────────────────────────────────────

const I18N = {
  en_gb: {
    tagline: "your voice, continued",
    tabs: { samples:"Style Samples", write:"New Piece", sessions:"Sessions", output:"Output" },
    samplesHint: "Paste 1–3 pieces you've written. Each sample should be at least a paragraph long.",
    sampleTitlePlaceholder: "Sample title (optional)",
    sampleTextPlaceholder: "Paste your writing here — an essay, blog post, journal entry…",
    addSample: "Add Sample →",
    continueToWrite: "Continue to New Piece →",
    styleMode: "Style Mode",
    seedLabel: "Your Opening — Seed the New Piece",
    seedPlaceholder: "Write at least 3 meaningful sentences on your new topic…",
    seedMin: "words minimum",
    noSamples: "⚠ No style samples",
    generateBtn: "Continue in My Voice →",
    generating: "Mirroring your voice…",
    copyText: "Copy Text",
    exportPdf: "Export PDF",
    newPiece: "New Piece",
    saveSession: "Save Session",
    sessionTitle: "Session title…",
    save: "Save",
    savedSessions: "Saved Sessions",
    refresh: "Refresh",
    noSessions: "No sessions yet. Generate a piece and save it.",
    load: "Load",
    del: "Del",
    readability: "Readability",
    vocabFingerprint: "Vocabulary Fingerprint",
    analyse: "Analyse",
    signatureWords: "Signature words",
    topContentWords: "Top content words",
    originalityCheck: "Originality Check",
    check: "Check",
    looksOriginal: "✓ Looks original",
    overlapDetected: "⚠ Significant overlap detected",
    sentenceHeatmap: "Sentence Length Heatmap",
    styleMatch: "Style Match",
    detectedTraits: "Detected Traits",
    yourSeed: "Your Seed",
    continuation: "Continuation",
    addToProfile: "Add to Profile",
    addToProfileMsg: "Add this piece to your style profile",
    reflectionPrompts: "◎ Reflection prompts",
    toneAnalysis: "Tone Analysis",
    dominant: "Dominant",
    intensity: "Intensity",
    structureFingerprint: "Structure Fingerprint",
    styleDrift: "Style Drift",
    driftScore: "Drift Score",
    noDrift: "✓ Continuation matches your structural style",
    avgSentLen: "Avg sent len",
    variance: "Variance",
    shortSents: "Short sents",
    longSents: "Long sents",
    paragraphs: "Paragraphs",
    checking: "checking…",
    online: "● online",
    offline: "● offline",
    theme: "Theme",
    language: "Language",
    errorShort: "Please paste at least a paragraph of your writing.",
    errorSeed: "Please write at least 3 meaningful sentences (30+ words).",
    backendOffline: "Backend offline — start the Python server first.",
    pdfFailed: "PDF export failed — is the backend running?",
    pdfDownloaded: "PDF downloaded!",
    wordGoal: "Word Goal",
    wordGoalPlaceholder: "Set a word goal…",
    outputLength: "Output Length",
    outputShort: "Short",
    outputMedium: "Medium",
    outputLong: "Long",
    focusMode: "Focus",
    exitFocus: "Exit Focus",
  },
  en_us: {
    tagline: "your voice, continued",
    tabs: { samples:"Style Samples", write:"New Piece", sessions:"Sessions", output:"Output" },
    samplesHint: "Paste 1–3 pieces you've written. Each sample should be at least a paragraph long.",
    sampleTitlePlaceholder: "Sample title (optional)",
    sampleTextPlaceholder: "Paste your writing here — an essay, blog post, journal entry…",
    addSample: "Add Sample →",
    continueToWrite: "Continue to New Piece →",
    styleMode: "Style Mode",
    seedLabel: "Your Opening — Seed the New Piece",
    seedPlaceholder: "Write at least 3 meaningful sentences on your new topic…",
    seedMin: "words minimum",
    noSamples: "⚠ No style samples",
    generateBtn: "Continue in My Voice →",
    generating: "Mirroring your voice…",
    copyText: "Copy Text",
    exportPdf: "Export PDF",
    newPiece: "New Piece",
    saveSession: "Save Session",
    sessionTitle: "Session title…",
    save: "Save",
    savedSessions: "Saved Sessions",
    refresh: "Refresh",
    noSessions: "No sessions yet. Generate a piece and save it.",
    load: "Load",
    del: "Del",
    readability: "Readability",
    vocabFingerprint: "Vocabulary Fingerprint",
    analyse: "Analyze",
    signatureWords: "Signature words",
    topContentWords: "Top content words",
    originalityCheck: "Originality Check",
    check: "Check",
    looksOriginal: "✓ Looks original",
    overlapDetected: "⚠ Significant overlap detected",
    sentenceHeatmap: "Sentence Length Heatmap",
    styleMatch: "Style Match",
    detectedTraits: "Detected Traits",
    yourSeed: "Your Seed",
    continuation: "Continuation",
    addToProfile: "Add to Profile",
    addToProfileMsg: "Add this piece to your style profile",
    reflectionPrompts: "◎ Reflection prompts",
    toneAnalysis: "Tone Analysis",
    dominant: "Dominant",
    intensity: "Intensity",
    structureFingerprint: "Structure Fingerprint",
    styleDrift: "Style Drift",
    driftScore: "Drift Score",
    noDrift: "✓ Continuation matches your structural style",
    avgSentLen: "Avg sent len",
    variance: "Variance",
    shortSents: "Short sents",
    longSents: "Long sents",
    paragraphs: "Paragraphs",
    checking: "checking…",
    online: "● online",
    offline: "● offline",
    theme: "Theme",
    language: "Language",
    errorShort: "Please paste at least a paragraph of your writing.",
    errorSeed: "Please write at least 3 meaningful sentences (30+ words).",
    backendOffline: "Backend offline — start the Python server first.",
    pdfFailed: "PDF export failed — is the backend running?",
    pdfDownloaded: "PDF downloaded!",
    wordGoal: "Word Goal",
    wordGoalPlaceholder: "Set a word goal…",
    outputLength: "Output Length",
    outputShort: "Short",
    outputMedium: "Medium",
    outputLong: "Long",
    focusMode: "Focus",
    exitFocus: "Exit Focus",
  },
  vi: {
    tagline: "giọng văn của bạn, tiếp nối",
    tabs: { samples:"Mẫu văn phong", write:"Bài viết mới", sessions:"Phiên", output:"Kết quả" },
    samplesHint: "Dán 1–3 đoạn văn bạn đã viết. Mỗi mẫu nên có ít nhất một đoạn.",
    sampleTitlePlaceholder: "Tiêu đề mẫu (tùy chọn)",
    sampleTextPlaceholder: "Dán văn bản của bạn vào đây — bài luận, blog, nhật ký…",
    addSample: "Thêm mẫu →",
    continueToWrite: "Tiếp tục đến bài viết mới →",
    styleMode: "Chế độ văn phong",
    seedLabel: "Phần mở đầu — Khởi đầu bài viết mới",
    seedPlaceholder: "Viết ít nhất 3 câu có nghĩa về chủ đề mới của bạn…",
    seedMin: "từ tối thiểu",
    noSamples: "⚠ Chưa có mẫu văn phong",
    generateBtn: "Tiếp tục với giọng văn của tôi →",
    generating: "Đang phản chiếu giọng văn của bạn…",
    copyText: "Sao chép văn bản",
    exportPdf: "Xuất PDF",
    newPiece: "Bài viết mới",
    saveSession: "Lưu phiên",
    sessionTitle: "Tiêu đề phiên…",
    save: "Lưu",
    savedSessions: "Phiên đã lưu",
    refresh: "Làm mới",
    noSessions: "Chưa có phiên nào. Tạo bài viết và lưu lại.",
    load: "Tải",
    del: "Xóa",
    readability: "Độ dễ đọc",
    vocabFingerprint: "Dấu ấn từ vựng",
    analyse: "Phân tích",
    signatureWords: "Từ đặc trưng",
    topContentWords: "Từ nội dung hàng đầu",
    originalityCheck: "Kiểm tra tính độc đáo",
    check: "Kiểm tra",
    looksOriginal: "✓ Có vẻ độc đáo",
    overlapDetected: "⚠ Phát hiện trùng lặp đáng kể",
    sentenceHeatmap: "Bản đồ độ dài câu",
    styleMatch: "Độ khớp văn phong",
    detectedTraits: "Đặc điểm phát hiện",
    yourSeed: "Phần mở đầu của bạn",
    continuation: "Phần tiếp nối",
    addToProfile: "Thêm vào hồ sơ",
    addToProfileMsg: "Thêm bài viết này vào hồ sơ văn phong của bạn",
    reflectionPrompts: "◎ Câu hỏi suy ngẫm",
    toneAnalysis: "Phân tích giọng điệu",
    dominant: "Chủ đạo",
    intensity: "Cường độ",
    structureFingerprint: "Dấu ấn cấu trúc",
    styleDrift: "Độ lệch văn phong",
    driftScore: "Điểm lệch",
    noDrift: "✓ Phần tiếp nối khớp với văn phong cấu trúc của bạn",
    avgSentLen: "Độ dài câu TB",
    variance: "Phương sai",
    shortSents: "Câu ngắn",
    longSents: "Câu dài",
    paragraphs: "Đoạn văn",
    checking: "đang kiểm tra…",
    online: "● trực tuyến",
    offline: "● ngoại tuyến",
    theme: "Giao diện",
    language: "Ngôn ngữ",
    errorShort: "Vui lòng dán ít nhất một đoạn văn của bạn.",
    errorSeed: "Vui lòng viết ít nhất 3 câu có nghĩa (30+ từ).",
    backendOffline: "Backend ngoại tuyến — hãy khởi động máy chủ Python trước.",
    pdfFailed: "Xuất PDF thất bại — backend có đang chạy không?",
    pdfDownloaded: "Đã tải PDF!",
    wordGoal: "Mục tiêu từ",
    wordGoalPlaceholder: "Đặt mục tiêu từ…",
    outputLength: "Độ dài đầu ra",
    outputShort: "Ngắn",
    outputMedium: "Vừa",
    outputLong: "Dài",
    focusMode: "Tập trung",
    exitFocus: "Thoát tập trung",
  },
  id: {
    tagline: "suaramu, dilanjutkan",
    tabs: { samples:"Sampel Gaya", write:"Tulisan Baru", sessions:"Sesi", output:"Hasil" },
    samplesHint: "Tempel 1–3 tulisanmu. Setiap sampel minimal satu paragraf.",
    sampleTitlePlaceholder: "Judul sampel (opsional)",
    sampleTextPlaceholder: "Tempel tulisanmu di sini — esai, blog, jurnal…",
    addSample: "Tambah Sampel →",
    continueToWrite: "Lanjut ke Tulisan Baru →",
    styleMode: "Mode Gaya",
    seedLabel: "Pembuka — Mulai Tulisan Baru",
    seedPlaceholder: "Tulis minimal 3 kalimat bermakna tentang topikmu…",
    seedMin: "kata minimum",
    noSamples: "⚠ Belum ada sampel gaya",
    generateBtn: "Lanjutkan dengan Suaraku →",
    generating: "Mencerminkan suaramu…",
    copyText: "Salin Teks",
    exportPdf: "Ekspor PDF",
    newPiece: "Tulisan Baru",
    saveSession: "Simpan Sesi",
    sessionTitle: "Judul sesi…",
    save: "Simpan",
    savedSessions: "Sesi Tersimpan",
    refresh: "Perbarui",
    noSessions: "Belum ada sesi. Buat tulisan dan simpan.",
    load: "Muat",
    del: "Hapus",
    readability: "Keterbacaan",
    vocabFingerprint: "Sidik Jari Kosakata",
    analyse: "Analisis",
    signatureWords: "Kata khas",
    topContentWords: "Kata konten teratas",
    originalityCheck: "Cek Orisinalitas",
    check: "Cek",
    looksOriginal: "✓ Terlihat orisinal",
    overlapDetected: "⚠ Tumpang tindih signifikan terdeteksi",
    sentenceHeatmap: "Peta Panjang Kalimat",
    styleMatch: "Kecocokan Gaya",
    detectedTraits: "Ciri Terdeteksi",
    yourSeed: "Pembukamu",
    continuation: "Kelanjutan",
    addToProfile: "Tambah ke Profil",
    addToProfileMsg: "Tambahkan tulisan ini ke profil gayamu",
    reflectionPrompts: "◎ Pertanyaan refleksi",
    toneAnalysis: "Analisis Nada",
    dominant: "Dominan",
    intensity: "Intensitas",
    structureFingerprint: "Sidik Jari Struktur",
    styleDrift: "Pergeseran Gaya",
    driftScore: "Skor Pergeseran",
    noDrift: "✓ Kelanjutan cocok dengan gaya strukturalmu",
    avgSentLen: "Rata-rata panjang kalimat",
    variance: "Variansi",
    shortSents: "Kalimat pendek",
    longSents: "Kalimat panjang",
    paragraphs: "Paragraf",
    checking: "memeriksa…",
    online: "● online",
    offline: "● offline",
    theme: "Tema",
    language: "Bahasa",
    errorShort: "Tempel minimal satu paragraf tulisanmu.",
    errorSeed: "Tulis minimal 3 kalimat bermakna (30+ kata).",
    backendOffline: "Backend offline — jalankan server Python terlebih dahulu.",
    pdfFailed: "Ekspor PDF gagal — apakah backend berjalan?",
    pdfDownloaded: "PDF diunduh!",
    wordGoal: "Target Kata",
    wordGoalPlaceholder: "Tetapkan target kata…",
    outputLength: "Panjang Keluaran",
    outputShort: "Pendek",
    outputMedium: "Sedang",
    outputLong: "Panjang",
    focusMode: "Fokus",
    exitFocus: "Keluar Fokus",
  },
  ja: {
    tagline: "あなたの声を、続けて",
    tabs: { samples:"文体サンプル", write:"新しい文章", sessions:"セッション", output:"出力" },
    samplesHint: "あなたが書いた文章を1〜3つ貼り付けてください。各サンプルは少なくとも1段落以上。",
    sampleTitlePlaceholder: "サンプルのタイトル（任意）",
    sampleTextPlaceholder: "ここに文章を貼り付けてください — エッセイ、ブログ、日記など…",
    addSample: "サンプルを追加 →",
    continueToWrite: "新しい文章へ →",
    styleMode: "スタイルモード",
    seedLabel: "書き出し — 新しい文章のシード",
    seedPlaceholder: "新しいトピックについて意味のある文を3つ以上書いてください…",
    seedMin: "語以上",
    noSamples: "⚠ スタイルサンプルなし",
    generateBtn: "私の声で続ける →",
    generating: "あなたの声を反映中…",
    copyText: "テキストをコピー",
    exportPdf: "PDFエクスポート",
    newPiece: "新しい文章",
    saveSession: "セッションを保存",
    sessionTitle: "セッションタイトル…",
    save: "保存",
    savedSessions: "保存済みセッション",
    refresh: "更新",
    noSessions: "セッションがありません。文章を生成して保存してください。",
    load: "読み込む",
    del: "削除",
    readability: "読みやすさ",
    vocabFingerprint: "語彙フィンガープリント",
    analyse: "分析",
    signatureWords: "特徴語",
    topContentWords: "主要コンテンツ語",
    originalityCheck: "独自性チェック",
    check: "チェック",
    looksOriginal: "✓ 独自性あり",
    overlapDetected: "⚠ 重複が検出されました",
    sentenceHeatmap: "文長ヒートマップ",
    styleMatch: "スタイル一致",
    detectedTraits: "検出された特徴",
    yourSeed: "あなたの書き出し",
    continuation: "続き",
    addToProfile: "プロフィールに追加",
    addToProfileMsg: "この文章をスタイルプロフィールに追加",
    reflectionPrompts: "◎ 振り返りプロンプト",
    toneAnalysis: "トーン分析",
    dominant: "主要トーン",
    intensity: "強度",
    structureFingerprint: "構造フィンガープリント",
    styleDrift: "スタイルのずれ",
    driftScore: "ずれスコア",
    noDrift: "✓ 続きはあなたの構造スタイルと一致しています",
    avgSentLen: "平均文長",
    variance: "分散",
    shortSents: "短い文",
    longSents: "長い文",
    paragraphs: "段落",
    checking: "確認中…",
    online: "● オンライン",
    offline: "● オフライン",
    theme: "テーマ",
    language: "言語",
    errorShort: "少なくとも1段落の文章を貼り付けてください。",
    errorSeed: "意味のある文を3つ以上（30語以上）書いてください。",
    backendOffline: "バックエンドがオフラインです — Pythonサーバーを起動してください。",
    pdfFailed: "PDFエクスポートに失敗しました — バックエンドは起動していますか？",
    pdfDownloaded: "PDFをダウンロードしました！",
    wordGoal: "語数目標",
    wordGoalPlaceholder: "語数目標を設定…",
    outputLength: "出力の長さ",
    outputShort: "短め",
    outputMedium: "普通",
    outputLong: "長め",
    focusMode: "集中",
    exitFocus: "集中を終了",
  },
  fr: {
    tagline: "votre voix, continuée",
    tabs: { samples:"Échantillons", write:"Nouveau texte", sessions:"Sessions", output:"Résultat" },
    samplesHint: "Collez 1 à 3 textes que vous avez écrits. Chaque échantillon doit faire au moins un paragraphe.",
    sampleTitlePlaceholder: "Titre de l'échantillon (optionnel)",
    sampleTextPlaceholder: "Collez votre texte ici — essai, billet de blog, journal…",
    addSample: "Ajouter l'échantillon →",
    continueToWrite: "Passer au nouveau texte →",
    styleMode: "Mode de style",
    seedLabel: "Votre amorce — commencer le nouveau texte",
    seedPlaceholder: "Écrivez au moins 3 phrases significatives sur votre nouveau sujet…",
    seedMin: "mots minimum",
    noSamples: "⚠ Aucun échantillon de style",
    generateBtn: "Continuer dans ma voix →",
    generating: "Reflet de votre voix…",
    copyText: "Copier le texte",
    exportPdf: "Exporter en PDF",
    newPiece: "Nouveau texte",
    saveSession: "Sauvegarder la session",
    sessionTitle: "Titre de la session…",
    save: "Sauvegarder",
    savedSessions: "Sessions sauvegardées",
    refresh: "Actualiser",
    noSessions: "Aucune session. Générez un texte et sauvegardez-le.",
    load: "Charger",
    del: "Suppr.",
    readability: "Lisibilité",
    vocabFingerprint: "Empreinte lexicale",
    analyse: "Analyser",
    signatureWords: "Mots caractéristiques",
    topContentWords: "Mots de contenu principaux",
    originalityCheck: "Vérification d'originalité",
    check: "Vérifier",
    looksOriginal: "✓ Semble original",
    overlapDetected: "⚠ Chevauchement significatif détecté",
    sentenceHeatmap: "Carte de longueur des phrases",
    styleMatch: "Correspondance de style",
    detectedTraits: "Traits détectés",
    yourSeed: "Votre amorce",
    continuation: "Continuation",
    addToProfile: "Ajouter au profil",
    addToProfileMsg: "Ajouter ce texte à votre profil de style",
    reflectionPrompts: "◎ Questions de réflexion",
    toneAnalysis: "Analyse du ton",
    dominant: "Dominant",
    intensity: "Intensité",
    structureFingerprint: "Empreinte structurelle",
    styleDrift: "Dérive de style",
    driftScore: "Score de dérive",
    noDrift: "✓ La continuation correspond à votre style structurel",
    avgSentLen: "Long. moy. phrase",
    variance: "Variance",
    shortSents: "Phrases courtes",
    longSents: "Phrases longues",
    paragraphs: "Paragraphes",
    checking: "vérification…",
    online: "● en ligne",
    offline: "● hors ligne",
    theme: "Thème",
    language: "Langue",
    errorShort: "Veuillez coller au moins un paragraphe de votre texte.",
    errorSeed: "Veuillez écrire au moins 3 phrases significatives (30+ mots).",
    backendOffline: "Backend hors ligne — démarrez le serveur Python d'abord.",
    pdfFailed: "Échec de l'export PDF — le backend est-il en cours d'exécution ?",
    pdfDownloaded: "PDF téléchargé !",
    wordGoal: "Objectif de mots",
    wordGoalPlaceholder: "Définir un objectif…",
    outputLength: "Longueur de sortie",
    outputShort: "Court",
    outputMedium: "Moyen",
    outputLong: "Long",
    focusMode: "Focus",
    exitFocus: "Quitter le focus",
  },
  es: {
    tagline: "tu voz, continuada",
    tabs: { samples:"Muestras de estilo", write:"Nueva pieza", sessions:"Sesiones", output:"Resultado" },
    samplesHint: "Pega 1–3 textos que hayas escrito. Cada muestra debe tener al menos un párrafo.",
    sampleTitlePlaceholder: "Título de la muestra (opcional)",
    sampleTextPlaceholder: "Pega tu texto aquí — ensayo, blog, diario…",
    addSample: "Añadir muestra →",
    continueToWrite: "Continuar a nueva pieza →",
    styleMode: "Modo de estilo",
    seedLabel: "Tu apertura — inicia la nueva pieza",
    seedPlaceholder: "Escribe al menos 3 frases significativas sobre tu nuevo tema…",
    seedMin: "palabras mínimo",
    noSamples: "⚠ Sin muestras de estilo",
    generateBtn: "Continuar con mi voz →",
    generating: "Reflejando tu voz…",
    copyText: "Copiar texto",
    exportPdf: "Exportar PDF",
    newPiece: "Nueva pieza",
    saveSession: "Guardar sesión",
    sessionTitle: "Título de la sesión…",
    save: "Guardar",
    savedSessions: "Sesiones guardadas",
    refresh: "Actualizar",
    noSessions: "Sin sesiones. Genera una pieza y guárdala.",
    load: "Cargar",
    del: "Elim.",
    readability: "Legibilidad",
    vocabFingerprint: "Huella de vocabulario",
    analyse: "Analizar",
    signatureWords: "Palabras características",
    topContentWords: "Palabras de contenido principales",
    originalityCheck: "Verificación de originalidad",
    check: "Verificar",
    looksOriginal: "✓ Parece original",
    overlapDetected: "⚠ Superposición significativa detectada",
    sentenceHeatmap: "Mapa de longitud de oraciones",
    styleMatch: "Coincidencia de estilo",
    detectedTraits: "Rasgos detectados",
    yourSeed: "Tu apertura",
    continuation: "Continuación",
    addToProfile: "Añadir al perfil",
    addToProfileMsg: "Añadir esta pieza a tu perfil de estilo",
    reflectionPrompts: "◎ Preguntas de reflexión",
    toneAnalysis: "Análisis de tono",
    dominant: "Dominante",
    intensity: "Intensidad",
    structureFingerprint: "Huella estructural",
    styleDrift: "Deriva de estilo",
    driftScore: "Puntuación de deriva",
    noDrift: "✓ La continuación coincide con tu estilo estructural",
    avgSentLen: "Long. media oración",
    variance: "Varianza",
    shortSents: "Oraciones cortas",
    longSents: "Oraciones largas",
    paragraphs: "Párrafos",
    checking: "verificando…",
    online: "● en línea",
    offline: "● sin conexión",
    theme: "Tema",
    language: "Idioma",
    errorShort: "Pega al menos un párrafo de tu texto.",
    errorSeed: "Escribe al menos 3 frases significativas (30+ palabras).",
    backendOffline: "Backend sin conexión — inicia el servidor Python primero.",
    pdfFailed: "Error al exportar PDF — ¿está el backend en ejecución?",
    pdfDownloaded: "¡PDF descargado!",
    wordGoal: "Meta de palabras",
    wordGoalPlaceholder: "Establecer meta…",
    outputLength: "Longitud de salida",
    outputShort: "Corto",
    outputMedium: "Medio",
    outputLong: "Largo",
    focusMode: "Enfoque",
    exitFocus: "Salir del enfoque",
  },
  de: {
    tagline: "deine Stimme, fortgesetzt",
    tabs: { samples:"Stilproben", write:"Neuer Text", sessions:"Sitzungen", output:"Ergebnis" },
    samplesHint: "Füge 1–3 Texte ein, die du geschrieben hast. Jede Probe sollte mindestens einen Absatz lang sein.",
    sampleTitlePlaceholder: "Probentitel (optional)",
    sampleTextPlaceholder: "Füge deinen Text hier ein — Aufsatz, Blog, Tagebuch…",
    addSample: "Probe hinzufügen →",
    continueToWrite: "Weiter zum neuen Text →",
    styleMode: "Stilmodus",
    seedLabel: "Dein Einstieg — neuen Text beginnen",
    seedPlaceholder: "Schreibe mindestens 3 bedeutungsvolle Sätze zu deinem neuen Thema…",
    seedMin: "Wörter Minimum",
    noSamples: "⚠ Keine Stilproben",
    generateBtn: "In meiner Stimme fortfahren →",
    generating: "Deine Stimme wird gespiegelt…",
    copyText: "Text kopieren",
    exportPdf: "PDF exportieren",
    newPiece: "Neuer Text",
    saveSession: "Sitzung speichern",
    sessionTitle: "Sitzungstitel…",
    save: "Speichern",
    savedSessions: "Gespeicherte Sitzungen",
    refresh: "Aktualisieren",
    noSessions: "Keine Sitzungen. Erstelle einen Text und speichere ihn.",
    load: "Laden",
    del: "Lösch.",
    readability: "Lesbarkeit",
    vocabFingerprint: "Vokabular-Fingerabdruck",
    analyse: "Analysieren",
    signatureWords: "Charakteristische Wörter",
    topContentWords: "Wichtigste Inhaltswörter",
    originalityCheck: "Originalitätsprüfung",
    check: "Prüfen",
    looksOriginal: "✓ Wirkt original",
    overlapDetected: "⚠ Erhebliche Überschneidung erkannt",
    sentenceHeatmap: "Satzlängen-Heatmap",
    styleMatch: "Stilübereinstimmung",
    detectedTraits: "Erkannte Merkmale",
    yourSeed: "Dein Einstieg",
    continuation: "Fortsetzung",
    addToProfile: "Zum Profil hinzufügen",
    addToProfileMsg: "Diesen Text zu deinem Stilprofil hinzufügen",
    reflectionPrompts: "◎ Reflexionsfragen",
    toneAnalysis: "Tonanalyse",
    dominant: "Dominant",
    intensity: "Intensität",
    structureFingerprint: "Struktur-Fingerabdruck",
    styleDrift: "Stilabweichung",
    driftScore: "Abweichungswert",
    noDrift: "✓ Fortsetzung entspricht deinem strukturellen Stil",
    avgSentLen: "Ø Satzlänge",
    variance: "Varianz",
    shortSents: "Kurze Sätze",
    longSents: "Lange Sätze",
    paragraphs: "Absätze",
    checking: "prüfe…",
    online: "● online",
    offline: "● offline",
    theme: "Thema",
    language: "Sprache",
    errorShort: "Füge mindestens einen Absatz deines Textes ein.",
    errorSeed: "Schreibe mindestens 3 bedeutungsvolle Sätze (30+ Wörter).",
    backendOffline: "Backend offline — starte zuerst den Python-Server.",
    pdfFailed: "PDF-Export fehlgeschlagen — läuft das Backend?",
    pdfDownloaded: "PDF heruntergeladen!",
    wordGoal: "Wortziel",
    wordGoalPlaceholder: "Wortziel setzen…",
    outputLength: "Ausgabelänge",
    outputShort: "Kurz",
    outputMedium: "Mittel",
    outputLong: "Lang",
    focusMode: "Fokus",
    exitFocus: "Fokus beenden",
  },
  pt: {
    tagline: "sua voz, continuada",
    tabs: { samples:"Amostras de estilo", write:"Nova peça", sessions:"Sessões", output:"Resultado" },
    samplesHint: "Cole 1–3 textos que você escreveu. Cada amostra deve ter pelo menos um parágrafo.",
    sampleTitlePlaceholder: "Título da amostra (opcional)",
    sampleTextPlaceholder: "Cole seu texto aqui — ensaio, blog, diário…",
    addSample: "Adicionar amostra →",
    continueToWrite: "Continuar para nova peça →",
    styleMode: "Modo de estilo",
    seedLabel: "Sua abertura — inicie a nova peça",
    seedPlaceholder: "Escreva pelo menos 3 frases significativas sobre seu novo tema…",
    seedMin: "palavras mínimo",
    noSamples: "⚠ Sem amostras de estilo",
    generateBtn: "Continuar com minha voz →",
    generating: "Espelhando sua voz…",
    copyText: "Copiar texto",
    exportPdf: "Exportar PDF",
    newPiece: "Nova peça",
    saveSession: "Salvar sessão",
    sessionTitle: "Título da sessão…",
    save: "Salvar",
    savedSessions: "Sessões salvas",
    refresh: "Atualizar",
    noSessions: "Sem sessões. Gere uma peça e salve-a.",
    load: "Carregar",
    del: "Excl.",
    readability: "Legibilidade",
    vocabFingerprint: "Impressão digital do vocabulário",
    analyse: "Analisar",
    signatureWords: "Palavras características",
    topContentWords: "Principais palavras de conteúdo",
    originalityCheck: "Verificação de originalidade",
    check: "Verificar",
    looksOriginal: "✓ Parece original",
    overlapDetected: "⚠ Sobreposição significativa detectada",
    sentenceHeatmap: "Mapa de comprimento de frases",
    styleMatch: "Correspondência de estilo",
    detectedTraits: "Traços detectados",
    yourSeed: "Sua abertura",
    continuation: "Continuação",
    addToProfile: "Adicionar ao perfil",
    addToProfileMsg: "Adicionar esta peça ao seu perfil de estilo",
    reflectionPrompts: "◎ Perguntas de reflexão",
    toneAnalysis: "Análise de tom",
    dominant: "Dominante",
    intensity: "Intensidade",
    structureFingerprint: "Impressão digital estrutural",
    styleDrift: "Deriva de estilo",
    driftScore: "Pontuação de deriva",
    noDrift: "✓ A continuação corresponde ao seu estilo estrutural",
    avgSentLen: "Comp. médio frase",
    variance: "Variância",
    shortSents: "Frases curtas",
    longSents: "Frases longas",
    paragraphs: "Parágrafos",
    checking: "verificando…",
    online: "● online",
    offline: "● offline",
    theme: "Tema",
    language: "Idioma",
    errorShort: "Cole pelo menos um parágrafo do seu texto.",
    errorSeed: "Escreva pelo menos 3 frases significativas (30+ palavras).",
    backendOffline: "Backend offline — inicie o servidor Python primeiro.",
    pdfFailed: "Falha ao exportar PDF — o backend está em execução?",
    pdfDownloaded: "PDF baixado!",
    wordGoal: "Meta de palavras",
    wordGoalPlaceholder: "Definir meta…",
    outputLength: "Tamanho da saída",
    outputShort: "Curto",
    outputMedium: "Médio",
    outputLong: "Longo",
    focusMode: "Foco",
    exitFocus: "Sair do foco",
  },
};

const LANG_LABELS = { en_gb:"EN 🇬🇧", en_us:"EN 🇺🇸", id:"ID", ja:"JA", fr:"FR", es:"ES", de:"DE", pt:"PT", vi:"VI" };


// Accent colour presets — hue-shifted so light/mid/dark all derive from one hex
const ACCENT_PRESETS = [
  { label:"Lavender", accent:"#7c6fcd", light:"#eeecfb", mid:"#c5bff0", dark:"#5a4fb0" },
  { label:"Rose",     accent:"#c0607a", light:"#fceef2", mid:"#e8aab8", dark:"#9a3f58" },
  { label:"Sage",     accent:"#5a9070", light:"#eaf4ee", mid:"#a8d0b8", dark:"#3d7055" },
  { label:"Peach",    accent:"#c07850", light:"#fdf0e8", mid:"#e8bfa0", dark:"#9a5830" },
  { label:"Sky",      accent:"#4a88b8", light:"#e8f2fa", mid:"#9ec4e0", dark:"#2d6898" },
  { label:"Mauve",    accent:"#9a6898", light:"#f5eef5", mid:"#d0a8d0", dark:"#784878" },
];

function applyAccent({ accent, light, mid, dark }) {
  const r = document.documentElement.style;
  r.setProperty("--accent",       accent);
  r.setProperty("--accent-light", light);
  r.setProperty("--accent-mid",   mid);
  r.setProperty("--accent-dark",  dark);
}

const STYLE_PROFILES = {
  reflective:     { label:"Reflective",     icon:"◎", desc:"Introspective, personal, meditative",  prompt:"Write in a reflective, introspective tone — personal, meditative, exploring inner thoughts and feelings with nuance." },
  formal:         { label:"Formal",         icon:"◈", desc:"Structured, authoritative, precise",   prompt:"Write in a formal, authoritative tone — structured arguments, precise vocabulary, academic register." },
  narrative:      { label:"Narrative",      icon:"◇", desc:"Storytelling, vivid, immersive",       prompt:"Write in a narrative, storytelling tone — vivid scenes, immersive prose, character and place." },
  conversational: { label:"Conversational", icon:"◉", desc:"Warm, direct, accessible",             prompt:"Write in a conversational, warm tone — direct, accessible, like speaking to a smart friend." },
};

const TABS = [
  { id:"samples",  label:"Style Samples", icon:"◎" },
  { id:"write",    label:"New Piece",     icon:"◇" },
  { id:"sessions", label:"Sessions",      icon:"⊞" },
  { id:"output",   label:"Output",        icon:"◈", resultOnly: true },
];

const REFLECTION_PROMPTS = [
  "What's the single most important idea you want the reader to carry away?",
  "Is there a moment in your seed that you glossed over but could linger in?",
  "What tension or contradiction is driving this piece — and have you named it?",
  "Which sentence in the continuation surprised you? Why?",
];

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

// ── shared UI components ──────────────────────────────────────────────────────

const Pill = ({ children, color, bg }) => (
  <span style={{
    display:"inline-block", padding:"3px 10px",
    background: bg  || "var(--surface-2)",
    color:      color || "var(--text-muted)",
    borderRadius:20, fontSize:12, fontFamily:FONTS.ui,
    margin:"2px 3px 2px 0", border:"1px solid var(--border)",
  }}>
    {children}
  </span>
);

const Tab = ({ label, icon, active, onClick }) => (
  <button onClick={onClick} style={{
    display:"flex", alignItems:"center", gap:6,
    padding:"9px 16px", border:"none", cursor:"pointer",
    background: active ? "var(--surface)" : "transparent",
    borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
    color: active ? "var(--accent)" : "var(--text-muted)",
    fontFamily:FONTS.ui, fontSize:13,
    fontWeight: active ? 500 : 400,
    borderRadius:"8px 8px 0 0",
    transition:"all 0.15s",
  }}>
    <span style={{ fontSize:14 }}>{icon}</span>{label}
  </button>
);

const ScoreRing = ({ value }) => {
  const r = 28, circ = 2*Math.PI*r, dash = (value/100)*circ;
  const color = value>=80 ? "var(--green)" : value>=60 ? "var(--amber)" : "var(--red)";
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="5"/>
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
        transform="rotate(-90 36 36)" className="score-ring-arc"/>
      <text x="36" y="40" textAnchor="middle" fontSize="16" fontWeight="500" fill={color} fontFamily={FONTS.ui}>{value}</text>
    </svg>
  );
};

const Card = ({ children, style={} }) => (
  <div style={{
    background:"var(--surface)", border:"1px solid var(--border)",
    borderRadius:"var(--radius-md)", padding:"1.1rem 1.4rem",
    boxShadow:"var(--shadow-sm)", ...style,
  }}>
    {children}
  </div>
);

const Label = ({ children }) => (
  <div style={{ fontSize:11, color:"var(--text-muted)", fontFamily:FONTS.ui, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>
    {children}
  </div>
);

const ErrorBox = ({ msg }) => msg ? (
  <div style={{ padding:"10px 14px", background:"var(--red-bg)", border:"1px solid #e8b0a0", borderRadius:"var(--radius-sm)", fontSize:13, color:"var(--red)", marginBottom:"1rem" }}>
    {msg}
  </div>
) : null;

const Spinner = () => (
  <span style={{ display:"inline-block", width:13, height:13, border:"2px solid var(--accent-mid)", borderTopColor:"var(--accent)", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
);

const Btn = ({ children, onClick, disabled, variant="ghost", style={} }) => {
  const base = { padding:"8px 16px", border:"none", borderRadius:"var(--radius-sm)", cursor:disabled?"not-allowed":"pointer", fontFamily:FONTS.ui, fontSize:13, fontWeight:500, display:"inline-flex", alignItems:"center", gap:6, transition:"all 0.15s", ...style };
  const variants = {
    primary: { background:"var(--accent)",       color:"#fff",                opacity:disabled?0.5:1 },
    ghost:   { background:"var(--surface)",       color:"var(--text)",         border:"1px solid var(--border)" },
    light:   { background:"var(--accent-light)",  color:"var(--accent-dark)",  border:"1px solid var(--accent-mid)" },
    danger:  { background:"none",                 color:"var(--red)",          border:"1px solid #e8b0a0" },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>{children}</button>;
};

// ── Language Picker ───────────────────────────────────────────────────────────

const LanguagePicker = ({ lang, setLang, t }) => (
  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
    <span style={{ fontSize:11, color:"var(--text-faint)", fontFamily:FONTS.ui }}>{t.language}</span>
    {Object.entries(LANG_LABELS).map(([code, label]) => (
      <button key={code} onClick={() => setLang(code)} style={{
        padding:"2px 7px", borderRadius:10, border:"1px solid",
        borderColor: lang===code ? "var(--accent)" : "var(--border)",
        background:  lang===code ? "var(--accent-light)" : "transparent",
        color:       lang===code ? "var(--accent-dark)" : "var(--text-muted)",
        fontSize:11, fontFamily:FONTS.ui, cursor:"pointer", fontWeight: lang===code ? 600 : 400,
      }}>{label}</button>
    ))}
  </div>
);

// ── Color Picker ──────────────────────────────────────────────────────────────

const ColorPicker = ({ t }) => {
  const [active, setActive] = useState(0);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <span style={{ fontSize:11, color:"var(--text-faint)", fontFamily:FONTS.ui }}>{t?.theme ?? "Theme"}</span>
      {ACCENT_PRESETS.map((p, i) => (
        <button key={p.label} title={p.label} onClick={() => { applyAccent(p); setActive(i); }} style={{
          width:18, height:18, borderRadius:"50%", border: i===active ? "2px solid var(--text)" : "2px solid transparent",
          background:p.accent, cursor:"pointer", padding:0, flexShrink:0,
          boxShadow: i===active ? "0 0 0 2px var(--bg)" : "none",
          outline:"none", transition:"box-shadow 0.15s, border-color 0.15s",
        }}/>
      ))}
    </div>
  );
};

// ── Feature 1: Readability Panel ──────────────────────────────────────────────

const ReadabilityPanel = ({ text, t }) => {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
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
  const barW = data ? Math.round((data.flesch / 100) * 120) : 0;
  const cls  = data ? readabilityClass(data.level) : "";

  return (
    <div className="animate-fadeIn" style={{ marginTop:"1rem", padding:"12px 16px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <Label>{(t?.readability ?? "Readability")} {busy && <Spinner/>}</Label>
        {data && <span className={cls} style={{ fontSize:11, padding:"2px 8px", borderRadius:12, fontFamily:FONTS.ui }}>{data.level}</span>}
      </div>
      {data ? (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <div style={{ flex:1, height:5, background:"var(--border)", borderRadius:3, overflow:"hidden" }}>
              <div style={{ width:barW, height:"100%", background:"var(--accent)", borderRadius:3, transition:"width 0.8s ease" }}/>
            </div>
            <span style={{ fontSize:12, fontFamily:FONTS.mono, color:"var(--accent)", minWidth:32 }}>{data.flesch}</span>
          </div>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            {[["Grade",data.grade],["Words",data.total_words],["Avg sent",`${data.avg_sentence_len}w`]].map(([k,v]) => (
              <span key={k} style={{ fontSize:11, color:"var(--text-muted)", fontFamily:FONTS.ui }}>
                <b style={{ color:"var(--text)", fontWeight:500 }}>{v}</b> {k}
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

// ── Feature 2: Vocabulary Fingerprint ────────────────────────────────────────

const VocabPanel = ({ samples, t }) => {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!samples.length) return;
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/vocab-fingerprint`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ samples: samples.map(s => s.text) }),
      });
      if (r.ok) setData(await r.json());
    } catch { /* silent */ }
    finally { setBusy(false); }
  };

  return (
    <Card style={{ marginTop:"1rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <Label>{t.vocabFingerprint}</Label>
        <Btn onClick={run} disabled={busy || !samples.length} variant={samples.length?"primary":"ghost"}>
          {busy && <Spinner/>} {t.analyse}
        </Btn>
      </div>
      {data ? (
        <>
          <div style={{ display:"flex", gap:16, marginBottom:10, flexWrap:"wrap" }}>
            {[["TTR",data.ttr],["Unique",data.unique_words],["Avg len",`${data.avg_word_length}c`]].map(([k,v]) => (
              <div key={k} style={{ textAlign:"center" }}>
                <div style={{ fontSize:18, fontWeight:500, color:"var(--accent)", fontFamily:FONTS.ui }}>{v}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)" }}>{k}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:6 }}>
            <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:4 }}>{t.signatureWords}</div>
            <div>{data.signature_words?.map(w => <Pill key={w} color="var(--accent-dark)" bg="var(--accent-light)">{w}</Pill>)}</div>
          </div>
          <div>
            <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:4 }}>{t.topContentWords}</div>
            <div>{data.top_content_words?.map(w => <Pill key={w}>{w}</Pill>)}</div>
          </div>
        </>
      ) : (
        <p style={{ fontSize:13, color:"var(--text-muted)", fontFamily:FONTS.ui }}>
          {samples.length ? `Click ${t.analyse} to fingerprint your vocabulary.` : "Add style samples first."}
        </p>
      )}
    </Card>
  );
};

// ── Feature 3: PDF Export ─────────────────────────────────────────────────────

const ExportPDF = ({ seed, continuation, score, profile, t }) => {
  const [busy, setBusy]   = useState(false);
  const [toast, setToast] = useState("");

  const doExport = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/export-pdf`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ title:`StyleMirror — ${STYLE_PROFILES[profile].label}`, seed, continuation, score }),
      });
      if (!r.ok) { setToast(t?.pdfFailed ?? "PDF export failed"); return; }
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = "stylemirror_export.pdf"; a.click();
      URL.revokeObjectURL(url);
      setToast(t?.pdfDownloaded ?? "PDF downloaded!");
    } catch { setToast(t?.backendOffline ?? "Backend offline"); }
    finally { setBusy(false); setTimeout(() => setToast(""), 3500); }
  };

  return (
    <div style={{ position:"relative" }}>
      <Btn onClick={doExport} disabled={busy} variant="ghost" style={{ width:"100%", justifyContent:"center" }}>
        {busy && <Spinner/>} {t?.exportPdf ?? "Export PDF"}
      </Btn>
      {toast && (
        <div className="animate-fadeIn" style={{ position:"absolute", top:"-40px", left:"50%", transform:"translateX(-50%)", background:"var(--text)", color:"#fff", fontSize:12, padding:"5px 12px", borderRadius:8, whiteSpace:"nowrap", fontFamily:FONTS.ui }}>
          {toast}
        </div>
      )}
    </div>
  );
};

// ── Feature 4: Sessions Panel ─────────────────────────────────────────────────

const SessionsPanel = ({ onLoad, t }) => {
  const [sessions, setSessions] = useState([]);
  const [busy,     setBusy]     = useState(false);
  const [toast,    setToast]    = useState("");

  const fetchSessions = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/sessions`);
      if (r.ok) setSessions(await r.json());
      else setToast(t?.backendOffline ?? "Backend offline");
    } catch { setToast(t?.backendOffline ?? "Could not reach backend"); }
    finally { setBusy(false); }
  };

  useEffect(() => { fetchSessions(); }, []);

  const del = async id => {
    try {
      await fetch(`${API_BASE}/api/sessions/${id}`, { method:"DELETE" });
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch { /* silent */ }
  };

  const load = async id => {
    try {
      const r = await fetch(`${API_BASE}/api/sessions/${id}`);
      if (r.ok) onLoad(await r.json());
    } catch { /* silent */ }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
        <Label>{t?.savedSessions ?? "Saved Sessions"}</Label>
        <Btn onClick={fetchSessions} variant="ghost">{busy && <Spinner/>} {t?.refresh ?? "Refresh"}</Btn>
      </div>
      {toast && <div style={{ fontSize:13, color:"var(--red)", background:"var(--red-bg)", padding:"8px 12px", borderRadius:"var(--radius-sm)", marginBottom:"1rem" }}>{toast}</div>}
      {sessions.length === 0 && !busy && (
        <p style={{ fontSize:13, color:"var(--text-muted)", fontFamily:FONTS.ui, textAlign:"center", padding:"2rem" }}>
          {t?.noSessions ?? "No sessions yet."}
        </p>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {sessions.map(s => (
          <Card key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:500, color:"var(--text)", fontFamily:FONTS.ui }}>{s.title}</div>
              <div style={{ display:"flex", gap:8, marginTop:3 }}>
                <Pill>{STYLE_PROFILES[s.profile]?.icon} {s.profile}</Pill>
                <Pill>{s.word_count}w</Pill>
                <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:FONTS.ui, alignSelf:"center" }}>
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <Btn onClick={() => load(s.id)} variant="light">{t?.load ?? "Load"}</Btn>
              <Btn onClick={() => del(s.id)}  variant="danger">{t?.del ?? "Del"}</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ── Feature 5: Originality Check ─────────────────────────────────────────────

const OriginalityCheck = ({ text, samples, t }) => {
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

  const color = data ? (data.originality_pct >= 70 ? "var(--green)" : data.originality_pct >= 50 ? "var(--amber)" : "var(--red)") : "var(--text-muted)";

  return (
    <Card style={{ marginTop:"1rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <Label>{t?.originalityCheck ?? "Originality Check"}</Label>
        <Btn onClick={check} disabled={busy || !text} variant={text?"primary":"ghost"}>
          {busy && <Spinner/>} {t?.check ?? "Check"}
        </Btn>
      </div>
      {data ? (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
            <div style={{ fontSize:28, fontWeight:500, color, fontFamily:FONTS.ui }}>{data.originality_pct}%</div>
            <div>
              <div style={{ fontSize:13, color, fontFamily:FONTS.ui, fontWeight:500 }}>{data.flag ? (t?.overlapDetected ?? "⚠ Significant overlap detected") : (t?.looksOriginal ?? "✓ Looks original")}</div>
              <div style={{ fontSize:11, color:"var(--text-muted)" }}>vs your style samples</div>
            </div>
          </div>
          {data.matches?.length > 0 && data.matches.map((m, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--text-muted)", padding:"3px 0", borderBottom:"1px solid var(--border-soft)" }}>
              <span style={{ fontFamily:FONTS.ui }}>{m.title}</span>
              <span style={{ fontFamily:FONTS.mono, color:m.similarity>0.3?"var(--red)":m.similarity>0.15?"var(--amber)":"var(--green)" }}>
                {(m.similarity*100).toFixed(1)}% overlap
              </span>
            </div>
          ))}
        </>
      ) : (
        <p style={{ fontSize:13, color:"var(--text-muted)", fontFamily:FONTS.ui }}>Check how original your continuation is vs your saved samples.</p>
      )}
    </Card>
  );
};

// ── Sentence Heatmap ──────────────────────────────────────────────────────────

const SentenceHeatmap = ({ text, t }) => {
  if (!text || wordCount(text) < 30) return null;
  const sents = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const lens  = sents.map(s => s.split(/\s+/).filter(Boolean).length);
  const max   = Math.max(...lens, 1);

  return (
    <Card style={{ marginTop:"1rem" }}>
      <Label>{t?.sentenceHeatmap ?? "Sentence Length Heatmap"}</Label>
      <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
        {lens.map((len, i) => {
          const pct = (len / max) * 100;
          const cls = len > 30 ? "sent-bar-long" : len > 15 ? "sent-bar-mid" : "sent-bar-short";
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:20, fontSize:10, color:"var(--text-faint)", fontFamily:FONTS.mono, textAlign:"right" }}>{i+1}</div>
              <div style={{ flex:1, height:7, background:"var(--border-soft)", borderRadius:4, overflow:"hidden" }}>
                <div className={cls} style={{ width:`${pct}%`, height:"100%", borderRadius:4, transition:"width 0.5s ease" }}/>
              </div>
              <div style={{ width:24, fontSize:10, color:"var(--text-faint)", fontFamily:FONTS.mono }}>{len}w</div>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:12, marginTop:8 }}>
        {[["sent-bar-short","≤15w"],["sent-bar-mid","16–30w"],["sent-bar-long","30+w"]].map(([c,l]) => (
          <div key={c} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div className={c} style={{ width:10, height:10, borderRadius:2 }}/>
            <span style={{ fontSize:10, color:"var(--text-muted)", fontFamily:FONTS.ui }}>{l}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ── Save Session ──────────────────────────────────────────────────────────────

const SaveSession = ({ seed, continuation, score, samples, profile, onSaved, t }) => {
  const [title, setTitle] = useState("");
  const [busy,  setBusy]  = useState(false);
  const [toast, setToast] = useState("");
  const [open,  setOpen]  = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/sessions`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ title, seed, continuation, score, samples, profile }),
      });
      if (r.ok) { const d = await r.json(); setToast(`${t?.save ?? "Saved"}: ${d.title}`); setOpen(false); onSaved?.(); }
      else setToast(t?.backendOffline ?? "Save failed");
    } catch { setToast(t?.backendOffline ?? "Backend offline"); }
    finally { setBusy(false); setTimeout(() => setToast(""), 3000); }
  };

  return (
    <div>
      {!open ? (
        <Btn onClick={() => setOpen(true)} variant="ghost" style={{ width:"100%", justifyContent:"center" }}>{t?.saveSession ?? "Save Session"}</Btn>
      ) : (
        <div style={{ display:"flex", gap:6 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t?.sessionTitle ?? "Session title…"}
            style={{ flex:1, padding:"8px 10px", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", fontFamily:FONTS.ui, fontSize:13, color:"var(--text)", background:"var(--surface-2)" }}/>
          <Btn onClick={save} disabled={busy} variant="primary">{busy && <Spinner/>} {t?.save ?? "Save"}</Btn>
          <Btn onClick={() => setOpen(false)} variant="ghost">✕</Btn>
        </div>
      )}
      {toast && <div style={{ fontSize:12, color:"var(--green)", fontFamily:FONTS.ui, marginTop:4 }}>{toast}</div>}
    </div>
  );
};

// ── Feature 6: Tone Analysis ──────────────────────────────────────────────────

const TONE_COLORS = {
  joyful:        { bg:"#eafaf0", color:"#2d7a4f" },
  melancholic:   { bg:"#eef2fa", color:"#3a5080" },
  anxious:       { bg:"#fdf5e8", color:"#8a6020" },
  angry:         { bg:"#fdecea", color:"#9a3030" },
  contemplative: { bg:"#f0eefa", color:"#5a3a90" },
  confident:     { bg:"#e8f5fd", color:"#1a6080" },
  neutral:       { bg:"var(--surface-2)", color:"var(--text-muted)" },
};

const TonePanel = ({ texts, labels, t }) => {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!texts.length) return;
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/tone`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ texts }),
      });
      if (r.ok) setData(await r.json());
    } catch { /* silent */ }
    finally { setBusy(false); }
  };

  return (
    <Card style={{ marginTop:"1rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <Label>{t.toneAnalysis}</Label>
        <Btn onClick={run} disabled={busy || !texts.length} variant={texts.length?"primary":"ghost"}>
          {busy && <Spinner/>} {t.analyse}
        </Btn>
      </div>
      {data ? (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {data.map((d, i) => {
            const tc = TONE_COLORS[d.dominant] || TONE_COLORS.neutral;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:FONTS.ui, minWidth:80, flexShrink:0 }}>{labels[i]}</span>
                <span style={{ padding:"2px 10px", borderRadius:12, fontSize:12, fontFamily:FONTS.ui, background:tc.bg, color:tc.color, fontWeight:500 }}>
                  {d.dominant}
                </span>
                <div style={{ flex:1, height:5, background:"var(--border)", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${d.intensity}%`, height:"100%", background:tc.color, borderRadius:3, transition:"width 0.6s ease" }}/>
                </div>
                <span style={{ fontSize:11, fontFamily:FONTS.mono, color:"var(--text-muted)", minWidth:28 }}>{d.intensity}%</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ fontSize:13, color:"var(--text-muted)", fontFamily:FONTS.ui }}>
          {texts.length ? `Click ${t.analyse} to detect tone across your samples.` : "Add style samples first."}
        </p>
      )}
    </Card>
  );
};

// ── Feature 7: Structure Fingerprint + Style Drift ────────────────────────────

const StructurePanel = ({ text, label, t }) => {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!text) return;
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/structure`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ text }),
      });
      if (r.ok) setData(await r.json());
    } catch { /* silent */ }
    finally { setBusy(false); }
  };

  const marks = data ? [
    ["—", data.em_dashes], [";", data.semicolons], ["…", data.ellipses],
    ["?", data.questions], ["!", data.exclamations],
  ].filter(([,v]) => v > 0) : [];

  return (
    <Card style={{ marginTop:"1rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <Label>{t.structureFingerprint}{label ? ` — ${label}` : ""}</Label>
        <Btn onClick={run} disabled={busy || !text} variant={text?"primary":"ghost"}>
          {busy && <Spinner/>} {t.analyse}
        </Btn>
      </div>
      {data ? (
        <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
          {[
            [t.avgSentLen, `${data.avg_length}w`],
            [t.variance,   data.length_variance],
            [t.shortSents, `${(data.short_ratio*100).toFixed(0)}%`],
            [t.longSents,  `${(data.long_ratio*100).toFixed(0)}%`],
            [t.paragraphs, data.paragraph_count],
          ].map(([k,v]) => (
            <div key={k} style={{ textAlign:"center", minWidth:60 }}>
              <div style={{ fontSize:17, fontWeight:500, color:"var(--accent)", fontFamily:FONTS.ui }}>{v}</div>
              <div style={{ fontSize:10, color:"var(--text-muted)", fontFamily:FONTS.ui }}>{k}</div>
            </div>
          ))}
          {marks.length > 0 && (
            <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
              {marks.map(([m, v]) => (
                <Pill key={m} color="var(--accent-dark)" bg="var(--accent-light)">{m} ×{v}</Pill>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p style={{ fontSize:13, color:"var(--text-muted)", fontFamily:FONTS.ui }}>
          {text ? `Click ${t.analyse} to fingerprint sentence structure.` : "No text yet."}
        </p>
      )}
    </Card>
  );
};

const StyleDriftPanel = ({ samplesText, continuationText, t }) => {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!samplesText || !continuationText) return;
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/structure`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ samples_text: samplesText, continuation_text: continuationText }),
      });
      if (r.ok) setData(await r.json());
    } catch { /* silent */ }
    finally { setBusy(false); }
  };

  const color = data ? (data.drift_score < 20 ? "var(--green)" : data.drift_score < 50 ? "var(--amber)" : "var(--red)") : "var(--text-muted)";

  return (
    <Card style={{ marginTop:"1rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <Label>{t.styleDrift}</Label>
        <Btn onClick={run} disabled={busy || !samplesText || !continuationText} variant={(samplesText && continuationText)?"primary":"ghost"}>
          {busy && <Spinner/>} {t.check}
        </Btn>
      </div>
      {data ? (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <div style={{ fontSize:28, fontWeight:500, color, fontFamily:FONTS.ui }}>{data.drift_score}%</div>
            <div style={{ fontSize:13, color, fontFamily:FONTS.ui, fontWeight:500 }}>{t.driftScore}</div>
          </div>
          {data.flags?.length === 0 ? (
            <div style={{ fontSize:13, color:"var(--green)", fontFamily:FONTS.ui }}>{t.noDrift}</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {data.flags.map((f, i) => (
                <div key={i} style={{ fontSize:12, color:"var(--amber)", fontFamily:FONTS.ui, padding:"4px 8px", background:"#fdf5e8", borderRadius:"var(--radius-sm)", border:"1px solid #e8d0a0" }}>
                  ⚠ {f}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p style={{ fontSize:13, color:"var(--text-muted)", fontFamily:FONTS.ui }}>
          {samplesText && continuationText ? `Click ${t.check} to detect structural drift.` : "Requires samples and a continuation."}
        </p>
      )}
    </Card>
  );
};

// ── Feature 8: Word Goal Tracker ─────────────────────────────────────────────

const WordGoalTracker = ({ current, t }) => {
  const [goal, setGoal] = useState("");
  const g = parseInt(goal, 10);
  const valid = g > 0;
  const pct = valid ? Math.min(100, Math.round((current / g) * 100)) : 0;
  const color = pct >= 100 ? "var(--green)" : pct >= 60 ? "var(--amber)" : "var(--accent)";

  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8 }}>
      <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:FONTS.ui, whiteSpace:"nowrap" }}>{t.wordGoal}:</span>
      <input
        type="number" min="1" value={goal} onChange={e => setGoal(e.target.value)}
        placeholder={t.wordGoalPlaceholder}
        style={{ width:90, padding:"3px 7px", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", fontFamily:FONTS.ui, fontSize:12, color:"var(--text)", background:"var(--surface-2)" }}
      />
      {valid && (
        <>
          <div style={{ flex:1, height:5, background:"var(--border)", borderRadius:3, overflow:"hidden", minWidth:60 }}>
            <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:3, transition:"width 0.4s ease" }}/>
          </div>
          <span style={{ fontSize:11, fontFamily:FONTS.mono, color, minWidth:36 }}>{pct}%</span>
        </>
      )}
    </div>
  );
};

// ── Feature 9: Output Length Control ─────────────────────────────────────────

const OUTPUT_LENGTHS = [
  { key:"short",  tokens:500,  paragraphs:"1–2" },
  { key:"medium", tokens:1000, paragraphs:"3–4" },
  { key:"long",   tokens:1800, paragraphs:"5–7" },
];

const OutputLengthPicker = ({ value, onChange, t }) => (
  <div style={{ marginBottom:"1rem" }}>
    <Label>{t.outputLength}</Label>
    <div style={{ display:"flex", gap:8 }}>
      {OUTPUT_LENGTHS.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)} style={{
          flex:1, padding:"8px 10px", border:"1px solid", cursor:"pointer", transition:"all 0.15s",
          background:  value===o.key ? "var(--accent-light)" : "var(--surface)",
          borderColor: value===o.key ? "var(--accent-mid)"   : "var(--border)",
          borderRadius:"var(--radius-sm)", fontFamily:FONTS.ui,
        }}>
          <div style={{ fontSize:13, fontWeight:500, color: value===o.key ? "var(--accent-dark)" : "var(--text)" }}>
            {t[`output${o.key.charAt(0).toUpperCase()+o.key.slice(1)}`]}
          </div>
          <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:2 }}>{o.paragraphs}¶</div>
        </button>
      ))}
    </div>
  </div>
);

// ── Feature 10: Focus Mode ────────────────────────────────────────────────────

const FocusMode = ({ value, onChange, placeholder, onExit, t }) => (
  <div style={{
    position:"fixed", inset:0, zIndex:1000,
    background:"var(--bg)", display:"flex", flexDirection:"column",
    padding:"3rem 4rem", boxSizing:"border-box",
  }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
      <span style={{ fontFamily:FONTS.display, fontSize:18, color:"var(--text-muted)" }}>StyleMirror</span>
      <Btn onClick={onExit} variant="ghost">{t.exitFocus}</Btn>
    </div>
    <textarea
      autoFocus
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        flex:1, width:"100%", maxWidth:680, margin:"0 auto", display:"block",
        padding:"1rem 0", border:"none", outline:"none", resize:"none",
        fontFamily:FONTS.body, fontSize:17, lineHeight:2.1,
        color:"var(--text)", background:"transparent", boxSizing:"border-box",
      }}
    />
    <div style={{ textAlign:"center", marginTop:"1rem", fontSize:12, color:"var(--text-faint)", fontFamily:FONTS.ui }}>
      {value.trim().split(/\s+/).filter(Boolean).length} words
    </div>
  </div>
);

// ── Main App ──────────────────────────────────────────────────────────────────

export default function StyleMirror() {
  const [tab,           setTab]          = useState("samples");
  const [samples,       setSamples]      = useState([]);
  const [sampleInput,   setSampleInput]  = useState("");
  const [sampleTitle,   setSampleTitle]  = useState("");
  const [seed,          setSeed]         = useState("");
  const [profile,       setProfile]      = useState("reflective");
  const [result,        setResult]       = useState(null);
  const [streaming,     setStreaming]     = useState(false);
  const [streamText,    setStreamText]   = useState("");
  const [error,         setError]        = useState("");
  const [feedbackOpen,  setFeedbackOpen] = useState(false);
  const [backendOk,     setBackendOk]    = useState(null);
  const [lang,          setLang]         = useState("en_gb");
  const [outputLen,     setOutputLen]    = useState("medium");
  const [focusMode,     setFocusMode]    = useState(false);
  const [apiKey,        setApiKey]       = useState(() => localStorage.getItem("sm_api_key") || "");
  const [baseUrl,       setBaseUrl]      = useState(() => localStorage.getItem("sm_base_url") || "https://api.openai.com/v1");
  const [llmModel,      setLlmModel]     = useState(() => localStorage.getItem("sm_model") || "gpt-4o-mini");
  const [showKeyModal,  setShowKeyModal] = useState(false);
  const [keyInput,      setKeyInput]     = useState("");
  const [baseUrlInput,  setBaseUrlInput] = useState("");
  const [modelInput,    setModelInput]   = useState("");
  const t = I18N[lang];
  const streamRef = useRef("");
  const outputRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setBackendOk(!!d))
      .catch(() => setBackendOk(false));

    // Check if server already has a key; if not and user has none, show setup modal
    fetch(`${API_BASE}/api/config`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && !d.key_configured && !localStorage.getItem("sm_api_key")) {
          setKeyInput("");
          setBaseUrlInput(localStorage.getItem("sm_base_url") || "https://api.openai.com/v1");
          setModelInput(localStorage.getItem("sm_model") || "gpt-4o-mini");
          setShowKeyModal(true);
        }
      })
      .catch(() => {});
  }, []);

  const addSample = () => {
    if (sampleInput.trim().length < 50) { setError(t.errorShort); return; }
    setSamples(prev => [...prev, { title: sampleTitle || `Sample ${prev.length + 1}`, text: sampleInput.trim() }]);
    setSampleInput(""); setSampleTitle(""); setError("");
  };

  const removeSample = i => setSamples(prev => prev.filter((_, idx) => idx !== i));

  const generate = useCallback(async () => {
    if (wordCount(seed) < 30) { setError(t.errorSeed); return; }
    if (!apiKey) { setShowKeyModal(true); setKeyInput(""); setBaseUrlInput(baseUrl); setModelInput(llmModel); return; }
    setError(""); setResult(null); setStreamText(""); setStreaming(true);
    streamRef.current = "";
    const sampleText = samples.map((s, i) => `--- Sample ${i+1}: "${s.title}" ---\n${s.text}`).join("\n\n");
    const maxTokens  = OUTPUT_LENGTHS.find(o => o.key === outputLen)?.tokens ?? 1000;
    try {
      const resp = await fetch(`${API_BASE}/api/generate`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          api_key:    apiKey,
          base_url:   baseUrl,
          model:      llmModel,
          max_tokens: maxTokens,
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
        for (const line of dec.decode(value).split("\n").filter(l => l.startsWith("data:"))) {
          try {
            const d = JSON.parse(line.slice(5));
            if (d.type === "content_block_delta" && d.delta?.text) {
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
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 100);
    } catch(e) {
      setError("Something went wrong: " + e.message);
    } finally {
      setStreaming(false);
    }
  }, [samples, seed, profile]);

  const handleLoadSession = d => {
    if (d.seed)         setSeed(d.seed);
    if (d.profile)      setProfile(d.profile);
    if (d.samples)      setSamples(d.samples);
    if (d.continuation) setResult({ text: d.continuation, score: d.score || null });
    setTab("output");
  };

  const seedWords    = wordCount(seed);
  const visibleTabs  = TABS.filter(t => !t.resultOnly || result);
  const samplesText  = samples.map(s => s.text).join("\n\n");

  return (
    <div style={{ fontFamily:FONTS.ui, maxWidth:820, margin:"0 auto", padding:"2rem 1.25rem" }}>

      {focusMode && (
        <FocusMode value={seed} onChange={setSeed} placeholder={t.seedPlaceholder} onExit={() => setFocusMode(false)} t={t}/>
      )}

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:"1.75rem" }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
          <h1 style={{ fontFamily:FONTS.display, fontSize:28, fontWeight:600, margin:0, color:"var(--text)", letterSpacing:"-0.3px" }}>StyleMirror</h1>
          <span style={{ fontSize:13, color:"var(--text-muted)", fontStyle:"italic" }}>{t.tagline}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <LanguagePicker lang={lang} setLang={setLang} t={t}/>
          <ColorPicker t={t}/>
          <span style={{ fontSize:11, padding:"3px 10px", borderRadius:20,
            background:  backendOk===null?"var(--surface-2)":backendOk?"var(--green-bg)":"var(--red-bg)",
            color:       backendOk===null?"var(--text-muted)":backendOk?"var(--green)":"var(--red)",
            border:"1px solid", borderColor: backendOk===null?"var(--border)":backendOk?"#a8d8b8":"#e8b0a0",
          }}>
            {backendOk===null ? t.checking : backendOk ? t.online : t.offline}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:"1px solid var(--border)", marginBottom:"1.5rem", gap:2, overflowX:"auto" }}>
        {visibleTabs.map(tab_ => (
          <Tab key={tab_.id} label={t.tabs[tab_.id]} icon={tab_.icon} active={tab===tab_.id} onClick={() => setTab(tab_.id)}/>
        ))}
      </div>

      {/* ── SAMPLES ── */}
      {tab === "samples" && (
        <div className="animate-fadeIn">
          <p style={{ fontSize:14, color:"var(--text-muted)", marginBottom:"1rem", lineHeight:1.7 }}>
            {t.samplesHint}
          </p>
          {samples.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:"1.5rem" }}>
              {samples.map((s, i) => (
                <Card key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 16px" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:500, color:"var(--text)" }}>{s.title}</span>
                      <Pill>{wordCount(s.text)} words</Pill>
                    </div>
                    <p style={{ fontSize:12, color:"var(--text-muted)", margin:"4px 0 0", lineHeight:1.5 }}>{s.text.slice(0, 120)}…</p>
                  </div>
                  <button onClick={() => removeSample(i)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--red)", fontSize:16, padding:2 }}>✕</button>
                </Card>
              ))}
            </div>
          )}
          <Card>
            <input value={sampleTitle} onChange={e => setSampleTitle(e.target.value)} placeholder={t.sampleTitlePlaceholder}
              style={{ width:"100%", padding:"9px 12px", marginBottom:10, border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", fontFamily:FONTS.ui, fontSize:13, color:"var(--text)", background:"var(--surface-2)", boxSizing:"border-box" }}/>
            <textarea value={sampleInput} onChange={e => setSampleInput(e.target.value)}
              placeholder={t.sampleTextPlaceholder}
              rows={8} style={{ width:"100%", padding:"10px 12px", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", fontFamily:FONTS.body, fontSize:14, lineHeight:1.8, color:"var(--text)", background:"var(--bg)", resize:"vertical", boxSizing:"border-box" }}/>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
              <span style={{ fontSize:12, color:"var(--text-faint)" }}>{wordCount(sampleInput)} words</span>
              <Btn onClick={addSample} variant="primary">{t.addSample}</Btn>
            </div>
          </Card>
          <ErrorBox msg={error}/>
          <VocabPanel samples={samples} t={t}/>
          <TonePanel
            texts={samples.map(s => s.text)}
            labels={samples.map(s => s.title)}
            t={t}
          />
          {samples.length > 0 && (
            <Btn onClick={() => setTab("write")} variant="light" style={{ marginTop:"1rem", width:"100%", justifyContent:"center", padding:"12px" }}>
              {t.continueToWrite}
            </Btn>
          )}
        </div>
      )}

      {/* ── WRITE ── */}
      {tab === "write" && (
        <div className="animate-fadeIn">
          <div style={{ marginBottom:"1.5rem" }}>
            <Label>{t.styleMode}</Label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
              {Object.entries(STYLE_PROFILES).map(([key, p]) => (
                <button key={key} onClick={() => setProfile(key)} style={{
                  padding:"11px 14px", textAlign:"left", cursor:"pointer", transition:"all 0.15s", border:"1px solid",
                  background: profile===key ? "var(--accent-light)" : "var(--surface)",
                  borderColor: profile===key ? "var(--accent-mid)" : "var(--border)",
                  borderRadius:"var(--radius-md)", boxShadow: profile===key ? "var(--shadow-sm)" : "none",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                    <span style={{ color: profile===key ? "var(--accent)" : "var(--text-muted)", fontSize:14 }}>{p.icon}</span>
                    <span style={{ fontSize:13, fontWeight:500, color: profile===key ? "var(--accent-dark)" : "var(--text)", fontFamily:FONTS.ui }}>{p.label}</span>
                  </div>
                  <span style={{ fontSize:11, color:"var(--text-muted)", fontFamily:FONTS.ui }}>{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:"1rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <Label>{t.seedLabel}</Label>
              <Btn onClick={() => setFocusMode(true)} variant="ghost" style={{ padding:"4px 10px", fontSize:12 }}>⛶ {t.focusMode}</Btn>
            </div>
            <textarea value={seed} onChange={e => setSeed(e.target.value)}
              placeholder={t.seedPlaceholder}
              rows={7} style={{ width:"100%", padding:"14px 16px", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", fontFamily:FONTS.body, fontSize:15, lineHeight:1.9, color:"var(--text)", background:"var(--bg)", resize:"vertical", boxSizing:"border-box" }}/>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
              <span style={{ fontSize:12, color:seedWords>=30?"var(--green)":"var(--red)" }}>{seedWords} / 30 {t.seedMin}</span>
              {samples.length === 0 && <span style={{ fontSize:12, color:"var(--amber)" }}>{t.noSamples}</span>}
            </div>
            <WordGoalTracker current={seedWords} t={t}/>
          </div>

          <OutputLengthPicker value={outputLen} onChange={setOutputLen} t={t}/>
          <ReadabilityPanel text={seed} t={t}/>
          <ErrorBox msg={error}/>

          <Btn onClick={generate} disabled={streaming} variant="primary"
            style={{ width:"100%", justifyContent:"center", padding:"14px", fontSize:15, borderRadius:"var(--radius-md)", marginTop:"1rem", opacity:streaming?0.6:1 }}>
            {streaming ? <><Spinner/> {t.generating}</> : t.generateBtn}
          </Btn>

          {streaming && streamText && (
            <div style={{ marginTop:"1.5rem", padding:"1.25rem 1.5rem", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)" }}>
              <Label>{t.generating}</Label>
              <p style={{ fontFamily:FONTS.body, fontSize:15, lineHeight:1.9, color:"var(--text)", margin:0, whiteSpace:"pre-wrap" }}>
                {streamText.split("STYLE_SCORE_JSON:")[0]}
                <span style={{ display:"inline-block", width:2, height:"1em", background:"var(--accent)", verticalAlign:"middle", marginLeft:2, animation:"blink 1s step-end infinite" }}/>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── SESSIONS ── */}
      {tab === "sessions" && (
        <div className="animate-fadeIn">
          <SessionsPanel onLoad={handleLoadSession} t={t}/>
        </div>
      )}

      {/* ── OUTPUT ── */}
      {tab === "output" && result && (
        <div ref={outputRef} className="animate-fadeIn">
          {result.score && (
            <Card style={{ display:"flex", alignItems:"flex-start", gap:20, marginBottom:"1.5rem" }}>
              <div style={{ flexShrink:0 }}>
                <ScoreRing value={result.score.confidence}/>
                <div style={{ fontSize:11, color:"var(--text-muted)", textAlign:"center", marginTop:4 }}>{t.styleMatch}</div>
              </div>
              <div style={{ flex:1 }}>
                <Label>{t.detectedTraits}</Label>
                <div style={{ marginBottom:12 }}>{result.score.traits?.map((tr,i) => <Pill key={i} color="var(--accent-dark)" bg="var(--accent-light)">{tr}</Pill>)}</div>
                <div style={{ background:"var(--accent-light)", borderRadius:"var(--radius-sm)", padding:"10px 14px", fontSize:13, fontFamily:FONTS.body, fontStyle:"italic", color:"var(--accent-dark)", lineHeight:1.7 }}>
                  "{result.score.feedback}"
                </div>
              </div>
            </Card>
          )}

          <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"2rem 2.5rem", marginBottom:"1rem", boxShadow:"var(--shadow-sm)" }}>
            <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:"1.5rem", letterSpacing:"0.06em", textTransform:"uppercase" }}>
              {t.yourSeed} · {STYLE_PROFILES[profile].icon} {STYLE_PROFILES[profile].label}
            </div>
            <p style={{ fontFamily:FONTS.body, fontSize:15, lineHeight:1.9, color:"var(--text-muted)", margin:"0 0 1.5rem", paddingBottom:"1.5rem", borderBottom:"1px solid var(--border-soft)", fontStyle:"italic" }}>
              {seed}
            </p>
            <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:"1.2rem", letterSpacing:"0.06em", textTransform:"uppercase" }}>{t.continuation}</div>
            <div style={{ fontFamily:FONTS.body, fontSize:15.5, lineHeight:2, color:"var(--text)", whiteSpace:"pre-wrap" }}>{result.text}</div>
          </div>

          <ReadabilityPanel text={result.text} t={t}/>
          <SentenceHeatmap text={result.text} t={t}/>
          <TonePanel
            texts={[...samples.map(s => s.text), result.text]}
            labels={[...samples.map(s => s.title), t.continuation]}
            t={t}
          />
          <StructurePanel text={result.text} label={t.continuation} t={t}/>
          <StyleDriftPanel samplesText={samplesText} continuationText={result.text} t={t}/>
          <OriginalityCheck text={result.text} samples={samples} t={t}/>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:"1rem", marginBottom:"1rem" }}>
            <Btn onClick={() => navigator.clipboard.writeText(seed + "\n\n" + result.text)} variant="ghost" style={{ justifyContent:"center" }}>{t.copyText}</Btn>
            <ExportPDF seed={seed} continuation={result.text} score={result.score} profile={profile} t={t}/>
            <Btn onClick={() => { setResult(null); setSeed(""); setTab("write"); }} variant="ghost" style={{ justifyContent:"center" }}>{t.newPiece}</Btn>
          </div>

          <SaveSession seed={seed} continuation={result.text} score={result.score} samples={samples} profile={profile} onSaved={() => setTab("sessions")} t={t}/>

          <div style={{ marginTop:"1rem", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", overflow:"hidden" }}>
            <button onClick={() => setFeedbackOpen(v => !v)} style={{ width:"100%", padding:"12px 16px", background:"none", border:"none", cursor:"pointer", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center", fontFamily:FONTS.ui, fontSize:13, color:"var(--text-muted)" }}>
              <span>{t.reflectionPrompts}</span>
              <span style={{ transform:feedbackOpen?"rotate(180deg)":"rotate(0)", transition:"transform 0.2s", fontSize:10 }}>▼</span>
            </button>
            {feedbackOpen && (
              <div style={{ padding:"0 16px 16px", display:"flex", flexDirection:"column", gap:8 }}>
                {REFLECTION_PROMPTS.map((q, i) => (
                  <div key={i} style={{ padding:"10px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", fontSize:13, color:"var(--text)", fontFamily:FONTS.body, fontStyle:"italic", lineHeight:1.6 }}>{q}</div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop:"1rem", padding:"12px 16px", background:"var(--green-bg)", border:"1px solid #a8d8b8", borderRadius:"var(--radius-md)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:13, color:"var(--green)" }}>{t.addToProfileMsg}</span>
            <Btn onClick={() => { setSamples(prev => [...prev, { title:`Generated ${new Date().toLocaleDateString()}`, text:seed+"\n\n"+result.text }]); setTab("samples"); }}
              variant="primary" style={{ background:"var(--green)", whiteSpace:"nowrap" }}>
              {t.addToProfile}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
