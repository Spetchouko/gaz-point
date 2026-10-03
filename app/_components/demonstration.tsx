"use client"

import { useEffect, useState } from "react"
import {
  Check,
  MapPin,
  Navigation,
  Pause,
  Phone,
  Play,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusDot } from "@/app/_components/statuts"
import { demoPoints } from "@/app/_components/donnees-demo"
import { cn } from "@/lib/utils"

const frames = [
  { key: "search", label: "Tu cherches une bouteille" },
  { key: "brand", label: "Tu sélectionnes la marque" },
  { key: "format", label: "Tu sélectionnes le format" },
  { key: "results", label: "Tu vois les disponibilités" },
  { key: "point", label: "Tu ouvres un point de vente" },
  { key: "map", label: "Tu consultes la localisation" },
  { key: "actions", label: "Tu appelles ou ouvres l'itinéraire" },
]

const visiblePoints = demoPoints.slice(0, 3)
const selectedPoint = demoPoints[0]

export function Demonstration() {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)

  const autoPlay = playing && !reducedMotion

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (!autoPlay) return
    const id = window.setTimeout(
      () => setIndex((current) => (current + 1) % frames.length),
      2600
    )
    return () => window.clearTimeout(id)
  }, [index, autoPlay])

  const showBrand = index >= 1
  const showFormat = index >= 2
  const showResults = index >= 3
  const showPoint = index >= 4
  const showMap = index >= 5
  const showActions = index >= 6

  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Démonstration
          </p>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Regarde comment ça marche.
          </h2>
        </div>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[320px_1fr] lg:gap-16">
          <div className="mx-auto w-full max-w-[320px]">
            <div className="rounded-[2rem] border-4 border-foreground/10 bg-background p-1.5 shadow-sm">
              <div className="flex h-[520px] flex-col overflow-hidden rounded-[1.55rem] bg-background">
                <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-medium text-muted-foreground">
                  <span>9:41</span>
                  <span className="h-1 w-10 rounded-full bg-foreground/15" aria-hidden />
                  <span>100 %</span>
                </div>

                <div className="flex items-center gap-1.5 px-4 pt-3">
                  <span className="flex size-5 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Search className="size-3" />
                  </span>
                  <span className="text-xs font-semibold text-foreground">GazPoint</span>
                  <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[9px]">
                    Démo
                  </Badge>
                </div>

                <div className="flex flex-1 flex-col gap-2.5 overflow-hidden p-4">
                  <p className="text-[11px] font-medium text-foreground">
                    Quelle bouteille tu cherches ?
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md border bg-muted/40 px-2.5 py-1.5">
                      <p className="text-[9px] text-muted-foreground">Marque</p>
                      <p className="text-[11px] font-medium text-foreground">
                        {showBrand ? "Tradex" : "Choisir"}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "rounded-md border px-2.5 py-1.5 transition-colors",
                        showFormat ? "bg-muted/40" : "bg-background"
                      )}
                    >
                      <p className="text-[9px] text-muted-foreground">Format</p>
                      <p
                        className={cn(
                          "text-[11px] font-medium",
                          showFormat ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {showFormat ? "12,5 kg" : "Choisir"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-md border bg-muted/40 px-2.5 py-1.5">
                    <p className="text-[9px] text-muted-foreground">Zone</p>
                    <p className="text-[11px] font-medium text-foreground">
                      Bonamoussadi, Douala
                    </p>
                  </div>

                  <div
                    className={cn(
                      "mt-auto flex h-9 items-center justify-center gap-1.5 rounded-md text-[11px] font-medium transition-colors",
                      showFormat
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Search className="size-3" />
                    Voir où il y en a
                  </div>

                  <div className="mt-1 h-px w-full bg-border" aria-hidden />

                  {showResults ? (
                    <ul className="animate-in fade-in-0 space-y-1.5">
                      {visiblePoints.map((point) => (
                        <li
                          key={point.id}
                          className={cn(
                            "rounded-md border p-2 transition-colors",
                            showPoint && point.id === selectedPoint.id
                              ? "border-primary/40 bg-primary/5"
                              : "bg-background"
                          )}
                        >
                          <div className="flex items-start gap-1.5">
                            <StatusDot status={point.status} className="mt-1 size-1.5" />
                            <p className="text-[11px] font-medium text-foreground">
                              {point.vendor}
                            </p>
                          </div>
                          <p className="mt-0.5 pl-3 text-[9px] text-muted-foreground">
                            {point.district} — {point.distanceKm.toFixed(1).replace(".", ",")} km
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="grid flex-1 place-items-center">
                      <p className="text-center text-[10px] text-muted-foreground">
                        Les résultats
                        <br />
                        apparaîtront ici
                      </p>
                    </div>
                  )}

                  {showPoint && (
                    <div className="animate-in fade-in-0 space-y-2">
                      {showMap && (
                        <div className="relative h-24 animate-in fade-in-0 overflow-hidden rounded-lg border bg-muted/70">
                          <span
                            className="absolute left-0 top-1/2 h-px w-full -rotate-6 bg-border"
                            aria-hidden
                          />
                          <span
                            className="absolute left-1/3 top-0 h-full w-px rotate-12 bg-border"
                            aria-hidden
                          />
                          <span className="absolute left-1/2 top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background shadow-sm">
                            <MapPin className="size-4 text-primary" />
                          </span>
                          <span className="absolute bottom-2 left-2 rounded-md bg-background/90 px-1.5 py-0.5 text-[9px] font-medium text-foreground">
                            {selectedPoint.district}
                          </span>
                        </div>
                      )}

                      <div className="rounded-md border bg-muted/40 px-2.5 py-1.5">
                        <p className="text-[11px] font-medium text-foreground">
                          {selectedPoint.vendor}
                        </p>
                        <p className="mt-0.5 text-[9px] text-muted-foreground">
                          {selectedPoint.address} · {selectedPoint.distanceKm.toFixed(1).replace(".", ",")} km
                        </p>
                        {showActions && (
                          <div className="mt-2 flex gap-1.5">
                            <span className="flex h-7 flex-1 items-center justify-center gap-1 rounded-md border bg-background text-[10px] font-medium text-foreground">
                              <Phone className="size-3" />
                              Appeler
                            </span>
                            <span className="flex h-7 flex-1 items-center justify-center gap-1 rounded-md bg-primary text-[10px] font-medium text-primary-foreground">
                              <Navigation className="size-3" />
                              Itinéraire
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <ol className="space-y-2.5">
              {frames.map((frame, position) => {
                const done = position < index
                const active = position === index

                return (
                  <li
                    key={frame.key}
                    className={cn(
                      "flex items-center gap-3 text-sm transition-colors",
                      active || done
                        ? "text-foreground"
                        : "text-muted-foreground/50"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setIndex(position)}
                      aria-current={active ? "step" : undefined}
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium transition-colors",
                        done && "border-primary bg-primary text-primary-foreground",
                        active && "border-primary text-primary",
                        !done && !active && "border-border"
                      )}
                    >
                      {done ? <Check className="size-3" /> : position + 1}
                    </button>
                    {frame.label}
                  </li>
                )
              })}
            </ol>

            <div className="mt-8 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                onClick={() => setPlaying((current) => !current)}
              >
                {autoPlay ? (
                  <>
                    <Pause className="size-3.5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="size-3.5" />
                    {index === frames.length - 1 ? "Revoir" : "Reprendre"}
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground">
                Clique sur une étape pour y aller directement.
              </p>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-xs text-muted-foreground">
          Cette démonstration est une simulation animée. Les points de vente
          affichés sont fictifs et seront remplacés par les données réelles.
        </p>
      </div>
    </section>
  )
}