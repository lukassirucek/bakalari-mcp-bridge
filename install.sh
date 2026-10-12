#!/usr/bin/env bash
# Instalace Bakaláři MCP pro macOS a Linux
#   curl -fsSL https://raw.githubusercontent.com/lukassirucek/bakalari-mcp-bridge/main/install.sh | bash
# Opakované spuštění projekt aktualizuje. Cílovou složku lze změnit proměnnou BAKALARI_MCP_DIR.
set -euo pipefail

REPO_URL="https://github.com/lukassirucek/bakalari-mcp-bridge.git"
INSTALL_DIR="${BAKALARI_MCP_DIR:-$HOME/.bakalari-mcp-bridge}"
MIN_NODE_MAJOR=18

fail() { printf '\nChyba: %s\n' "$1" >&2; exit 1; }
step() { printf '\n==> %s\n' "$1"; }

step "Kontrola požadavků"
command -v git >/dev/null 2>&1 || fail "Chybí git. Na macOS ho nainstalujete příkazem: xcode-select --install"
command -v node >/dev/null 2>&1 || fail "Chybí Node.js ${MIN_NODE_MAJOR}+. Stáhněte ho z https://nodejs.org (verze LTS)."
command -v npm >/dev/null 2>&1 || fail "Chybí npm (bývá součástí Node.js). Přeinstalujte Node.js z https://nodejs.org"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge "$MIN_NODE_MAJOR" ] || fail "Node.js $(node -v) je příliš starý, potřebujete verzi ${MIN_NODE_MAJOR} nebo novější: https://nodejs.org"
echo "git $(git --version | awk '{print $3}'), Node.js $(node -v)"

# spusteno primo z naklonovaneho repozitare (./install.sh) -> instalujeme na miste
SCRIPT_DIR=""
if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
	SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi
if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/scripts/setup.mjs" ]; then
	INSTALL_DIR="$SCRIPT_DIR"
	step "Používám stávající složku $INSTALL_DIR"
elif [ -d "$INSTALL_DIR/.git" ]; then
	step "Aktualizace v $INSTALL_DIR"
	git -C "$INSTALL_DIR" pull --ff-only || fail "Aktualizace selhala. Máte ve složce $INSTALL_DIR vlastní změny?"
elif [ -e "$INSTALL_DIR" ]; then
	fail "$INSTALL_DIR už existuje, ale není to git repozitář. Smažte ho nebo nastavte jinou složku přes BAKALARI_MCP_DIR."
else
	step "Stahování do $INSTALL_DIR"
	git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

step "Instalace balíčků"
npm ci --no-audit --no-fund

step "Sestavení"
npm run build --silent

step "Nastavení"
# pri "curl | bash" je stdin samotny skript - pruvodce musi cist z terminalu
if (exec < /dev/tty) 2>/dev/null; then
	node scripts/setup.mjs < /dev/tty
else
	echo "Není dostupný terminál pro zadání údajů. Dokončete nastavení příkazem:"
	echo "  cd \"$INSTALL_DIR\" && npm run setup"
fi
