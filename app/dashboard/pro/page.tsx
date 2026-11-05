import { asc, desc, eq, inArray } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { disponibilite, pointDeVente, user as userTable } from "@/db/schema"
import { EspacePro } from "@/app/_components/espace-pro"
import { requirePro } from "@/lib/session"
import { Menu, X } from "lucide-react"
import { useState } from "react"

export const metadata: Metadata = {
  title: { absolute: "Espace professionnel | GazPoints" },
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

  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    >
      {/* Bouton de contrôle de sidebar - position en haut à gauche, sous la navigation */}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="md:hidden flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors size-10"
          aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {sidebarOpen ? (
            <X className="size-5" />
          ) : (
            <Menu className="size-5" />
          )}
        </button>
        <span className="text-sm text-muted-foreground">{sidebarOpen ? "Sidebar fermée" : "Sidebar ouverte"}</span>
      </div>
    </EspacePro>
  )
}
