import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { BakalariClient, errorResult, jsonResult } from "../api.js"

export default function registerHomeworksTool(
    server: McpServer,
    client: BakalariClient
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
                const data = await client.request("/api/3/homeworks", {
                    query: { from: args?.from, to: args?.to }
                })
                return jsonResult(data)
            } catch (error: any) {
                return errorResult(error)
            }
        }
    )
}
