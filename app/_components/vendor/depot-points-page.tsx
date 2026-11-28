"use client"
import { useState } from "react"
import Link from "next/link"
import { Package, MapPin, Edit, Plus, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VendorEmptyState } from "@/app/_components/vendor/vendor-ui"
import type { VendorDepotDto } from "@/lib/vendor-dashboard"

interface DepotPointsPageProps {
  initialDepots: VendorDepotDto[]
}

export function DepotPointsPage({ initialDepots }: DepotPointsPageProps) {
  const [depots, setDepots] = useState(initialDepots)

  return (
    <div className="space-y-4">
      <VendorPageHeader
        title="Mes points de vente"
        description="Gérez les informations de vos dépôts GazPoints."
        actions={
          <Button
            size="sm"
            render={<Link prefetch={false} href="/dashboard/depot?new=1" />}
          >
            <Plus className="size-4 mr-2" aria-hidden />
            Ajouter un dépôt
          </Button>
        }
      />

      <VendorSectionCard title="Points de vente" contentClassName="p-0">
        {depots.length === 0 ? (
          <VendorEmptyState
            icon={Store}
            title="Aucun point de vente"
            description="Créez votre premier dépôt pour commencer à publier vos disponibilités."
            actions={
              <Button
                size="sm"
                render={<Link prefetch={false} href="/dashboard/depot?new=1" />}
              >
                Créer mon premier point de vente
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Carte de création d'un nouveau point de vente */}
            <Card
              className="border-dashed border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-center h-24">
                  <div className="text-center">
                    <div className="flex size-14 mx-auto items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                      <Plus className="size-6" aria-hidden />
                    </div>
                    <h3 className="font-semibold text-foreground">Nouveau point de vente</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Créer un dépôt supplémentaire
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  className="w-full"
                  variant="outline"
                  size="sm"
                  render={<Link prefetch={false} href="/dashboard/depot?new=1" />}
                >
                  <Plus className="size-3.5 mr-1.5" aria-hidden />
                  Créer un nouveau point de vente
                </Button>
              </CardContent>
            </Card>

            {/* Cartes des points de vente existants */}
            {depots.map((depot) => (
              <Card key={depot.id} className="border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Store className="size-5" aria-hidden />
                      </div>
                      <div>
                        <CardTitle className="font-semibold text-foreground truncate">{depot.name}</CardTitle>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="size-3" aria-hidden />
                          {depot.district} — {depot.address}
                        </p>
                      </div>
                    </div>
                    {depot.isActive ? (
                      <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 border border-emerald-500/20">
                        Actif
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border">
                        Inactif
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-2 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="size-3.5 shrink-0" aria-hidden />
                    <span>
                      {depot.brands.length} marque{depot.brands.length > 1 ? "s" : ""} •
                      {depot.formats.length} format{depot.formats.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {depot.brands.slice(0, 3).map((brand) => {
                      return (
                        <span key={brand} className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                          {brand}
                        </span>
                      )
                    })}
                    {depot.brands.length > 3 && (
                      <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs font-medium">
                        +{depot.brands.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <Link
                      href={`/dashboard/depot?id=${depot.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      <Edit className="size-3.5 mr-1.5 inline" aria-hidden />
                      Modifier
                    </Link>
                    {depot.phone && (
                      <a
                        href={`tel:${depot.phone.replace(/[^\d+]/g, "")}`}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        Appeler
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </VendorSectionCard>
    </div>
  )
}