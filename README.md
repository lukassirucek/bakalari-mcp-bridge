# Bakaláři MCP Bridge

Propojí školní systém **Bakaláři** s **Claude Desktop** (a volitelně s Claude Code). Claude se pak umí zeptat na rozvrh, známky, absenci, domácí úkoly, akce školy nebo zprávy z Komens, třeba:

- „Jaký mám zítra rozvrh? Odpadá něco?“
- „Jaké známky přibyly tento týden?“
- „Mám nepřečtené zprávy od paní učitelky?“

Používá neoficiální [Bakaláři API v3](https://github.com/bakalari-api/bakalari-api-v3). Všechny nástroje data jen čtou: nic neodesílají, nemažou ani neoznačují zprávy jako přečtené.

## Instalace

**Potřebujete:** [Node.js](https://nodejs.org) 18 nebo novější (verze LTS), [git](https://git-scm.com), [Claude Desktop](https://claude.ai/download) a přihlašovací údaje do Bakalářů (žákovské nebo rodičovské).

### macOS / Linux

Otevřete Terminál a spusťte:

```bash
curl -fsSL https://raw.githubusercontent.com/lukassirucek/bakalari-mcp-bridge/main/install.sh | bash
```

### Windows

Otevřete PowerShell a spusťte:

```powershell
irm https://raw.githubusercontent.com/lukassirucek/bakalari-mcp-bridge/main/install.ps1 | iex
```

Skripty si můžete před spuštěním prohlédnout: [`install.sh`](install.sh), [`install.ps1`](install.ps1).

### Co instalátor udělá

1. Zkontroluje, že máte git a Node.js 18+.
2. Stáhne projekt do `~/.bakalari-mcp-bridge` (Windows: `%LOCALAPPDATA%\bakalari-mcp-bridge`). Jinou složku nastavíte proměnnou `BAKALARI_MCP_DIR`.
3. Nainstaluje balíčky a projekt sestaví.
4. Spustí průvodce nastavením, který:
   - se zeptá na adresu Bakalářů vaší školy. Stačí doména (`skola.bakalari.cz`) nebo adresa zkopírovaná z prohlížeče. Průvodce sám najde, kde API běží (např. `/bakaweb`).
   - se zeptá na jméno a heslo a ověří, že přihlášení funguje.
   - uloží údaje do souboru `.env` ve složce projektu (na macOS a Linuxu čitelný jen pro vás).
   - zapíše server `bakalari` do konfigurace Claude Desktop (předtím vytvoří zálohu) a pokud máte Claude Code, nabídne registraci i tam.

Nakonec **úplně ukončete Claude Desktop** (macOS: ⌘Q, Windows: pravým tlačítkem na ikonu v oznamovací oblasti → Quit) a znovu ho spusťte. V nabídce nástrojů se objeví server `bakalari`.

### Aktualizace, změna údajů, odinstalace

| Co | Jak |
|---|---|
| Aktualizovat na novou verzi | Spusťte instalační příkaz znovu |
| Změnit školu, jméno nebo heslo | Ve složce projektu: `npm run setup` |
| Odinstalovat | Ve složce projektu: `npm run setup -- --uninstall`, pak složku smažte |

## Bezpečnost a soukromí

- Heslo je uložené jen ve vašem počítači v souboru `.env` ve složce projektu. Do konfigurace Claude Desktop se nezapisuje a server ho posílá výhradně na server Bakalářů vaší školy.
- Data z Bakalářů (známky, zprávy, …) dostane Claude až ve chvíli, kdy se na ně v konverzaci zeptáte.

## Nástroje

| Nástroj | Popis | Volitelné parametry |
|---|---|---|
| `get_timetable` | Aktuální rozvrh na daný den včetně změn, suplování a zrušených hodin | `date` (YYYY-MM-DD, výchozí dnešek) |
| `get_permanent_timetable` | Stálý rozvrh bez změn | – |
| `get_marks` | Známky podle předmětů, průměry a souhrn (např. počet nových známek) | – |
| `get_absence` | Absence podle dní a předmětů, procento absence a porovnání s prahem školy | – |
| `get_homeworks` | Domácí úkoly | `from`, `to` (YYYY-MM-DD) |
| `get_all_events` | Všechny akce školy | `from` (YYYY-MM-DD) |
| `get_user_events` | Akce školy týkající se přihlášeného uživatele | `from` (YYYY-MM-DD) |
| `get_received_messages` | Přijaté zprávy Komens od nejnovějších, text převedený z HTML | `unread_only`, `limit` |

## Ruční instalace

```bash
git clone https://github.com/lukassirucek/bakalari-mcp-bridge.git
cd bakalari-mcp-bridge
npm ci
npm run build
npm run setup
```

Bez průvodce: zkopírujte `.env.example` do `.env`, vyplňte hodnoty a do konfigurace Claude Desktop přidejte:

```json
{
  "mcpServers": {
    "bakalari": {
      "command": "node",
      "args": ["/cesta/k/bakalari-mcp-bridge/build/index.js"]
    }
  }
}
```

Konfigurace je na macOS v `~/Library/Application Support/Claude/claude_desktop_config.json`, na Windows v `%APPDATA%\Claude\claude_desktop_config.json`. Pokud Claude Desktop nenajde `node`, uveďte plnou cestu (`which node` nebo `where node`).

## Řešení problémů

**Server se v Claude Desktop neobjevil.** Ukončili jste Claude Desktop úplně, ne jen zavřeli okno? Pak se podívejte do logu:
- macOS: `~/Library/Logs/Claude/mcp-server-bakalari.log`
- Windows: `%APPDATA%\Claude\logs\mcp-server-bakalari.log`

**„Přihlášení selhalo: … nevrátil JSON“.** U některých škol API neběží přímo na doméně, ale např. na `https://skola.bakalari.cz/bakaweb`. Spusťte `npm run setup`, průvodce správnou adresu najde sám.

**„Přihlášení selhalo: Špatný login nebo heslo“.** Ověřte si údaje přihlášením na webu Bakalářů a pak spusťte `npm run setup`.

**Instalace hlásí starý Node.js.** Nainstalujte aktuální verzi LTS z [nodejs.org](https://nodejs.org) a spusťte instalaci znovu.

Další problémy hlaste v [Issues](https://github.com/lukassirucek/bakalari-mcp-bridge/issues).

## Poděkování

- [kredencos/bakalari-mcp](https://github.com/kredencos/bakalari-mcp): původní TypeScript MCP server, ze kterého tento projekt vychází (MIT)
- [mirecekd/bakalari-mcp](https://github.com/mirecekd/bakalari-mcp): nástroje pro rozvrh, absenci a známky převzaté z jeho Python verze (MIT)
- [bakalari-api/bakalari-api-v3](https://github.com/bakalari-api/bakalari-api-v3): komunitní dokumentace API Bakalářů

Projekt není nijak spojen se společností BAKALÁŘI software s.r.o.

## Licence

[MIT](LICENSE)
