import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { BakalariClient, errorResult, jsonResult } from "../api.js"

export default function registerEventsTool(
    server: McpServer,
    client: BakalariClient
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
                const data = await client.request("/api/3/events", {
                    query: { from: args?.from }
                })
                return jsonResult(data)
            } catch (error: any) {
                return errorResult(error)
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
                const data = await client.request("/api/3/events/my", {
                    query: { from: args?.from }
                })
                return jsonResult(data)
            } catch (error: any) {
                return errorResult(error)
            }
        }
    )
}
