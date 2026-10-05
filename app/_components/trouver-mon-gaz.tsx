"use client"

import { useState } from "react"
import {
  ChevronDown,
  LocateFixed,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { brands, formats } from "@/app/_components/donnees-demo"
import { useAuthModal } from "@/lib/auth-context"

const selectClass =
  "mt-1.5 h-11 w-full appearance-none rounded-lg border bg-background px-3 pr-9 text-sm text-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"

export function TrouverMonGaz() {
  const { isAuthenticated, openAuthModal } = useAuthModal()
  const [brand, setBrand] = useState("")
  const [format, setFormat] = useState("")
  const [zone, setZone] = useState("")
  const [locationLabel, setLocationLabel] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isAuthenticated) {
      openAuthModal("register")
      return
    }
  }

  return (
    <section
      id="trouver-du-gaz"
      className="w-full scroll-mt-16 border-y bg-muted/50 py-16 md:py-24"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]">
            Trouver mon gaz
          </Badge>

          <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Tu cherches le gaz où ?
          </h2>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            Renseigne ta bouteille et ta zone pour trouver les points de vente disponibles en direct.
          </p>
        </div>

        <Card className="mx-auto mt-12 max-w-2xl shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-7">
            <p className="text-sm font-semibold text-foreground">
              Quelle bouteille tu cherches ?
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <label
                  htmlFor="recherche-marque"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Marque
                </label>
                <select
                  id="recherche-marque"
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  className={selectClass}
                >
                  <option value="">Toutes les marques</option>
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
                  htmlFor="recherche-format"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Format
                </label>
                <select
                  id="recherche-format"
                  value={format}
                  onChange={(event) => setFormat(event.target.value)}
                  className={selectClass}
                >
                  <option value="">Tous les formats</option>
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
                htmlFor="recherche-zone"
                className="text-xs font-medium text-muted-foreground"
              >
                Zone ou localisation
              </label>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <input
                  id="recherche-zone"
                  type="text"
                  value={zone}
                  onChange={(event) => {
                    setZone(event.target.value)
                    setLocationLabel(null)
                  }}
                  placeholder="Quartier, rue ou point de repère (ex: Akwa, Bonanjo)"
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shrink-0 gap-2 cursor-pointer"
                  onClick={() => {
                    setZone("Douala")
                    setLocationLabel("Ma position actuelle")
                  }}
                >
                  <LocateFixed className="size-4" />
                  Utiliser ma position
                </Button>
              </div>
              {locationLabel && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Position détectée : {locationLabel}
                </p>
              )}
            </div>

            <Button type="submit" className="h-12 w-full gap-2 text-base cursor-pointer">
              <Search className="size-4" />
              Voir où il y en a
            </Button>
          </form>
        </Card>
      </div>
    </section>
  )
}
