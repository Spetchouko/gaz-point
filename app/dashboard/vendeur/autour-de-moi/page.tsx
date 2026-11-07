import { asc, desc, eq, inArray } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { disponibilite, pointDeVente } from "@/db/schema"
import { VendorLayout } from "@/app/_components/vendor-layout"
import { requirePro } from "@/lib/session"
import {
  availabilityBadgeClass,
  availabilityLabel,
  effectiveStatus,
  formatDateTime,
  isStale,
  sourceLabel,
} from "@/lib/gaz"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Signal } from "lucide-react"

type ReportRow = typeof disponibilite.$inferSelect

export const metadata: Metadata = {
  title: { absolute: "Points de livraison autour de moi | GazPoints" },
}

type PointAvecDispo = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  report: ReportRow | null
}

export default async function AutourDeMoiPage() {
  const { user, role } = await requirePro()

  if (role !== "vendor") {
    return <div>Accès réservé aux vendeurs.</div>
  }

  const allPoints = await db
    .select({
      id: pointDeVente.id,
      name: pointDeVente.name,
      district: pointDeVente.district,
      address: pointDeVente.address,
      phone: pointDeVente.phone,
    })
    .from(pointDeVente)
    .where(eq(pointDeVente.isActive, true))
    .orderBy(asc(pointDeVente.name))

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

  const points: PointAvecDispo[] = allPoints.map((p) => ({
    id: p.id,
    name: p.name,
    district: p.district,
    address: p.address,
    phone: p.phone,
    report: reportByPoint.get(p.id) ?? null,
  }))

  return (
    <VendorLayout
      role={role}
      vendorName={user.name ?? "Vendeur"}
      vendorEmail={user.email}
    >
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Points de livraison autour de moi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Découvrez les autres points de livraison de la plateforme et leurs
          disponibilités.
        </p>
      </div>

      {points.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <MapPin className="size-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">Aucun point de livraison pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {points.map((point) => {
            const report = point.report
            const status = report ? effectiveStatus(report.status, report.createdAt) : null
            const stale = report ? isStale(report.createdAt) : false

            return (
              <Card key={point.id} className="flex flex-col hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{point.name}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0" aria-hidden />
                        {point.district} — {point.address}
                      </CardDescription>
                    </div>
                    {status && (
                      <Badge
                        variant="outline"
                        className={availabilityBadgeClass[status]}
                      >
                        {availabilityLabel[status]}
                        {stale && " • à confirmer"}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-3 pt-0">
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    {report ? (
                      <>
                        <p className="flex items-start gap-1.5">
                          <Signal className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                          <span>
                            Mise à jour le {formatDateTime(report.createdAt)} par{" "}
                            {report.reportedByName}
                          </span>
                        </p>
                        {stale && (
                          <p className="text-xs text-warning">
                            Non actualisé depuis plus de 24 h : statut « à
                            confirmer ».
                          </p>
                        )}
                        {report.brand || report.format ? (
                          <p className="text-sm text-muted-foreground">
                            {report.brand} {report.format}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <p>Aucune disponibilité publiée pour ce dépôt.</p>
                    )}

                    {point.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="size-3.5 shrink-0" aria-hidden />
                        {point.phone}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </VendorLayout>
  )
}
