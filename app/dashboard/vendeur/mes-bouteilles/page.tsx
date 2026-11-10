import { eq } from "drizzle-orm"
import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/db"
import { pointDeVente, brand, pointDeVenteBouteille } from "@/db/schema"
import { VendorLayout } from "@/app/_components/vendor-layout"
import { requirePro } from "@/lib/session"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Store, MapPin, Plus, Package } from "lucide-react"

export const metadata: Metadata = {
  title: { absolute: "Mes bouteilles | GazPoints" },
}

export default async function MesBouteillesPage() {
  const { user, role } = await requirePro()

  if (role !== "vendor") {
    return <div>Accès réservé aux vendeurs.</div>
  }

  // Points de vente du vendeur connecté uniquement (isolation entre vendeurs).
  const points = await db
    .select({
      id: pointDeVente.id,
      name: pointDeVente.name,
    })
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, user.id))
    .orderBy(pointDeVente.name)

  const pointIds = points.map((point) => point.id)

  // Bouteilles de CHAQUE point du vendeur, avec la quantité réelle en stock.
  const bottleRows =
    pointIds.length > 0
      ? await db
          .select({
            id: pointDeVenteBouteille.id,
            pointDeVenteId: pointDeVenteBouteille.pointDeVenteId,
            format: pointDeVenteBouteille.format,
            quantity: pointDeVenteBouteille.quantity,
            brand: brand.name,
          })
          .from(pointDeVenteBouteille)
          .innerJoin(brand, eq(pointDeVenteBouteille.brandId, brand.id))
          .orderBy(brand.name, pointDeVenteBouteille.format)
      : []

  const bottlesByPoint = new Map<
    string,
    Array<{ id: string; brand: string; format: string; quantity: number }>
  >()
  for (const row of bottleRows) {
    const list = bottlesByPoint.get(row.pointDeVenteId) ?? []
    list.push({
      id: row.id,
      brand: row.brand,
      format: row.format,
      quantity: row.quantity,
    })
    bottlesByPoint.set(row.pointDeVenteId, list)
  }

  const pointsWithBottles = points.map((point) => ({
    pointId: point.id,
    pointName: point.name,
    bottles: bottlesByPoint.get(point.id) ?? [],
  }))

  // Totaux scopeés au vendeur : nombre de références et quantité totale
  // réellement présente dans ses dépôts.
  const totalReferences = bottleRows.length
  const totalQuantity = bottleRows.reduce(
    (sumQty, row) => sumQty + (row.quantity ?? 0),
    0
  )

  return (
    <VendorLayout
      role={role}
      vendorName={user.name ?? "Vendeur"}
      vendorEmail={user.email}
    >
      <div className="p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mes bouteilles</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Marques et grammages présents dans vos dépôts, avec la quantité
              réelle en stock.
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-primary">
              <span>
                Références enregistrées : {totalReferences}
              </span>
              <span>
                Quantité totale en stock : {totalQuantity} bouteille
                {totalQuantity > 1 ? "s" : ""}
              </span>
            </p>
          </div>
          <Link href="/dashboard/vendeur">
            <Button type="button" variant="default">
              <Package className="size-4" /> Gérer mon inventaire
            </Button>
          </Link>
        </div>

        {pointsWithBottles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Store className="size-5" />
              </span>
              <p className="font-medium">Aucun point de vente enregistré</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Finalisez votre point de vente pour commencer à gérer vos
                bouteilles.
              </p>
              <Link href="/dashboard/vendeur">
                <Button type="button" variant="default">
                  <Plus className="size-4" /> Finaliser mon point de vente
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          pointsWithBottles.map((point, pointIndex) => {
            const pointQuantity = point.bottles.reduce(
              (sumQty, bottle) => sumQty + bottle.quantity,
              0
            )
            return (
              <Card
                key={point.pointId}
                className="mb-4 hover:shadow-sm transition-shadow"
              >
                <CardHeader className="flex flex-wrap items-start justify-between gap-2 pb-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Store className="size-4 text-primary" aria-hidden />
                      {point.pointName}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
                      {pointsWithBottles.length > 1
                        ? `Point de vente ${pointIndex + 1}`
                        : "Votre dépôt"}
                    </CardDescription>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>
                      {point.bottles.length} référence
                      {point.bottles.length !== 1 ? "s" : ""}
                    </p>
                    <p className="font-medium text-primary">
                      {pointQuantity} bouteille{pointQuantity > 1 ? "s" : ""}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {point.bottles.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <p>Aucune bouteille enregistrée pour le moment</p>
                      <Link href="/dashboard/vendeur">
                        <Button type="button" variant="default" size="sm" className="mt-3">
                          <Plus className="size-4" /> Ajouter des bouteilles
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {point.bottles.map((bottle) => (
                        <div
                          key={bottle.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 p-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium text-primary">
                                {bottle.brand}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                —
                              </span>
                              <span className="font-mono">{bottle.format}</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {bottle.quantity} en stock
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </VendorLayout>
  )
}
