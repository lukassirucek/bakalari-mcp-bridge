# Bakaláři MCP pro LLM Modely

### **⚠️ Tento projekt je stále ve vývoji a nové nástroje stále přibívají.**

Jednoduché MCP pro propojení Bakalářů s LLM modely nebo např. Claude for Desktop. Používá [Bakaláři API v3](https://github.com/bakalari-api/bakalari-api-v3/).

## Co je potřeba

- **Node.js** verze 18 nebo novější
- **npm** (defalutně v node.js)
- Funkční účet na Bakalářích

## Jak nastavit

### 1. Stáhněte repo

Stáhněte si repo pomocí tlačítka "Code" -> "Download ZIP" nebo pomocí GITu:
```bash
git clone https://github.com/kredencos/bakalari-mcp.git
```

### 2. Stáhněte balíčky

Pro stáhnutí všech balíčku stačí zadat příkaz:
```bash
npm install
```

### 3. Nastavte .env

Stačí přepsat název souboru `.env.example` na `.env` a upravte hodnoty. Příklad:
```env
BAKALARI_USERNAME=PepaZDepa
BAKALARI_PASS=pepik
SCHOOL_URL=https://pepova-skola.bakalari.cz
```

**Důležité:** `SCHOOL_URL` NESMÍ nikdy končit lomítkem! Program tak nebude fungovat.
```env
SCHOOL_URL=https://pepova-skola.bakalari.cz/ #<-- to lomitko na konci tam nesmí být
```

### 4. Build projektu

Stačí zadat tento příkaz pro sestavení:
```bash
npm run build
```

### 4. Zapněte server

Pro zapnutí serveru stačí zadat příkaz:

```bash
npm run start
```

## Jak to funguje

1. **Příhlášení:** Program získá pomocí `/api/login` access token vašeho účtu který se ukládá do dočasné paměti a po vypnutí serveru zmizí.
2. **Registrace:** Program registruje všechny nástroje u clienta aby je mohl LLM model používat.
3. **Získání dat po vyžádání LLM:** Program použije daný API endpoint pro daný nástroj a získá z něj data. U téměř všech nástrojů je potřeba access token získaný u prvniho korku.

## Jak použít

### Jak MCP používat s Claude for Desktop
Brzy...

### Jak MCP používat s LM Studio
Brzy...

## Nástroje MVP

### `get_homeworks`

Získá všechny domácí úkoly případně úkoly od data do data.

**Volitelné parametry:**
- `from` - od kdy YYYY-MM-DD formát (např., "2025-01-01")
- `to` - do kdy YYYY-MM-DD formát (např., "2025-12-31")

### `get_all_events`

Získá úplně všechny akce školy.

**Volitelné parametry:**
- `from` - od kdy YYYY-MM-DD formát (např., "2025-01-01")

### `get_user_events`

Získá pouze akce školy pro aktualního uživatele.

**Volitelné parametry:**
- `from` - od kdy YYYY-MM-DD formát (např., "2025-01-01")

## Řešení problémů

**"SCHOOL_URL, BAKALARI_USERNAME nebo BAKALARI_PASS chybí v .env souboru"**
- Zkontrolujte že jste opravdu vyplnily `.env` a je vytvořen.

**"Přihlášení selhalo"**
- Zkontrolujte že jsou všechny údaje v `.env` správné.
- Zkontrolujte že SCHOOL_URL v `.env` nekončí lomítkem.

**TypeScript errory**
- Spusťte `npm install` pro jistotu kdyby chyběli některé baličky.
- Ujistěte se že používate správnou verzi node.js (v18 nebo vyšší) pomocí příkazu `node`.

## Nahlášení probémů

Pro nahlášení problému můžete použít [Issues](https://github.com/kredencos/bakalari-mcp/issues) záložku na GitHub.

## Licence

Projekt je pod MIT licencí.
