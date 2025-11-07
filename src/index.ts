import dotenv from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import fetch from "node-fetch"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import registerHomeworksTool from "./tools/homeworks.js"
import registerEventsTool from "./tools/events.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ 
	path: resolve(__dirname, "../.env"),
	quiet: true 
})

//bakalari login
async function login(url: string, username: string, password: string) {
	const cleanUrl = url.replace(/\/+$/, "")
	
	const formData = new URLSearchParams({
		client_id: "ANDR",
		grant_type: "password",
		username: username.trim(),
		password: password.trim()
	})

	const response = await fetch(`${cleanUrl}/api/login`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: formData
	})

	const data: any = await response.json()

	if (!response.ok) {
		const errorMsg = data.error_description || data.error || "neznamá chyba"
		throw new Error(`Přihlášení selhalo: ${errorMsg}`)
	}

	return data.access_token
}

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
	const accessToken = await login(schoolUrl, username, password)
	console.error("✓ Přihlášeno!")

	// create server
	const server = new McpServer({
		name: "bakalari-mcp",
		version: "1.0.0",
		capabilities: {
			resources: {},
			tools: {},
		},
	})

	registerHomeworksTool(server, accessToken, schoolUrl)
	registerEventsTool(server, accessToken, schoolUrl)

	const transport = new StdioServerTransport()
	await server.connect(transport)
	console.error("✓ Server je ready!")
}

main().catch(error => {
	console.error("Error:", error.message)
	process.exit(1)
})
