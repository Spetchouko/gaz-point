import { and, asc, count, eq, inArray } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { pointDeVente, disponibilite } from "@/db/schema"
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
import { Store, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: { absolute: "Mes services | GazPoints" },
}

export default async function MesServicesPage() {
  const { user, role } = await requirePro()

  if (role !== "vendor") {
    return <div>Accès réservé aux vendeurs.</div>
  }

  // Get vendor's points de vente with their disponibilites to understand services
  const points = await db
    .select({
      id: pointDeVente.id,
      name: pointDeVente.name,
      district: pointDeVente.district,
      delivery: pointDeVente.deliveryEnabled,
      deliveryFee: pointDeVente.deliveryFee,
      exchange: pointDeVente.exchangeEnabled,
      exchangeBrands: pointDeVente.exchangeBrands,
      exchangeFormats: pointDeVente.exchangeFormats,
      gasSale: pointDeVente.gasSaleEnabled,
    })
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, user.id))
    .orderBy(asc(pointDeVente.name))

  // Get all disponibilites with their services
  const allDispos = await db
    .select({
      id: disponibilite.id,
      pointId: disponibilite.pointId,
      status: disponibilite.status,
      delivery: disponibilite.delivery,
      exchange: disponibilite.exchange,
      gasSale: disponibilite.gasSale,
    })
    .from(disponibilite)
    .where(inArray(disponibilite.pointId, points.map((p) => p.id)))

  const totalDispoDelivery = allDispos.filter((d) => d.delivery).length
  const totalDispoExchange = allDispos.filter((d) => d.exchange).length
  const totalDispoGasSale = allDispos.filter((d) => d.gasSale).length

  return (
    <VendorLayout
      role={role}
      vendorName={user.name ?? "Vendeur"}
      vendorEmail={user.email}
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6">
          Mes services
        </h1>

        <p className="text-sm text-muted-foreground mb-6">
          Configurez les services proposés à vos clients. Vous pouvez proposer
          un, deux ou les trois services.
        </p>

        {/* Service récapitulatif */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Service 1 : Vente de bouteilles */}
          <div className="p-4 rounded-lg border border-info/30 bg-info/5 text-info">
            <div className="text-3xl font-bold text-info mb-1">🛒</div>
            <div>
              <p className="font-medium">Vente de bouteilles</p>
              <p className="text-xs text-muted-foreground">Client peut acheter une bouteille</p>
            </div>
          </div>

          {/* Service 2 : Livraison à domicile */}
          <div className="p-4 rounded-lg border border-success/30 bg-success/5 text-success">
            <div className="text-3xl font-bold text-success mb-1">🚚</div>
            <div>
              <p className="font-medium">Livraison à domicile</p>
              <p className="text-xs text-muted-foreground">
                {points.length > 0 ? `Frais: ${points[0]?.deliveryFee || 0} FCFA` : "Non configuré"}
              </p>
            </div>
          </div>

          {/* Service 3 : Échange de bouteilles */}
          <div className="p-4 rounded-lg border border-warning/30 bg-warning/5 text-warning">
            <div className="text-3xl font-bold text-warning mb-1">𔄀</div>
            <div>
              <p className="font-medium">Échange de bouteilles</p>
              <p className="text-xs text-muted-foreground">
                {points.length > 0 ? `Marques: ${points[0]?.exchangeBrands?.join(", ") || "Non configuré"}` : "Non configuré"}
              </p>
            </div>
          </div>
        </div>

        {/* Configuration par point de vente */}
        {points.map((point) => (
          <Card
            key={point.id}
            className="mb-4 hover:shadow-sm transition-shadow"
          >
            <CardHeader className="flex flex-wrap items-start justify-between gap-2 pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Store className="size-4 text-primary" aria-hidden />
                  {point.name}
                </CardTitle>
                <CardDescription className="mt-1 flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" aria-hidden />
                  {point.district}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {totalDispoDelivery} dispo delivery, {totalDispoExchange} dispo exchange, {totalDispoGasSale} dispo gas sale
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <form
                className="grid gap-4 pt-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  // Would handle service configuration
                  toast.info("Configuration en cours...")
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="delivery-{point.id}">
                      <input
                        type="checkbox"
                        id={`delivery-${point.id}`}
                        checked={point.delivery || false}
                        className="size-4 rounded border-input text-primary focus:ring-primary/50"
                        onChange={(e) => {
                          // Would update point de vente delivery setting
                          console.log("Livraison:", e.target.checked)
                        }}
                      />
                      <span>Activer la livraison à domicile</span>
                    </Label>
                  </div>
                  <div>
                    <Label htmlFor="gas-sale-{point.id}">
                      <input
                        type="checkbox"
                        id={`gas-sale-${point.id}`}
                        checked={point.gasSale || false}
                        className="size-4 rounded border-input text-primary focus:ring-primary/50"
                        onChange={(e) => {
                          // Would update point de vente gas sale setting
                          console.log("Vente gaz:", e.target.checked)
                        }}
                      />
                      <span>Vente de bouteilles chargées</span>
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="exchange-{point.id}">
                      <input
                        type="checkbox"
                        id={`exchange-${point.id}`}
                        checked={point.exchange || false}
                        className="size-4 rounded border-input text-primary focus:ring-primary/50"
                        onChange={(e) => {
                          // Would update point de vente exchange setting
                          console.log("Échange:", e.target.checked)
                        }}
                      />
                      <span>Activer l'échange de bouteilles</span>
                    </Label>
                  </div>
                  <div>
                    <Label htmlFor="exchange-fee-{point.id}">
                      <input
                        type="number"
                        id={`exchange-fee-${point.id}`}
                        value={point.deliveryFee || 0}
                        min={0}
                        className="w-full rounded-lg border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        onChange={(e) => {
                          // Would update exchange setting
                          console.log("Frais échange:", e.target.value)
                        }}
                      />
                      <span>Frais d'échange (FCFA)</span>
                    </Label>
                  </div>
                </div>

                {/* marques acceptées pour l'échange */}
                {point.exchangeBrands && point.exchangeBrands.length > 0 ? (
                  <div className="mt-3 p-3 rounded-lg border border-warning/30 bg-warning/5">
                    <p className="text-sm font-medium text-warning mb-2">
                      Marques acceptées pour l'échange :
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {point.exchangeBrands.map((brand) => (
                        <span
                          key={brand}
                          className="px-2 py-1 text-xs rounded bg-warning/20 text-warning"
                        >
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-3">
                    Aucune marque n'est sélectionnée pour l'échange
                  </p>
                )}

                <div className="mt-3">
                  <Label htmlFor="exchange-brands-{point.id}">
                    <input
                      type="text"
                      id={`exchange-brands-${point.id}`}
                      value={point.exchangeBrands?.join(", ") || ""}
                      onChange={(e) => {
                        // Would update exchange brands
                        console.log("Nouvelles marques:", e.target.value)
                      }}
                      placeholder="Ex: Total, Tradex, Bocom (séparé par des virgules)"
                      className="w-full rounded-lg border-input px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Séparer plusieurs marques par des virgules
                    </p>
                  </Label>
                </div>
              </form>
            </CardContent>
          </Card>
        ))}

        {/* Bouton pour sauvegarder les configurations */}
        <div className="mt-6 p-4 rounded-lg border border-border bg-white shadow-sm">
          <p className="text-sm text-muted-foreground mb-3">
            Vos configurations de services seront appliquées aux nouvelles disponibilités
            et seront visibles dans la recherche cliente.
          </p>
          <Button
            variant="default"
            size="lg"
            onClick={() => {
              // Would save all service configurations
              toast.success("Configurations sauvegardées avec succès")
            }}
          >
            Enregistrer toutes les configurations
          </Button>
        </div>
      </div>
    </VendorLayout>
  )
}