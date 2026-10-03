"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronDown,
  Clock,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusDot } from "@/app/_components/statuts"
import {
  brands,
  demoPoints,
  formatAge,
  formats,
} from "@/app/_components/donnees-demo"

const selectClass =
  "mt-1.5 h-11 w-full appearance-none rounded-lg border bg-background px-3 pr-9 text-sm text-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"

export function TrouverMonGaz() {
  const [brand, setBrand] = useState("")
  const [format, setFormat] = useState("")
  const [zone, setZone] = useState("")
  const [locationLabel, setLocationLabel] = useState<string | null>(null)
  const [searchMessage, setSearchMessage] = useState<string | null>(null)

  const results = demoPoints.filter(
    (point) =>
      (!brand || point.brands.includes(brand)) &&
      (!format || point.formats.includes(format))
  )

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearchMessage(
      results.length === 0
        ? "Aucun point trouvé pour cette recherche."
        : `${results.length} point${results.length > 1 ? "s" : ""} de vente trouvé${
            results.length > 1 ? "s" : ""
          } ${locationLabel ? `autour de ${locationLabel}` : "près de chez toi"}.`
    )
  }

  return (
    <section
      id="trouver-du-gaz"
      className="w-full scroll-mt-16 border-y bg-muted/50 py-16 md:py-24"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Trouver mon gaz
          </p>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Tu cherches le gaz où ?
          </h2>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            Voici exactement ce que tu fais dans GazPoint avant de quitter la
            maison.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b bg-muted/50 px-4 py-3">
            <span className="font-medium text-foreground">Recherche de gaz</span>
            <Badge variant="secondary" className="ml-auto">
              Démo
            </Badge>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
            <p className="text-sm font-medium text-foreground">
              Quelle bouteille tu cherches ?
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <label
                  htmlFor="demo-marque"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Marque
                </label>
                <select
                  id="demo-marque"
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  className={selectClass}
                >
                  <option value="">Choisir une marque</option>
                  {brands.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 bottom-3.5 size-4 text-muted-foreground" />
              </div>

              <div className="relative">
                <label
                  htmlFor="demo-format"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Format
                </label>
                <select
                  id="demo-format"
                  value={format}
                  onChange={(event) => setFormat(event.target.value)}
                  className={selectClass}
                >
                  <option value="">Choisir un format</option>
                  {formats.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 bottom-3.5 size-4 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label
                htmlFor="demo-zone"
                className="text-xs font-medium text-muted-foreground"
              >
                Zone ou localisation
              </label>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <input
                  id="demo-zone"
                  type="text"
                  value={zone}
                  onChange={(event) => {
                    setZone(event.target.value)
                    setLocationLabel(null)
                  }}
                  placeholder="Quartier, rue ou point de repère"
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shrink-0 gap-2"
                  onClick={() => {
                    setZone("")
                    setLocationLabel("Akwa, Douala")
                  }}
                >
                  <LocateFixed className="size-4" />
                  Utiliser ma position
                </Button>
              </div>
              {locationLabel && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Position utilisée : {locationLabel} (démo)
                </p>
              )}
            </div>

            <Button type="submit" className="h-12 w-full gap-2 text-base">
              <Search className="size-4" />
              Voir où il y en a
            </Button>

            <p aria-live="polite" className="min-h-5 text-center text-sm text-muted-foreground">
              {searchMessage}
            </p>
          </form>

          <div className="border-t">
            <p className="px-4 pt-4 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground sm:px-6">
              {results.length} point{results.length > 1 ? "s" : ""} trouvé
              {results.length > 1 ? "s" : ""}
            </p>

            <ul className="space-y-2 p-4 sm:p-6">
              {results.map((point) => (
                <li
                  key={point.id}
                  className="rounded-xl border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-3">
<div className="flex items-start gap-2">
                    <StatusDot status={point.status} className="mt-1.5" />
                    <div>
                      <p className="font-medium text-foreground">
                        {point.vendor}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {point.brands.join(" · ")} — {point.formats.join(" · ")}
                      </p>
                    </div>
                  </div>
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">
                      {point.distanceKm.toFixed(1).replace(".", ",")} km
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {point.district} — {point.address}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      Mis à jour {formatAge(point.updatedMinutesAgo)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5"
                      render={<Link href="/#trouver-du-gaz" />}
                      nativeButton={false}
                    >
                      <Navigation className="size-3.5" />
                      Voir l&apos;itinéraire
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 gap-1.5"
                      render={<a href={`tel:${point.phone.replace(/\s/g, "")}`} />}
                      nativeButton={false}
                    >
                      <Phone className="size-3.5" />
                      {point.phone}
                    </Button>
                  </div>
                </li>
              ))}

              {results.length === 0 && (
                <li className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Aucun point ne correspond à cette recherche pour le moment.
                  Essaie une autre marque ou un autre format.
                </li>
              )}
            </ul>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-xs text-muted-foreground">
          Démonstration visuelle : les points de vente ci-dessus sont fictifs et ne
          correspondent pas à des données réelles.
        </p>
      </div>
    </section>
  )
}