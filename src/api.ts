import fetch from "node-fetch"

type Query = Record<string, string | undefined>

//bakalari api client - drzi access token a pri vyprseni se znovu prihlasi
export class BakalariClient {
	private accessToken: string | null = null
	readonly baseUrl: string

	constructor(
		baseUrl: string,
		private username: string,
		private password: string
	) {
		this.baseUrl = baseUrl.replace(/\/+$/, "")
	}

	async login() {
		const formData = new URLSearchParams({
			client_id: "ANDR",
			grant_type: "password",
			username: this.username.trim(),
			password: this.password.trim()
		})

		const response = await fetch(`${this.baseUrl}/api/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: formData
		})

		const text = await response.text()
		let data: any
		try {
			data = JSON.parse(text)
		} catch {
			//nekde API nebezi na korenu domeny, ale treba na /bakaweb
			throw new Error(`Přihlášení selhalo: ${this.baseUrl}/api/login nevrátil JSON. Zkontrolujte SCHOOL_URL (např. https://skola.bakalari.cz/bakaweb) nebo spusťte "npm run setup".`)
		}

		if (!response.ok) {
			const errorMsg = data.error_description || data.error || "neznamá chyba"
			throw new Error(`Přihlášení selhalo: ${errorMsg}`)
		}

		this.accessToken = data.access_token
	}

	async request(path: string, options: { method?: string, query?: Query } = {}): Promise<any> {
		let url = `${this.baseUrl}${path}`

		const params = new URLSearchParams()
		for (const [key, value] of Object.entries(options.query ?? {})) {
			if (value) params.set(key, value)
		}
		const queryString = params.toString()
		if (queryString) url += `?${queryString}`

		if (!this.accessToken) await this.login()

		const send = () => fetch(url, {
			method: options.method ?? "GET",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Authorization": `Bearer ${this.accessToken}`
			}
		})

		let response = await send()

		//token vyprsel (plati cca hodinu) - prihlasime se znovu a zkusime to jeste jednou
		if (response.status === 401) {
			await this.login()
			response = await send()
		}

		const text = await response.text()

		if (!response.ok) {
			throw new Error(`API chyba ${response.status}: ${text}`)
		}

		return text ? JSON.parse(text) : null
	}
}

export function jsonResult(data: unknown) {
	return {
		content: [{
			type: "text" as const,
			text: JSON.stringify(data, null, 2)
		}]
	}
}

export function errorResult(error: any) {
	return {
		content: [{
			type: "text" as const,
			text: `Chyba: ${error.message}`
		}],
		isError: true
	}
}
