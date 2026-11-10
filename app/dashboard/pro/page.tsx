import { asc, desc, eq, inArray } from "drizzle-orm"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { disponibilite, pointDeVente } from "@/db/schema"
import { EspacePro } from "@/app/_components/espace-pro"
import { requirePro } from "@/lib/session"

export const metadata: Metadata = {
  title: { absolute: "Espace professionnel | GazPoints" },
}

type ReportRow = typeof disponibilite.$inferSelect

export default async function EspaceProPage() {
  const { user, role } = await requirePro()

  // Interdire l'accès aux administrateurs : rediriger vers le dashboard admin
  if (role === "admin" || role === "collaborateur") {
    redirect("/admin")
  }

  // Dans ce bloc, role est obligatoirement "vendor"
  // Subscription check removed: vendors can access their dashboard without active subscription
  // The subscription system is preserved for future integration

  const points = await db
    .select()
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, user.id))
    .orderBy(asc(pointDeVente.name))

  const vendors: { id: string; name: string; email: string }[] = []

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
