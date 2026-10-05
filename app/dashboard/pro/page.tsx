import { asc, desc, eq, inArray } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { disponibilite, pointDeVente, user as userTable } from "@/db/schema"
import { EspacePro } from "@/app/_components/espace-pro"
import { requirePro } from "@/lib/session"

export const metadata: Metadata = {
  title: { absolute: "Espace professionnel | GazPoint" },
}

type ReportRow = typeof disponibilite.$inferSelect

export default async function EspaceProPage() {
  const { user, role } = await requirePro()

  const points =
    role === "admin"
      ? await db.select().from(pointDeVente).orderBy(asc(pointDeVente.name))
      : await db
          .select()
          .from(pointDeVente)
          .where(eq(pointDeVente.vendorId, user.id))
          .orderBy(asc(pointDeVente.name))

  const vendors =
    role === "admin"
      ? await db
          .select({
            id: userTable.id,
            name: userTable.name,
            email: userTable.email,
          })
          .from(userTable)
          .where(eq(userTable.role, "vendor"))
          .orderBy(asc(userTable.name))
      : []

  const reportByPoint = new Map<string, ReportRow>()
  if (points.length > 0) {
    const reports = await db
      .select()
      .from(disponibilite)
      .where(inArray(disponibilite.pointId, points.map((p) => p.id)))
      .orderBy(desc(disponibilite.createdAt))
    for (const report of reports) {
      if (!reportByPoint.has(report.pointId)) {
        reportByPoint.set(report.pointId, report)
      }
    }
  }

  const vendorNames = new Map(vendors.map((v) => [v.id, v.name]))

  return (
    <EspacePro
      role={role}
      reporterName={user.name}
      points={points.map((point) => ({
        id: point.id,
        name: point.name,
        district: point.district,
        address: point.address,
        phone: point.phone,
        vendorId: point.vendorId,
        vendorName: point.vendorId
          ? (vendorNames.get(point.vendorId) ?? null)
          : null,
        report: reportByPoint.get(point.id) ?? null,
      }))}
      vendors={vendors}
    />
  )
}
