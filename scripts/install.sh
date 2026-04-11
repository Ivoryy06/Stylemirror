#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════╗
# ║       StyleMirror v2.0 — Installer (flat layout)        ║
# ║   Node frontend · Python backend · Rust CLI (optional)  ║
# ╚══════════════════════════════════════════════════════════╝
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}  →  $*${RESET}"; }
success() { echo -e "${GREEN}  ✓  $*${RESET}"; }
warn()    { echo -e "${YELLOW}  ⚠  $*${RESET}"; }
error()   { echo -e "${RED}  ✗  $*${RESET}"; exit 1; }
header()  { echo -e "\n${BOLD}${CYAN}$*${RESET}\n"; }

require() { command -v "$1" &>/dev/null || error "$1 is required but not found."; }

echo -e "${BOLD}"
echo "  ┌──────────────────────────────────────┐"
echo "  │   StyleMirror v2.0 — Installer       │"
echo "  └──────────────────────────────────────┘"
echo -e "${RESET}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
info "Project root: $ROOT"

# ── 1. Prerequisites ──────────────────────────────────────────────
header "[ 1 / 4 ]  Checking prerequisites"
require node
require npm
require python3

NODE_MAJOR="$(node --version | tr -d 'v' | cut -d. -f1)"
[[ "$NODE_MAJOR" -lt 18 ]] && error "Node.js 18+ required (found $(node --version))"
success "Node $(node --version)  |  Python $(python3 --version | awk '{print $2}')"

# ── 2. Node / React frontend ──────────────────────────────────────
header "[ 2 / 4 ]  Installing frontend (npm)"
cd "$ROOT"
npm install --silent
success "npm packages installed"

# ── 3. Python backend ─────────────────────────────────────────────
header "[ 3 / 4 ]  Setting up Python backend"
cd "$ROOT"

if [[ ! -d venv ]]; then
    info "Creating Python virtual environment…"
    python3 -m venv venv
fi

# shellcheck disable=SC1091
source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet flask flask-cors fpdf2 nltk

info "Downloading NLTK stopwords…"
python3 -c "import nltk; nltk.download('stopwords', quiet=True)"

info "Initialising SQLite database…"
python3 -c "
import sys; sys.path.insert(0,'.')
from app import init_db; init_db()
print('  stylemirror.db ready')
"
deactivate
success "Python backend ready"

# ── 4. Rust CLI (optional) ────────────────────────────────────────
header "[ 4 / 4 ]  Rust CLI (optional)"
if command -v cargo &>/dev/null; then
    info "Building stylemirror-cli…"
    # main.rs lives in the same flat directory — create a temporary Cargo project
    TMP="$(mktemp -d)"
    mkdir -p "$TMP/src"
    cp "$ROOT/main.rs" "$TMP/src/main.rs"
    cat > "$TMP/Cargo.toml" <<'TOML'
[package]
name    = "stylemirror-cli"
version = "2.0.0"
edition = "2021"
[[bin]]
name = "stylemirror-cli"
path = "src/main.rs"
[profile.release]
opt-level = 3
strip     = true
TOML
    (cd "$TMP" && cargo build --release --quiet 2>&1 | tail -3)
    BIN="$TMP/target/release/stylemirror-cli"
    if [[ -d "$HOME/.local/bin" ]]; then
        cp "$BIN" "$HOME/.local/bin/stylemirror-cli"
        success "stylemirror-cli → ~/.local/bin/"
    else
        cp "$BIN" "$ROOT/stylemirror-cli"
        success "stylemirror-cli binary placed in project root"
    fi
    rm -rf "$TMP"
else
    warn "Rust/Cargo not found — skipping CLI build (install from https://rustup.rs)"
fi

# ── Done ──────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}  Done! Here's how to run:${RESET}"
echo ""
echo -e "  Terminal A — Python backend:"
echo -e "    ${CYAN}source venv/bin/activate && python app.py${RESET}"
echo ""
echo -e "  Terminal B — React frontend:"
echo -e "    ${CYAN}npm run dev${RESET}"
echo -e "    Open ${CYAN}http://localhost:5173${RESET}"
echo ""
echo -e "  CLI (if Rust was installed):"
echo -e "    ${CYAN}stylemirror-cli analyze myessay.txt${RESET}"
echo ""
