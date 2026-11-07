import { asc, desc, eq, inArray } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { disponibilite, favori, pointDeVente } from "@/db/schema"
import { MesFavoris } from "@/app/_components/mes-favoris"
import { ClientLayout } from "@/app/_components/client-layout"
import { requireUser } from "@/lib/session"

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

  const [favRows, allPoints] = await Promise.all([
    db.select().from(favori).where(eq(favori.userId, user.id)),
    db.select().from(pointDeVente).orderBy(asc(pointDeVente.name)),
  ])

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
