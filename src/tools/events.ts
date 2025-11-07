import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import fetch from "node-fetch"
import { z } from "zod"

export default function registerEventsTool(
    server: McpServer,
    accessToken: string,
    baseUrl: string
) {
    server.registerTool(
        "get_all_events",
        {
            description: "Ziská všechny akce školy z bakalařů.",
            inputSchema: {
                from: z.string().optional().describe("Od data (YYYY-MM-dd)"),
            }
        },
        async (args) => {
            try {
                let url = `${baseUrl}/api/3/events`

                if (args?.from) {
                    const params = new URLSearchParams()
                    if (args.from) params.set("from", args.from as string)
                    url += `?${params}`
                }

                const response = await fetch(url, {
                    headers: { "Authorization": `Bearer ${accessToken}` }
                })

                const data = await response.json()

                return {
                    content: [{
                        type: "text" as const,
                        text: JSON.stringify(data, null, 2)
                    }]
                }
            } catch (error: any) {
                return {
                    content: [{
                        type: "text" as const,
                        text: `Chyba: ${error.message}`
                    }]
                }
            }
        }
    );

    server.registerTool(
        "get_user_events",
        {
            description: "Získá akce školy pouze pro tohoto uživatele z Bakalářů.",
            inputSchema: {
                from: z.string().optional().describe("Od data (YYYY-MM-dd)"),
            }
        },
        async (args) => {
            try {
                let url = `${baseUrl}/api/3/events/my`

                if (args?.from) {
                    const params = new URLSearchParams()
                    if (args.from) params.set("from", args.from as string)
                    url += `?${params}`
                }

                const response = await fetch(url, {
                    headers: { "Authorization": `Bearer ${accessToken}` }
                })

                const data = await response.json()

                return {
                    content: [{
                        type: "text" as const,
                        text: JSON.stringify(data, null, 2)
                    }]
                }
            } catch (error: any) {
                return {
                    content: [{
                        type: "text" as const,
                        text: `Chyba: ${error.message}`
                    }]
                }
            }
        }
    )
}