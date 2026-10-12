#!/usr/bin/env node
//pruvodce nastavenim: prihlasovaci udaje do .env + registrace v Claude Desktop a Claude Code
//pouziti: node scripts/setup.mjs [--uninstall]
import { existsSync, readFileSync, writeFileSync, copyFileSync, chmodSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import readline from "node:readline"

const SERVER_NAME = "bakalari"
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const ENV_PATH = join(ROOT, ".env")
const ENTRY = join(ROOT, "build", "index.js")
const isWindows = process.platform === "win32"

//preferujeme node z PATH - process.execPath muze byt verzovana cesta (napr. Homebrew Cellar), ktera po aktualizaci Node zmizi
function findNode() {
	if (process.env.NODE_BIN) return process.env.NODE_BIN
	const result = spawnSync(isWindows ? "where" : "which", ["node"], { encoding: "utf8" })
	const found = result.status === 0 ? result.stdout.split(/\r?\n/)[0].trim() : ""
	return found || process.execPath
}

const NODE_BIN = findNode()

// ---------- vstup z terminalu ----------

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
let muted = false
rl._writeToOutput = (text) => { if (!muted) rl.output.write(text) }

function ask(question, { hidden = false, fallback = "" } = {}) {
	return new Promise(done => {
		rl.question(question, answer => {
			if (hidden) {
				muted = false
				rl.output.write("\n")
			}
			done(answer.trim() || fallback)
		})
		if (hidden) muted = true
	})
}

async function confirm(question, defaultYes = true) {
	const answer = (await ask(`${question} ${defaultYes ? "[A/n]" : "[a/N]"} `)).toLowerCase()
	if (!answer) return defaultYes
	return answer.startsWith("a") || answer.startsWith("y")
}

// ---------- Bakalari ----------

//vestaveny fetch posila "Accept-Language: *", na ktery Bakalari (ASP.NET) odpovida chybou 500
const HEADERS = { "Accept": "application/json", "Accept-Language": "cs-CZ" }

//uzivatel muze vlozit i adresu z prohlizece (napr. .../bakaweb/next/prehled.aspx) - zkusime nekolik variant
function urlCandidates(input) {
	let value = input.trim()
	if (!/^https?:\/\//i.test(value)) value = `https://${value}`
	const url = new URL(value)
	const path = url.pathname
		.replace(/\/(next|login|dashboard)(\/.*)?$/i, "")
		.replace(/\/[^/]*\.aspx$/i, "")
		.replace(/\/+$/, "")
	return [...new Set([url.origin + path, url.origin, `${url.origin}/bakaweb`, `${url.origin}/bakalari`])]
}

async function detectApi(input) {
	for (const candidate of urlCandidates(input)) {
		try {
			const response = await fetch(`${candidate}/api`, { headers: HEADERS, signal: AbortSignal.timeout(10000) })
			if (!response.ok) continue
			const info = await response.json()
			if (Array.isArray(info) && info[0]?.ApiVersion) {
				return { url: candidate, version: info[0].ApiVersion }
			}
		} catch {
			//neni JSON nebo se nepripojilo - zkusime dalsi variantu
		}
	}
	return null
}

async function testLogin(url, username, password) {
	const response = await fetch(`${url}/api/login`, {
		method: "POST",
		headers: { ...HEADERS, "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({ client_id: "ANDR", grant_type: "password", username, password }),
		signal: AbortSignal.timeout(15000)
	})
	const data = await response.json().catch(() => ({}))
	if (!response.ok || !data.access_token) {
		throw new Error(data.error_description || data.error || `HTTP ${response.status}`)
	}
}

// ---------- .env ----------

function readEnv() {
	if (!existsSync(ENV_PATH)) return {}
	const env = {}
	for (const line of readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
		const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/)
		if (!match) continue
		let value = match[2].trim()
		const quote = value[0]
		if ((quote === "'" || quote === "\"" || quote === "`") && value.endsWith(quote) && value.length > 1) {
			value = value.slice(1, -1)
		} else {
			value = value.replace(/\s+#.*$/, "")
		}
		env[match[1]] = value
	}
	return env
}

//dotenv bere hodnotu v uvozovkach doslova - vybereme typ uvozovek, ktery v hodnote neni
function quoteEnv(value) {
	for (const quote of ["'", "\"", "`"]) {
		if (!value.includes(quote) && !value.includes("\n")) return `${quote}${value}${quote}`
	}
	throw new Error("Hodnota obsahuje všechny typy uvozovek, nelze ji uložit do .env")
}

function writeEnv({ url, username, password }) {
	const content = [
		"# Vytvořeno pomocí npm run setup - soubor obsahuje heslo, nikomu ho neposílejte",
		`SCHOOL_URL=${quoteEnv(url)}`,
		`BAKALARI_USERNAME=${quoteEnv(username)}`,
		`BAKALARI_PASS=${quoteEnv(password)}`,
		""
	].join("\n")
	writeFileSync(ENV_PATH, content, { mode: 0o600 })
	if (!isWindows) chmodSync(ENV_PATH, 0o600)
}

async function configureCredentials() {
	const current = readEnv()
	if (current.SCHOOL_URL && current.BAKALARI_USERNAME && current.BAKALARI_PASS) {
		console.log(`\nNalezeno existující nastavení pro ${current.SCHOOL_URL} (uživatel ${current.BAKALARI_USERNAME}).`)
		if (await confirm("Ponechat stávající přihlašovací údaje?")) return
	}

	console.log("\nAdresu najdete v prohlížeči na přihlašovací stránce Bakalářů, např. https://skola.bakalari.cz")

	let api = null
	while (!api) {
		const input = await ask("Adresa Bakalářů vaší školy: ")
		if (!input) continue
		try {
			process.stdout.write("Hledám API Bakalářů... ")
			api = await detectApi(input)
		} catch {
			api = null
		}
		if (api) {
			console.log(`nalezeno ${api.url} (API ${api.version})`)
		} else {
			console.log("nenalezeno. Zkontrolujte adresu a zkuste to znovu.")
		}
	}

	while (true) {
		const username = await ask("Uživatelské jméno: ")
		const password = await ask("Heslo (při psaní se nezobrazuje): ", { hidden: true })
		if (!username || !password) continue

		process.stdout.write("Ověřuji přihlášení... ")
		try {
			await testLogin(api.url, username, password)
			console.log("✓ v pořádku")
			writeEnv({ url: api.url, username, password })
			console.log(`Přihlašovací údaje uloženy do ${ENV_PATH}`)
			return
		} catch (error) {
			console.log(`selhalo (${error.message})`)
			if (!await confirm("Zkusit znovu?")) throw new Error("Přihlášení se nepodařilo ověřit, nastavení nebylo uloženo.")
		}
	}
}

// ---------- Claude Desktop ----------

function claudeDesktopConfigPath() {
	if (process.platform === "darwin") return join(homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json")
	if (isWindows) return join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "Claude", "claude_desktop_config.json")
	return join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "Claude", "claude_desktop_config.json")
}

//upravi konfiguraci Claude Desktop - pred zmenou udela zalohu, nevalidni JSON nikdy neprepisuje
function updateClaudeDesktop(change) {
	const path = claudeDesktopConfigPath()
	let config = {}
	if (existsSync(path)) {
		try {
			config = JSON.parse(readFileSync(path, "utf8"))
		} catch {
			console.log(`! ${path} není platný JSON, nechávám ho beze změny.`)
			return null
		}
		const backup = `${path}.backup-${new Date().toISOString().replace(/[:.]/g, "-")}`
		copyFileSync(path, backup)
		console.log(`Záloha konfigurace: ${backup}`)
	} else {
		mkdirSync(dirname(path), { recursive: true })
	}
	if (!change(config)) return path
	writeFileSync(path, JSON.stringify(config, null, 2) + "\n")
	return path
}

function registerClaudeDesktop() {
	const path = updateClaudeDesktop(config => {
		config.mcpServers ??= {}
		config.mcpServers[SERVER_NAME] = { command: NODE_BIN, args: [ENTRY] }
		return true
	})
	if (path) console.log(`✓ Claude Desktop: server "${SERVER_NAME}" zapsán do ${path}`)
	return Boolean(path)
}

function unregisterClaudeDesktop() {
	if (!existsSync(claudeDesktopConfigPath())) return
	const path = updateClaudeDesktop(config => {
		if (!config.mcpServers?.[SERVER_NAME]) return false
		delete config.mcpServers[SERVER_NAME]
		return true
	})
	if (path) console.log(`✓ Claude Desktop: server "${SERVER_NAME}" odebrán`)
}

// ---------- Claude Code ----------

function claude(args) {
	//na Windows je claude .cmd skript - spoustime pres shell, cesty proto obalime uvozovkami
	const finalArgs = isWindows ? args.map(arg => /\s/.test(arg) ? `"${arg}"` : arg) : args
	return spawnSync("claude", finalArgs, { encoding: "utf8", shell: isWindows })
}

function hasClaudeCode() {
	const result = claude(["--version"])
	return !result.error && result.status === 0
}

function registerClaudeCode() {
	claude(["mcp", "remove", SERVER_NAME, "--scope", "user"])
	const result = claude(["mcp", "add", "--scope", "user", SERVER_NAME, "--", NODE_BIN, ENTRY])
	if (result.status === 0) {
		console.log(`✓ Claude Code: server "${SERVER_NAME}" přidán (scope user)`)
	} else {
		console.log(`! Claude Code: registrace selhala: ${(result.stderr || result.stdout || "").trim()}`)
	}
}

// ---------- main ----------

async function install() {
	console.log("=== Nastavení Bakaláři MCP ===")

	if (!existsSync(ENTRY)) {
		throw new Error(`Chybí ${ENTRY}. Nejdřív spusťte "npm run build".`)
	}

	await configureCredentials()

	console.log("")
	if (await confirm("Zaregistrovat server do Claude Desktop?")) registerClaudeDesktop()

	if (hasClaudeCode()) {
		if (await confirm("Nalezen Claude Code. Zaregistrovat server i tam?")) registerClaudeCode()
	}

	console.log(`
Hotovo! Další kroky:
  1. Úplně ukončete Claude Desktop (${isWindows ? "pravým tlačítkem na ikonu v oznamovací oblasti → Quit" : "⌘Q"}) a znovu ho spusťte.
  2. Zeptejte se třeba: "Jaký mám dnes rozvrh?" nebo "Mám nepřečtené zprávy v Komens?"

Změna přihlašovacích údajů:  npm run setup   (ve složce ${ROOT})`)
}

async function uninstall() {
	console.log("=== Odebrání Bakaláři MCP ===")
	unregisterClaudeDesktop()
	if (hasClaudeCode()) {
		const result = claude(["mcp", "remove", SERVER_NAME, "--scope", "user"])
		if (result.status === 0) console.log(`✓ Claude Code: server "${SERVER_NAME}" odebrán`)
	}
	console.log(`\nRegistrace odebrány. Pro úplné odstranění smažte složku ${ROOT} (obsahuje i .env s heslem).`)
}

try {
	if (process.argv.includes("--uninstall")) await uninstall()
	else await install()
} catch (error) {
	console.error(`\nChyba: ${error.message}`)
	process.exitCode = 1
} finally {
	rl.close()
}
