import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import fetch from "node-fetch"
import { z } from "zod"

export default function registerHomeworksTool(
    server: McpServer,
    accessToken: string,
    baseUrl: string
) {
    server.registerTool(
        "get_homeworks",
        {
            description: "Získá domací úkoly z Bakalářů.",
            inputSchema: {
                from: z.string().optional().describe("Od data (YYYY-MM-DD)"),
                to: z.string().optional().describe("Do data (YYYY-MM-DD)")
            }
        },
        async (args) => {
            try {
                let url = `${baseUrl}/api/3/homeworks`
                
                if (args?.from || args?.to) {
                    const params = new URLSearchParams()
                    if (args.from) params.set("from", args.from as string)
                    if (args.to) params.set("to", args.to as string)
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
