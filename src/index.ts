#!/usr/bin/env node
import dotenv from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import registerHomeworksTool from "./tools/homeworks.js"
import registerEventsTool from "./tools/events.js"
import registerTimetableTool from "./tools/timetable.js"
import registerAbsenceTool from "./tools/absence.js"
import registerMarksTool from "./tools/marks.js"
import registerKomensTool from "./tools/komens.js"
import { BakalariClient } from "./api.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ 
	path: resolve(__dirname, "../.env"),
	quiet: true 
})

//main func
async function main() {
	//check env
	const schoolUrl = process.env.SCHOOL_URL
	const username = process.env.BAKALARI_USERNAME
	const password = process.env.BAKALARI_PASS

	if (!schoolUrl || !username || !password) {
		throw new Error("SCHOOL_URL, BAKALARI_USERNAME nebo BAKALARI_PASS chybí v .env souboru")
	}

	console.error("Přihlašování...")
	const client = new BakalariClient(schoolUrl, username, password)
	await client.login()
	console.error("✓ Přihlášeno!")

	// create server
	const server = new McpServer({
		name: "bakalari-mcp",
		version: "1.0.0",
	}, {
		capabilities: {
			resources: {},
			tools: {},
		},
	})

	registerHomeworksTool(server, client)
	registerEventsTool(server, client)
	registerTimetableTool(server, client)
	registerAbsenceTool(server, client)
	registerMarksTool(server, client)
	registerKomensTool(server, client)

	const transport = new StdioServerTransport()
	await server.connect(transport)
	console.error("✓ Server je ready!")
}

main().catch(error => {
	console.error("Error:", error.message)
	process.exit(1)
})
