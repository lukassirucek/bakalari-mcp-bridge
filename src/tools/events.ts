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
            description: "Get all events from Bakaláři system.",
            inputSchema: {
                from: z.string().optional().describe("From date (YYYY-MM-dd)"),
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
            description: "Get events only for this user from Bakaláři system.",
            inputSchema: {
                from: z.string().optional().describe("From date (YYYY-MM-dd)"),
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