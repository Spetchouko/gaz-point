import { asc, eq, inArray } from "drizzle-orm"
import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/db"
import { pointDeVente, disponibilite } from "@/db/schema"
import { VendorLayout } from "@/app/_components/vendor-layout"
import { requirePro } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Store, MapPin } from "lucide-react"
import { updatePointServices } from "../mes-bouteilles/actions"

export const metadata: Metadata = {
  title: { absolute: "Mes services | GazPoints" },
}

export default async function MesServicesPage() {
  const { user, role } = await requirePro()

  if (role !== "vendor") {
    return <div>Accès r&eacute;serv&eacute; aux vendeurs.</div>
  }

  // Get vendor's points de vente with their services
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
          Configurez les services propos&eacute;s à vos clients. Vous pouvez proposer
          un, deux ou les trois services.
        </p>

        {/* Service r&eacute;capitulatif */}
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
              <p className="font-medium">Livraison &agrave; domicile</p>
              <p className="text-xs text-muted-foreground">
                {points.length > 0 ? `Frais: ${points[0]?.deliveryFee || 0} FCFA` : "Non configur&eacute;"}
              </p>
            </div>
          </div>

          {/* Service 3 : Échange de bouteilles */}
          <div className="p-4 rounded-lg border border-warning/30 bg-warning/5 text-warning">
            <div className="text-3xl font-bold text-warning mb-1">𔄀</div>
            <div>
              <p className="font-medium">&Eacute;change de bouteilles</p>
              <p className="text-xs text-muted-foreground">
                {points.length > 0 ? `Marques: ${points[0]?.exchangeBrands?.join(", ") || "Non configur&eacute;"}` : "Non configur&eacute;"}
              </p>
            </div>
          </div>
        </div>

        {points.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                Aucun point de vente pour l&rsquo;instant. Cr&eacute;ez d&rsquo;abord votre point
                de vente pour pouvoir configurer les services.
              </p>
              <Link href="/dashboard/vendeur/points-de-vente">
                <Button variant="default">
                  Cr&e9;&shy;er mon point de vente
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {/* Configuration par point de vente */}
        <form
          action={async (formData: FormData) => {
            await updatePointServices(null, formData)
          }}
          className="space-y-6"
        >
          {points.map((point) => (
            <Card key={point.id} className="mb-4 hover:shadow-sm transition-shadow">
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
                <input type="hidden" name="pointId" value={point.id} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`delivery-${point.id}`}>
                      <input
                        type="checkbox"
                        id={`delivery-${point.id}`}
                        name="deliveryEnabled"
                        checked={point.delivery || false}
                        className="size-4 rounded border-input text-primary focus:ring-primary/50"
                      />
                      <span>Activer la livraison &agrave; domicile</span>
                    </Label>
                  </div>
                  <div>
                    <Label htmlFor={`gas-sale-${point.id}`}>
                      <input
                        type="checkbox"
                        id={`gas-sale-${point.id}`}
                        name="gasSaleEnabled"
                        checked={point.gasSale || false}
                        className="size-4 rounded border-input text-primary focus:ring-primary/50"
                      />
                      <span>Vente de bouteilles charg&eacute;es</span>
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`exchange-${point.id}`}>
                      <input
                        type="checkbox"
                        id={`exchange-${point.id}`}
                        name="exchangeEnabled"
                        checked={point.exchange || false}
                        className="size-4 rounded border-input text-primary focus:ring-primary/50"
                      />
                      <span>Activer l&rsquo;&eacute;change de bouteilles</span>
                    </Label>
                  </div>
                  <div>
                    <Label htmlFor={`delivery-fee-${point.id}`}>
                      Frais de livraison (FCFA)
                      <input
                        type="number"
                        id={`delivery-fee-${point.id}`}
                        name="deliveryFee"
                        value={point.deliveryFee || 0}
                        min={0}
                        className="w-full rounded-lg border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </Label>
                  </div>
                </div>

                {/* marques acceptées pour l'échange */}
                <div className="mt-3">
                  <Label htmlFor={`exchange-brands-${point.id}`}>
                    Marques acceptées pour l&rsquo;&eacute;change
                  </Label>
                  <input
                    type="text"
                    id={`exchange-brands-${point.id}`}
                    name="exchangeBrands"
                    value={point.exchangeBrands?.join(", ") || ""}
                    placeholder="Ex: Total, Tradex, Bocom (séparé par des virgules)"
                    className="w-full rounded-lg border-input px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Séparer plusieurs marques par des virgules
                  </p>
                </div>

                <div className="mt-3">
                  <Label htmlFor={`exchange-formats-${point.id}`}>
                    Grammages acceptés pour l&rsquo;&eacute;change
                  </Label>
                  <input
                    type="text"
                    id={`exchange-formats-${point.id}`}
                    name="exchangeFormats"
                    value={point.exchangeFormats?.join(", ") || ""}
                    placeholder="Ex: 6 kg, 12,5 kg, 15 kg (séparé par des virgules)"
                    className="w-full rounded-lg border-input px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Séparer plusieurs grammages par des virgules
                  </p>
                </div>

                {point.exchangeBrands && point.exchangeBrands.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg border border-warning/30 bg-warning/5">
                    <p className="text-sm font-medium text-warning mb-2">
                      Marques acceptées pour l&rsquo;&eacute;change :
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {point.exchangeBrands.map((brand) => (
                        <span key={brand} className="px-2 py-1 text-xs rounded bg-warning/20 text-warning">
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Bouton pour sauvegarder les configurations */}
          <div className="mt-6 p-4 rounded-lg border border-border bg-white shadow-sm">
            <p className="text-sm text-muted-foreground mb-3">
              Vos configurations de services seront appliquées aux nouvelles disponibilités
              et seront visibles dans la recherche cliente.
            </p>
            <Button variant="default" size="lg">
              Enregistrer toutes les configurations
            </Button>
          </div>
        </form>
      </div>
    </VendorLayout>
  )
}
