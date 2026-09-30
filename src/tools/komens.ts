import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { BakalariClient, errorResult, jsonResult } from "../api.js"

const ENTITIES: Record<string, string> = {
    nbsp: " ", amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'"
}

//text komens zprav prichazi jako HTML - prevedeme na prosty text
function htmlToText(html: string | null | undefined): string {
    return (html ?? "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
        .replace(/<li[^>]*>/gi, "- ")
        .replace(/<[^>]+>/g, "")
        .replace(/&(#x?[0-9a-f]+|\w+);/gi, (match, entity: string) => {
            if (entity[0] === "#") {
                const code = entity[1].toLowerCase() === "x"
                    ? parseInt(entity.slice(2), 16)
                    : parseInt(entity.slice(1), 10)
                return isNaN(code) ? match : String.fromCodePoint(code)
            }
            return ENTITIES[entity.toLowerCase()] ?? match
        })
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
}

export default function registerKomensTool(
    server: McpServer,
    client: BakalariClient
) {
    server.registerTool(
        "get_received_messages",
        {
            description: "Získá přijaté zprávy (Komens) z Bakalářů, od nejnovějších. Zprávy nijak neoznačuje jako přečtené.",
            inputSchema: {
                unread_only: z.boolean().optional().describe("Vrátit pouze nepřečtené zprávy"),
                limit: z.number().int().positive().optional().describe("Maximální počet vrácených zpráv (nejnovější)")
            }
        },
        async (args) => {
            try {
                //seznamy komens se nacitaji pres POST
                const data = await client.request("/api/3/komens/messages/received", {
                    method: "POST"
                })

                let messages = [...(data?.Messages ?? [])]
                    .sort((a: any, b: any) => (b.SentDate ?? "").localeCompare(a.SentDate ?? ""))

                if (args?.unread_only) messages = messages.filter((m: any) => !m.Read)
                if (args?.limit) messages = messages.slice(0, args.limit)

                return jsonResult({
                    pocet: messages.length,
                    zpravy: messages.map((m: any) => ({
                        id: m.Id,
                        nazev: m.Title,
                        text: htmlToText(m.Text),
                        datum_odeslani: m.SentDate,
                        odesilatel: m.Sender?.Name ?? null,
                        typ_odesilatele: m.Sender?.Type ?? null,
                        typ: m.Type,
                        precteno: m.Read,
                        potvrzeno: m.Confirmed,
                        lze_potvrdit: m.CanConfirm,
                        platnost_od: m.DateFrom,
                        platnost_do: m.DateTo,
                        prilohy: m.Attachments ?? []
                    }))
                })
            } catch (error: any) {
                return errorResult(error)
            }
        }
    )
}
