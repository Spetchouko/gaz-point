import { asc, desc, eq, inArray } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { disponibilite, favori, pointDeVente } from "@/db/schema"
import { MesFavoris } from "@/app/_components/mes-favoris"
import { ClientLayout } from "@/app/_components/client-layout"
import { requireUser } from "@/lib/session"
import { RefreshCw } from "lucide-react"

export const metadata: Metadata = {
  title: { absolute: "Mes favoris | GazPoints" },
}

type ReportRow = typeof disponibilite.$inferSelect

export default async function FavorisPage() {
  const user = await requireUser()
  const role = (user as { role?: string | null }).role ?? "client"

  if (role === "admin" || role === "collaborateur") {
    return <div>Accès réservé aux clients.</div>
  }

  let favRows: typeof favori.$inferSelect[] = []
  let allPoints: typeof pointDeVente.$inferSelect[] = []

  try {
    const result = await Promise.all([
      db.select().from(favori).where(eq(favori.userId, user.id)),
      db.select().from(pointDeVente).orderBy(asc(pointDeVente.name)),
    ])
    favRows = result[0]
    allPoints = result[1]
  } catch (error) {
    console.error("[FavorisPage] Erreur de chargement:", error)
    return (
      <ClientLayout
        clientName={user.name ?? "Usager"}
        clientEmail={user.email}
      >
        <div className="min-h-screen flex flex-col items-center justify-center py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">
              Erreur de chargement
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Impossible de charger tes favoris. Vérifie ta connexion et réessaie.
            </p>
            <button
              onClick={() => {
                window.location.reload()
              }}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90"
            >
              <RefreshCw className="size-4" /> Recharger la page
            </button>
          </div>
        </div>
      </ClientLayout>
    )
  }

  const favIds = new Set(favRows.map((row) => row.pointId))

  const reportByPoint = new Map<string, ReportRow>()
  if (allPoints.length > 0) {
    const reports = await db
      .select()
      .from(disponibilite)
      .where(inArray(disponibilite.pointId, allPoints.map((p) => p.id)))
      .orderBy(desc(disponibilite.createdAt))
    for (const report of reports) {
      if (!reportByPoint.has(report.pointId)) {
        reportByPoint.set(report.pointId, report)
      }
    }
  }

  return (
    <ClientLayout
      clientName={user.name ?? "Usager"}
      clientEmail={user.email}
    >
      <MesFavoris
        pro={false}
        points={allPoints.map((point) => ({
          id: point.id,
          name: point.name,
          district: point.district,
          address: point.address,
          phone: point.phone,
          isFavorite: favIds.has(point.id),
          report: reportByPoint.get(point.id) ?? null,
        }))}
      />
    </ClientLayout>
  )
}
