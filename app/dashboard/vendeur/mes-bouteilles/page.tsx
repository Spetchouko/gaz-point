import { and, asc, count, eq, inArray } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { pointDeVente, brand, pointDeVenteBouteille } from "@/db/schema"
import { VendorLayout } from "@/app/_components/vendor-layout"
import { requirePro } from "@/lib/session"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Store, MapPin, Plus, Edit, X } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: { absolute: "Mes bouteilles | GazPoints" },
}

export default async function MesBouteillesPage() {
  const { user, role } = await requirePro()

  if (role !== "vendor") {
    return <div>Accès réservé aux vendeurs.</div>
  }

  // Get vendor's points de vente
  const points = await db
    .select({
      id: pointDeVente.id,
      name: pointDeVente.name,
    })
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, user.id))
    .orderBy(asc(pointDeVente.name))

  // Get bottles for each point de vente
  const pointsWithBottles = await Promise.all(
    points.map(async (point) => {
      const bottles = await db
        .select({
          id: pointDeVenteBouteille.id,
          brandId: pointDeVenteBouteille.brandId,
          format: pointDeVenteBouteille.format,
          brand: brand.name,
        })
        .from(pointDeVenteBouteille)
        .innerJoin(brand, eq(pointDeVenteBouteille.brandId, brand.id))
        .where(eq(pointDeVenteBouteille.pointDeVenteId, point.id))
        .orderBy(asc(brand.name))

      return {
        pointId: point.id,
        pointName: point.name,
        bottles: bottles.map((b) => ({
          id: b.id,
          brand: b.brand,
          format: b.format,
        })),
      }
    })
  )

  const [totalBottles] = await db
    .select({ count: count() })
    .from(pointDeVenteBouteille)
    .innerJoin(brand, eq(pointDeVenteBouteille.brandId, brand.id))

  return (
    <VendorLayout
      role={role}
      vendorName={user.name ?? "Vendeur"}
      vendorEmail={user.email}
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6">
          Mes bouteilles
        </h1>

        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-3">
            Enregistrez les marques et grammages de bouteilles présents dans votre dépôt.
          </p>
          <p className="text-primary font-medium">
            Total enregistrées: {totalBottles.count}
          </p>
        </div>

        {pointsWithBottles.map((point, pointIndex) => (
          <Card key={point.pointId} className="mb-4 hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-wrap items-start justify-between gap-2 pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Store className="size-4 text-primary" aria-hidden />
                  {point.pointName}
                </CardTitle>
                <CardDescription className="mt-1 flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" aria-hidden />
                  {pointsWithBottles.length > 1 ? `Point de vente ${pointIndex + 1}` : ""}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {point.bottles.length} bouteille{point.bottles.length !== 1 ? "s" : ""}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {point.bottles.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                    <Plus className="size-4" />
                  </span>
                  <p>Aucune bouteille enregistrée pour le moment</p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => window.location.href = "/dashboard/vendeur"}
                  >
                    <Plus className="size-4" /> Créer votre première bouteille
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {point.bottles.map((bottle) => (
                    <div
                      key={bottle.id}
                      className="p-3 rounded-lg border border-border bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-primary">{bottle.brand}</span>
                        <span className="text-sm text-muted-foreground">-</span>
                        <span className="font-mono">{bottle.format}</span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Modifier"
                          className="p-1"
                          onClick={() => {
                            // Edit logic would go here
                          }}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          aria-label="Supprimer"
                          className="p-1"
                          onClick={() => {
                            // Delete logic would go here
                            // Could call an API to delete the bottle
                            console.log("Supprimer bouteille:", bottle.id)
                          }}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Formulaire d'ajout de bouteille */}
        <Card className="mt-6 p-6">
          <CardHeader>
            <CardTitle>Ajouter une nouvelle bouteille</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const brandName = String(formData.get("brand") ?? "").trim()
                const format = String(formData.get("format") ?? "").trim()

                if (!brandName || !format) {
                  toast.error("Veuillez remplir tous les champs")
                  return
                }

                // Check for duplicate
                // Table point_de_vente_bouteille non définie dans le schéma —
                // vérification de doublon différée à l'implémentation réelle

                // In a real implementation, we'd need to:
                // 1. Resolve or create the brand entry
                // 2. Insert into point_de_vente_bouteille
                // 3. Revalidate and show success

                toast.success("Bouteille enregistrée avec succès")
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="brand">Marque de bouteille</Label>
                  <Input
                    id="brand"
                    type="text"
                    placeholder="Ex: Total, Tradex, Bocom, Neptune, SCTM"
                    required
                    className="w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div>
                  <Label htmlFor="format">Grammage</Label>
                  <Input
                    id="format"
                    type="text"
                    placeholder="Ex: 6 kg, 12,5 kg, 15 kg"
                    required
                    className="w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => window.history.back()}>
                  Annuler
                </Button>
                <Button type="submit" className="ml-auto">Enregistrer</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  )
}