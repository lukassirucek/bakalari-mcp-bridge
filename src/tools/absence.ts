import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { BakalariClient, errorResult, jsonResult } from "../api.js"

const DAY_FIELDS = {
    nevyreseno: "Unsolved",
    ok: "Ok",
    zmeskano: "Missed",
    pozdni_prichod: "Late",
    brzy_odchod: "Soon",
    skolni_akce: "School",
    distancni_vyuka: "DistanceTeaching"
} as const

type DayStats = Record<keyof typeof DAY_FIELDS, number>

export default function registerAbsenceTool(
    server: McpServer,
    client: BakalariClient
) {
    server.registerTool(
        "get_absence",
        {
            description: "Získá absence studenta z Bakalářů - podle dní i podle předmětů, včetně procenta absence a souhrnu.",
            inputSchema: {}
        },
        async () => {
            try {
                const data = await client.request("/api/3/absence/student")
                const threshold = data.PercentageThreshold ?? 0

                const celkem = Object.fromEntries(Object.keys(DAY_FIELDS).map(key => [key, 0])) as DayStats
                const podleDni = []

                for (const day of data.Absences ?? []) {
                    const stats = Object.fromEntries(
                        Object.entries(DAY_FIELDS).map(([key, field]) => [key, day[field] ?? 0])
                    ) as DayStats
                    const celkemHodin = Object.values(stats).reduce((sum, n) => sum + n, 0)

                    if (celkemHodin === 0) continue

                    for (const key of Object.keys(stats) as (keyof DayStats)[]) {
                        celkem[key] += stats[key]
                    }
                    podleDni.push({
                        datum: day.Date?.split("T")[0] ?? null,
                        ...stats,
                        celkem_hodin: celkemHodin
                    })
                }

                //nejnovejsi dny prvni
                podleDni.sort((a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""))

                const podlePredmetu = (data.AbsencesPerSubject ?? []).map((subject: any) => {
                    const pocetHodin = subject.LessonsCount ?? 0
                    const zameskano = (subject.Base ?? 0) + (subject.Late ?? 0) + (subject.Soon ?? 0)
                    const procento = pocetHodin > 0 ? Math.round(zameskano / pocetHodin * 10000) / 100 : 0

                    return {
                        nazev_predmetu: subject.SubjectName,
                        pocet_hodin_celkem: pocetHodin,
                        zakladni_absence: subject.Base ?? 0,
                        pozdni_prichod: subject.Late ?? 0,
                        brzy_odchod: subject.Soon ?? 0,
                        skolni_akce: subject.School ?? 0,
                        distancni_vyuka: subject.DistanceTeaching ?? 0,
                        procento_absence: procento,
                        nad_prahem: procento > threshold * 100
                    }
                })

                //predmety s nejvyssi absenci prvni
                podlePredmetu.sort((a: any, b: any) => b.procento_absence - a.procento_absence)

                return jsonResult({
                    prah_procent: threshold * 100,
                    absence_podle_dni: podleDni,
                    absence_podle_predmetu: podlePredmetu,
                    souhrn: {
                        celkem_dni: (data.Absences ?? []).length,
                        dny_s_absenci: podleDni.length,
                        celkove_statistiky: celkem
                    }
                })
            } catch (error: any) {
                return errorResult(error)
            }
        }
    )
}
