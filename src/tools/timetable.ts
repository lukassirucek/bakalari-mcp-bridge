import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { BakalariClient, errorResult, jsonResult } from "../api.js"

function lookup(items: any[] | undefined): Map<any, any> {
    return new Map((items ?? []).map(item => [item.Id, item]))
}

function time(hour: any): string | null {
    return hour?.BeginTime && hour?.EndTime ? `${hour.BeginTime} - ${hour.EndTime}` : null
}

//prelozi Id z atomu rozvrhu na nazvy predmetu, ucitelu, mistnosti a skupin
function formatAtoms(atoms: any[], data: any) {
    const hours = lookup(data.Hours)
    const subjects = lookup(data.Subjects)
    const teachers = lookup(data.Teachers)
    const rooms = lookup(data.Rooms)
    const groups = lookup(data.Groups)

    return [...atoms]
        .sort((a, b) => (a.HourId ?? 0) - (b.HourId ?? 0))
        .map(atom => {
            const hour = hours.get(atom.HourId)
            const subject = subjects.get(atom.SubjectId)
            const teacher = teachers.get(atom.TeacherId)
            const group = groups.get(atom.GroupIds?.[0])

            return {
                hodina: hour?.Caption ?? String(atom.HourId),
                cas: time(hour),
                predmet: subject?.Name ?? null,
                zkratka_predmetu: subject?.Abbrev ?? null,
                ucitel: teacher?.Name || teacher?.Abbrev || null,
                ucitel_zkratka: teacher?.Abbrev ?? null,
                mistnost: rooms.get(atom.RoomId)?.Abbrev ?? null,
                skupina: group?.Abbrev ?? null,
                tema: atom.Theme || null,
                zmena: atom.Change ? {
                    typ: atom.Change.ChangeType,
                    popis: atom.Change.Description
                } : null
            }
        })
}

function today(): string {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export default function registerTimetableTool(
    server: McpServer,
    client: BakalariClient
) {
    server.registerTool(
        "get_timetable",
        {
            description: "Získá aktuální rozvrh (včetně změn a suplování) pro zadaný den z Bakalářů.",
            inputSchema: {
                date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Datum (YYYY-MM-DD), výchozí je dnešek")
            }
        },
        async (args) => {
            try {
                const date = args?.date ?? today()
                const data = await client.request("/api/3/timetable/actual", {
                    query: { date }
                })

                const day = (data.Days ?? []).find((d: any) => d.Date?.startsWith(date))
                const hodiny = day ? formatAtoms(day.Atoms ?? [], data) : []

                return jsonResult({
                    datum: date,
                    typ_dne: day?.DayType ?? null,
                    popis_dne: day?.DayDescription || null,
                    hodiny,
                    pocet_hodin: hodiny.length
                })
            } catch (error: any) {
                return errorResult(error)
            }
        }
    )

    server.registerTool(
        "get_permanent_timetable",
        {
            description: "Získá stálý rozvrh (základní rozvrh bez změn) z Bakalářů.",
            inputSchema: {}
        },
        async () => {
            try {
                const data = await client.request("/api/3/timetable/permanent")

                const dny = (data.Days ?? []).map((day: any) => ({
                    den_tydne: day.DayOfWeek,
                    hodiny: formatAtoms(day.Atoms ?? [], data)
                }))

                return jsonResult({ dny })
            } catch (error: any) {
                return errorResult(error)
            }
        }
    )
}
