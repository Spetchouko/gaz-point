import { asc, desc, eq, inArray } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { disponibilite, pointDeVente } from "@/db/schema"
import { EspaceVendeur } from "@/app/_components/espace-vendeur"
import { requirePro } from "@/lib/session"

export const metadata: Metadata = {
  title: { absolute: "Espace professionnel | GazPoints" },
}

type DispoRow = typeof disponibilite.$inferSelect

export default async function EspaceVendeurPage() {
  const { user, role } = await requirePro()

  if (role !== "vendor") {
    return <div>Accès réservé aux vendeurs.</div>
  }

  const points = await db
    .select()
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, user.id))
    .orderBy(asc(pointDeVente.name))

  const dispoByPoint = new Map<string, DispoRow[]>()
  if (points.length > 0) {
    const reports = await db
      .select()
      .from(disponibilite)
      .where(inArray(disponibilite.pointId, points.map((p) => p.id)))
      .orderBy(desc(disponibilite.createdAt))
    for (const report of reports) {
      const existing = dispoByPoint.get(report.pointId) ?? []
      existing.push(report)
      dispoByPoint.set(report.pointId, existing)
    }
  }

  return (
    <EspaceVendeur
      vendorPhone={user.phoneNumber ?? null}
      points={points.map((point) => ({
        id: point.id,
        name: point.name,
        district: point.district,
        address: point.address,
        phone: point.phone,
        disponibilites: dispoByPoint.get(point.id) ?? [],
      }))}
    />
  )
}