#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║           StyleMirror v2.0 — Full-Stack Installer               ║
# ║   Installs: Node.js frontend · Python backend · Rust CLI        ║
# ╚══════════════════════════════════════════════════════════════════╝
set -euo pipefail

# ── colour helpers ────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}  →  $*${RESET}"; }
success() { echo -e "${GREEN}  ✓  $*${RESET}"; }
warn()    { echo -e "${YELLOW}  ⚠  $*${RESET}"; }
error()   { echo -e "${RED}  ✗  $*${RESET}"; exit 1; }
header()  { echo -e "\n${BOLD}${CYAN}$*${RESET}\n"; }

require() {
    command -v "$1" &>/dev/null || error "$1 is required but not found. Please install it first."
}

# ── banner ────────────────────────────────────────────────────────
echo -e "${BOLD}"
echo "  ┌─────────────────────────────────────────┐"
echo "  │   StyleMirror v2.0 — Installer          │"
echo "  │   your voice, continued                 │"
echo "  └─────────────────────────────────────────┘"
echo -e "${RESET}"

# ── detect OS ─────────────────────────────────────────────────────
OS="$(uname -s)"
info "Detected OS: $OS"

# ── check required tools ──────────────────────────────────────────
header "[ 1 / 5 ]  Checking prerequisites"
require node
require npm
require python3
require pip3

NODE_VER="$(node --version | tr -d 'v')"
PY_VER="$(python3 --version | awk '{print $2}')"
info "Node.js $NODE_VER  |  Python $PY_VER"

NODE_MAJOR="$(echo "$NODE_VER" | cut -d. -f1)"
if [[ "$NODE_MAJOR" -lt 18 ]]; then
    error "Node.js 18+ required (found $NODE_VER)"
fi
success "Prerequisites OK"

# ── resolve project root ──────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR"

# ── 2. Node / React frontend ──────────────────────────────────────
header "[ 2 / 5 ]  Installing frontend dependencies (npm)"
cd "$ROOT"

if [[ ! -f package.json ]]; then
    info "Scaffolding Vite + React project…"
    npm create vite@latest . -- --template react --yes 2>/dev/null || true
fi

npm install --silent
npm install --silent \
    @vitejs/plugin-react \
    react-router-dom \
    react-hot-toast

success "Frontend dependencies installed"

# ── 3. Python backend ─────────────────────────────────────────────
header "[ 3 / 5 ]  Setting up Python backend"
cd "$ROOT/server"

if [[ ! -d venv ]]; then
    info "Creating Python virtual environment…"
    python3 -m venv venv
fi

# shellcheck disable=SC1091
source venv/bin/activate

info "Installing Python packages…"
pip3 install --quiet --upgrade pip
pip3 install --quiet flask flask-cors fpdf2 nltk

info "Downloading NLTK stopwords…"
python3 -c "import nltk; nltk.download('stopwords', quiet=True)"

# ── initialise DB ─────────────────────────────────────────────────
info "Initialising SQLite database…"
python3 -c "
import sys; sys.path.insert(0, '.')
from app import init_db; init_db()
print('  Database ready at ../db/stylemirror.db')
"
deactivate
success "Python backend ready"

# ── 4. Rust CLI (optional) ────────────────────────────────────────
header "[ 4 / 5 ]  Building Rust CLI (optional)"
cd "$ROOT"

if command -v cargo &>/dev/null; then
    info "Rust toolchain found — building stylemirror-cli…"
    cd cli
    cargo build --release --quiet 2>&1 | tail -5
    BIN="./target/release/stylemirror-cli"

    # install to user bin if possible
    if [[ -d "$HOME/.local/bin" ]]; then
        cp "$BIN" "$HOME/.local/bin/stylemirror-cli"
        success "Installed stylemirror-cli → ~/.local/bin/stylemirror-cli"
    elif [[ -d "/usr/local/bin" ]] && [[ -w "/usr/local/bin" ]]; then
        cp "$BIN" "/usr/local/bin/stylemirror-cli"
        success "Installed stylemirror-cli → /usr/local/bin/stylemirror-cli"
    else
        warn "Could not install globally — binary at cli/target/release/stylemirror-cli"
    fi
    cd "$ROOT"
else
    warn "Rust/Cargo not found — skipping CLI build."
    warn "Install Rust: https://rustup.rs  then re-run this script."
fi

# ── 5. Environment file ────────────────────────────────────────────
header "[ 5 / 5 ]  Writing .env"
cd "$ROOT"

ENV_FILE=".env"
if [[ ! -f "$ENV_FILE" ]]; then
    cat > "$ENV_FILE" <<'ENVEOF'
# StyleMirror environment — DO NOT commit this file
VITE_API_BASE=http://localhost:8787
VITE_APP_NAME=StyleMirror
PORT=8787
ENVEOF
    success ".env created"
else
    info ".env already exists — skipping"
fi

# ── Done ──────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}  Installation complete!${RESET}"
echo ""
echo -e "  Start the backend:"
echo -e "    ${CYAN}cd server && source venv/bin/activate && python app.py${RESET}"
echo ""
echo -e "  Start the frontend (new terminal):"
echo -e "    ${CYAN}npm run dev${RESET}"
echo ""
echo -e "  CLI usage:"
echo -e "    ${CYAN}stylemirror-cli analyze myessay.txt${RESET}"
echo -e "    ${CYAN}stylemirror-cli compare essay1.txt essay2.txt${RESET}"
echo ""
