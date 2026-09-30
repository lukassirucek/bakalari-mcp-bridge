import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { BakalariClient, errorResult, jsonResult } from "../api.js"

function clean(value: string | null | undefined): string {
    return (value ?? "").trim()
}

function formatMark(mark: any) {
    const maxBodu = mark.MaxPoints ?? 0
    const body = parseFloat(mark.MarkText)

    return {
        id: mark.Id,
        datum_znamky: mark.MarkDate?.split("T")[0] ?? null,
        datum_editace: mark.EditDate?.split("T")[0] ?? null,
        nazev: clean(mark.Caption),
        tema: clean(mark.Theme),
        znamka_text: clean(mark.MarkText),
        typ: mark.Type,
        typ_poznamka: clean(mark.TypeNote),
        vaha: mark.Weight,
        je_nova: mark.IsNew ?? false,
        je_bodova: mark.IsPoints ?? false,
        vypocitana_znamka: clean(mark.CalculatedMarkText),
        poradi_ve_tride: mark.ClassRankText ?? null,
        body_text: clean(mark.PointsText),
        max_bodu: maxBodu,
        procento: mark.IsPoints && maxBodu > 0 && !isNaN(body)
            ? Math.round(body / maxBodu * 10000) / 100
            : null
    }
}

export default function registerMarksTool(
    server: McpServer,
    client: BakalariClient
) {
    server.registerTool(
        "get_marks",
        {
            description: "Získá všechny známky studenta z Bakalářů, organizované podle předmětů, včetně průměrů.",
            inputSchema: {}
        },
        async () => {
            try {
                const data = await client.request("/api/3/marks")

                const predmety = (data.Subjects ?? []).map((subject: any) => ({
                    predmet: {
                        id: subject.Subject?.Id,
                        nazev: subject.Subject?.Name,
                        zkratka: clean(subject.Subject?.Abbrev)
                    },
                    prumer: clean(subject.AverageText),
                    docasna_znamka: clean(subject.TemporaryMark),
                    poznamka_k_predmetu: clean(subject.SubjectNote),
                    poznamka_k_docasne_znamce: clean(subject.TemporaryMarkNote),
                    pouze_body: subject.PointsOnly ?? false,
                    //nejnovejsi znamky prvni
                    znamky: (subject.Marks ?? []).map(formatMark)
                        .sort((a: any, b: any) => (b.datum_znamky ?? "").localeCompare(a.datum_znamky ?? ""))
                }))

                predmety.sort((a: any, b: any) => (a.predmet.nazev ?? "").localeCompare(b.predmet.nazev ?? "", "cs"))

                const vsechnyZnamky = predmety.flatMap((p: any) => p.znamky)

                return jsonResult({
                    predmety,
                    souhrn: {
                        celkem_predmetu: predmety.length,
                        celkem_znamek: vsechnyZnamky.length,
                        nove_znamky: vsechnyZnamky.filter((z: any) => z.je_nova).length,
                        predmety_s_docasnou_znamkou: predmety.filter((p: any) => p.docasna_znamka).length
                    }
                })
            } catch (error: any) {
                return errorResult(error)
            }
        }
    )
}
