// StyleMirror CLI — Rust
// Offline text analysis: readability, vocabulary, sentence heatmap
// Build: cargo build --release
// Usage: stylemirror-cli analyze <file.txt>
//        stylemirror-cli compare <file1.txt> <file2.txt>

use std::{
    collections::HashMap,
    env,
    fs,
    path::Path,
};

// ── Syllable counting (heuristic) ────────────────────────────────────────────
fn count_syllables(word: &str) -> usize {
    let w = word.to_lowercase();
    let w = w.trim_matches(|c: char| !c.is_alphabetic());
    if w.len() <= 3 { return 1; }

    let vowels: Vec<char> = vec!['a','e','i','o','u'];
    let chars: Vec<char>  = w.chars().collect();
    let mut count = 0usize;
    let mut prev_vowel = false;

    for &ch in &chars {
        let is_v = vowels.contains(&ch);
        if is_v && !prev_vowel { count += 1; }
        prev_vowel = is_v;
    }

    // silent-e rule
    if w.ends_with('e') && count > 1 { count -= 1; }
    count.max(1)
}

// ── Tokenisation ─────────────────────────────────────────────────────────────
fn tokenise(text: &str) -> Vec<String> {
    text.split_whitespace()
        .map(|w| w.chars().filter(|c| c.is_alphabetic()).collect::<String>().to_lowercase())
        .filter(|w| !w.is_empty())
        .collect()
}

fn sentences(text: &str) -> Vec<String> {
    text.split(|c| c == '.' || c == '!' || c == '?')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

// ── Readability ───────────────────────────────────────────────────────────────
fn flesch(text: &str) -> (f64, f64, &'static str) {
    let words   = tokenise(text);
    let sents   = sentences(text);
    if words.is_empty() || sents.is_empty() { return (0.0, 0.0, "N/A"); }

    let total_syllables: usize = words.iter().map(|w| count_syllables(w)).sum();
    let asl = words.len() as f64 / sents.len() as f64;
    let asw = total_syllables as f64 / words.len() as f64;

    let score = (206.835 - 1.015 * asl - 84.6 * asw).clamp(0.0, 100.0);
    let grade = (0.39 * asl + 11.8 * asw - 15.59).max(0.0);

    let level = match score as u32 {
        90..=100 => "Very Easy",
        80..=89  => "Easy",
        70..=79  => "Fairly Easy",
        60..=69  => "Standard",
        50..=59  => "Fairly Difficult",
        30..=49  => "Difficult",
        _        => "Very Confusing",
    };
    (score, grade, level)
}

// ── Vocabulary fingerprint ────────────────────────────────────────────────────
fn vocab_stats(text: &str) -> (f64, Vec<(String, usize)>, f64) {
    let words  = tokenise(text);
    if words.is_empty() { return (0.0, vec![], 0.0); }

    let stopwords: std::collections::HashSet<&str> = [
        "the","a","an","and","or","but","in","on","at","to","for","of",
        "with","by","is","was","are","were","be","been","have","has","had",
        "do","does","did","will","would","could","should","that","this","it",
        "he","she","they","we","you","i","me","him","her","us","them",
    ].iter().cloned().collect();

    let sample: Vec<_> = words.iter().take(400).cloned().collect();
    let unique_sample: std::collections::HashSet<_> = sample.iter().cloned().collect();
    let ttr = unique_sample.len() as f64 / sample.len() as f64;

    let avg_len = words.iter().map(|w| w.len()).sum::<usize>() as f64 / words.len() as f64;

    let mut freq: HashMap<String, usize> = HashMap::new();
    for w in &words {
        if !stopwords.contains(w.as_str()) && w.len() > 3 {
            *freq.entry(w.clone()).or_insert(0) += 1;
        }
    }

    let mut top: Vec<(String, usize)> = freq.into_iter().collect();
    top.sort_by(|a, b| b.1.cmp(&a.1));
    top.truncate(10);

    (ttr, top, avg_len)
}

// ── 4-gram Jaccard similarity ─────────────────────────────────────────────────
fn jaccard_4gram(a: &str, b: &str) -> f64 {
    fn ngrams(text: &str) -> std::collections::HashSet<Vec<String>> {
        let words = tokenise(text);
        words.windows(4).map(|w| w.to_vec()).collect()
    }
    let ga = ngrams(a);
    let gb = ngrams(b);
    if ga.is_empty() || gb.is_empty() { return 0.0; }
    let inter = ga.intersection(&gb).count();
    let union = ga.union(&gb).count();
    inter as f64 / union as f64
}

// ── Sentence length heatmap (ASCII) ──────────────────────────────────────────
fn sentence_heatmap(text: &str) {
    let sents = sentences(text);
    if sents.is_empty() { println!("  (no sentences found)"); return; }

    let lengths: Vec<usize> = sents.iter()
        .map(|s| tokenise(s).len())
        .collect();
    let max_len = *lengths.iter().max().unwrap_or(&1);

    println!("\n  Sentence length heatmap (each row = one sentence):");
    println!("  {}", "─".repeat(52));
    for (i, &len) in lengths.iter().enumerate() {
        let bar_w = (len * 48 / max_len).max(1);
        let bar: String = if len > 30 { "█".repeat(bar_w) }
                          else if len > 15 { "▓".repeat(bar_w) }
                          else { "░".repeat(bar_w) };
        println!("  {:>3} │{:<48}│ {:>3}w", i+1, bar, len);
    }
    println!("  {}", "─".repeat(52));
    println!("      legend: ░ short (≤15)  ▓ medium (16–30)  █ long (30+)\n");
}

// ── Commands ──────────────────────────────────────────────────────────────────
fn cmd_analyze(path: &str) {
    let text = fs::read_to_string(path)
        .unwrap_or_else(|e| { eprintln!("Error reading {path}: {e}"); std::process::exit(1); });

    println!("\n  ╔══════════════════════════════════════╗");
    println!("  ║  StyleMirror CLI — Text Analysis     ║");
    println!("  ╚══════════════════════════════════════╝");
    println!("  File: {path}\n");

    let (fk_score, grade, level) = flesch(&text);
    println!("  ── Readability ─────────────────────────");
    println!("  Flesch score : {:.1} / 100", fk_score);
    println!("  Grade level  : {:.1}", grade);
    println!("  Difficulty   : {}", level);

    let words = tokenise(&text);
    let sents = sentences(&text);
    println!("\n  ── Statistics ──────────────────────────");
    println!("  Words        : {}", words.len());
    println!("  Sentences    : {}", sents.len());
    println!("  Avg sent len : {:.1} words",
        if sents.is_empty() { 0.0 } else { words.len() as f64 / sents.len() as f64 });

    let (ttr, top_words, avg_len) = vocab_stats(&text);
    println!("\n  ── Vocabulary ──────────────────────────");
    println!("  Type-token ratio : {:.3}", ttr);
    println!("  Avg word length  : {:.2} chars", avg_len);
    println!("  Top content words:");
    for (word, count) in &top_words {
        println!("    {:>20}  ×{}", word, count);
    }

    sentence_heatmap(&text);
}

fn cmd_compare(path_a: &str, path_b: &str) {
    let a = fs::read_to_string(path_a)
        .unwrap_or_else(|e| { eprintln!("Error: {e}"); std::process::exit(1); });
    let b = fs::read_to_string(path_b)
        .unwrap_or_else(|e| { eprintln!("Error: {e}"); std::process::exit(1); });

    let sim = jaccard_4gram(&a, &b);
    let pct = (sim * 100.0).round() as u32;

    println!("\n  ╔══════════════════════════════════════╗");
    println!("  ║  StyleMirror CLI — Similarity Check  ║");
    println!("  ╚══════════════════════════════════════╝");
    println!("  A: {path_a}");
    println!("  B: {path_b}\n");
    println!("  4-gram Jaccard similarity: {:.3} ({pct}%)", sim);

    let verdict = match pct {
        0..=15  => "✓ Highly original",
        16..=35 => "~ Moderate overlap (expected for same author)",
        36..=60 => "⚠ Significant overlap — review recommended",
        _       => "✗ High overlap — possible self-plagiarism",
    };
    println!("  Verdict: {verdict}\n");
}

fn print_usage() {
    println!("\n  Usage:");
    println!("    stylemirror-cli analyze <file.txt>");
    println!("    stylemirror-cli compare <file1.txt> <file2.txt>\n");
}

fn main() {
    let args: Vec<String> = env::args().collect();
    match args.get(1).map(|s| s.as_str()) {
        Some("analyze") => {
            let path = args.get(2).map(|s| s.as_str()).unwrap_or_else(|| {
                eprintln!("Missing file path"); std::process::exit(1);
            });
            cmd_analyze(path);
        }
        Some("compare") => {
            let a = args.get(2).map(|s| s.as_str()).unwrap_or_else(|| {
                eprintln!("Missing file path A"); std::process::exit(1);
            });
            let b = args.get(3).map(|s| s.as_str()).unwrap_or_else(|| {
                eprintln!("Missing file path B"); std::process::exit(1);
            });
            cmd_compare(a, b);
        }
        _ => print_usage(),
    }
}
