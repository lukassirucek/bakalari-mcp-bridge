# Instalace Bakaláři MCP pro Windows (PowerShell)
#   irm https://raw.githubusercontent.com/lukassirucek/bakalari-mcp-bridge/main/install.ps1 | iex
# Opakované spuštění projekt aktualizuje. Cílovou složku lze změnit proměnnou $env:BAKALARI_MCP_DIR.
$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/lukassirucek/bakalari-mcp-bridge.git"
$InstallDir = if ($env:BAKALARI_MCP_DIR) { $env:BAKALARI_MCP_DIR } else { Join-Path $env:LOCALAPPDATA "bakalari-mcp-bridge" }
$MinNodeMajor = 18

function Fail($message) {
	throw $message
}

function Step($message) {
	Write-Host "`n==> $message" -ForegroundColor Cyan
}

# nativni prikazy pri chybe nevyhazuji vyjimku - kontrolujeme navratovy kod
function Invoke-Checked($description, [scriptblock]$command) {
	& $command
	if ($LASTEXITCODE -ne 0) { Fail "$description selhalo (kód $LASTEXITCODE)." }
}

function Install-BakalariMcp {
	Step "Kontrola požadavků"
	if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
		Fail "Chybí git. Stáhněte ho z https://git-scm.com/download/win nebo spusťte: winget install Git.Git"
	}
	if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
		Fail "Chybí Node.js $MinNodeMajor+. Stáhněte ho z https://nodejs.org (verze LTS) nebo spusťte: winget install OpenJS.NodeJS.LTS"
	}
	$nodeMajor = [int](node -p "process.versions.node.split('.')[0]")
	if ($nodeMajor -lt $MinNodeMajor) {
		Fail "Node.js $(node -v) je příliš starý, potřebujete verzi $MinNodeMajor nebo novější: https://nodejs.org"
	}
	Write-Host "$(git --version), Node.js $(node -v)"

	# spusteno primo z naklonovaneho repozitare (.\install.ps1) -> instalujeme na miste
	$scriptDir = if ($PSCommandPath) { Split-Path -Parent $PSCommandPath } else { $null }
	if ($scriptDir -and (Test-Path (Join-Path $scriptDir "scripts\setup.mjs"))) {
		$script:InstallDir = $scriptDir
		Step "Používám stávající složku $InstallDir"
	} elseif (Test-Path (Join-Path $InstallDir ".git")) {
		Step "Aktualizace v $InstallDir"
		Invoke-Checked "Aktualizace (máte ve složce vlastní změny?)" { git -C $InstallDir pull --ff-only }
	} elseif (Test-Path $InstallDir) {
		Fail "$InstallDir už existuje, ale není to git repozitář. Smažte ho nebo nastavte jinou složku přes `$env:BAKALARI_MCP_DIR."
	} else {
		Step "Stahování do $InstallDir"
		Invoke-Checked "Stahování" { git clone --depth 1 $RepoUrl $InstallDir }
	}

	Push-Location $InstallDir
	try {
		# npm.cmd misto npm - npm.ps1 muze byt blokovany politikou spousteni skriptu
		Step "Instalace balíčků"
		Invoke-Checked "Instalace balíčků" { npm.cmd ci --no-audit --no-fund }

		Step "Sestavení"
		Invoke-Checked "Sestavení" { npm.cmd run build --silent }

		Step "Nastavení"
		Invoke-Checked "Nastavení" { node scripts/setup.mjs }
	} finally {
		Pop-Location
	}
}

# funkce misto skriptu na nejvyssi urovni - chyba pri "irm | iex" pak nezavre okno PowerShellu
try {
	Install-BakalariMcp
} catch {
	Write-Host "`nChyba: $($_.Exception.Message)" -ForegroundColor Red
	Write-Host "Instalace nebyla dokončena." -ForegroundColor Yellow
}
