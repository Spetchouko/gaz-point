"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Check,
  Clock,
  LocateFixed,
  MapPin,
  Menu,
  Navigation,
  Pause,
  Phone,
  Play,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusDot } from "@/app/_components/statuts"
import { demoPoints, formatAge } from "@/app/_components/donnees-demo"
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
          <Badge variant="secondary" className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]">
            Démonstration
          </Badge>

          <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Regarde comment ça marche.
          </h2>
          <p className="mt-4 text-balance text-base text-muted-foreground">
            Une interface simple, pensée pour mobile, qui va droit au but.
          </p>
        </div>

        {/* Centered layout for demo */}
        <div className="mt-12 flex flex-col items-center justify-center gap-10">
          {/* Smartphone Mockup */}
          <div className="relative mx-auto w-full max-w-[340px]">
            {/* Phone Outer Chassis */}
            <div className="relative rounded-[3rem] border-[10px] border-neutral-900 bg-neutral-950 p-2 shadow-2xl ring-1 ring-black/20">
              {/* Speaker / Dynamic Island Top Bar */}
              <div className="absolute left-1/2 top-4 z-20 h-4 w-24 -translate-x-1/2 rounded-full bg-neutral-900 flex items-center justify-center">
                <span className="size-2 rounded-full bg-neutral-800" />
              </div>

              {/* Phone Screen Screen */}
              <div className="relative flex h-[580px] flex-col overflow-hidden rounded-[2.2rem] bg-background text-foreground">
                {/* Status Bar */}
                <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold text-muted-foreground">
                  <span>09:41</span>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px]">4G</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* GazPoint Header inside Phone */}
                <div className="flex items-center justify-between border-b bg-background/95 px-4 py-2.5 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-[#F5F5F2] ring-1 ring-black/5">
                      <Image
                        src="/brand/logo.png"
                        alt="GazPoint"
                        width={20}
                        height={20}
                        className="h-5 w-5 object-contain"
                      />
                    </span>
                    <span className="font-heading text-sm font-bold tracking-tight text-foreground">
                      GazPoint
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-primary border-primary/30 bg-primary/5">
                      Direct
                    </Badge>
                    <span className="flex size-7 items-center justify-center rounded-md border text-muted-foreground">
                      <Menu className="size-3.5" />
                    </span>
                  </div>
                </div>

                {/* Main Content inside Phone */}
                <div className="flex flex-1 flex-col gap-2.5 overflow-hidden p-3.5">
                  <div className="rounded-lg bg-muted/60 p-2.5 text-center">
                    <p className="text-[11px] font-semibold text-foreground">
                      Trouver du gaz à proximité
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      Disponibilités en temps réel
                    </p>
                  </div>

                  {/* Simulated Form inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border bg-background px-2 py-1.5">
                      <p className="text-[9px] text-muted-foreground">Marque</p>
                      <p className="text-[11px] font-medium text-foreground">
                        {showBrand ? "Total" : "Toutes"}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-background px-2 py-1.5">
                      <p className="text-[9px] text-muted-foreground">Format</p>
                      <p className="text-[11px] font-medium text-foreground">
                        {showFormat ? "12,5 kg" : "Tous"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5">
                    <LocateFixed className="size-3 text-primary shrink-0" />
                    <span className="text-[10px] text-foreground truncate">
                      Akwa, Douala (2,5 km)
                    </span>
                  </div>

                  {/* Results Screen inside Phone */}
                  {!showPoint ? (
                    <div className="flex flex-1 flex-col gap-2 overflow-hidden pt-1">
                      <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                        <span>Points disponibles</span>
                        {showResults && <span className="text-primary font-semibold">3 trouvés</span>}
                      </div>

                      {showResults ? (
                        <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
                          {visiblePoints.map((point, i) => (
                            <div
                              key={point.id}
                              className={cn(
                                "rounded-lg border p-2 text-left transition-all",
                                i === 0 ? "border-primary bg-primary/5 shadow-xs" : "bg-card"
                              )}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate text-[10px] font-bold text-foreground">
                                  {point.vendor}
                                </span>
                                <span className="shrink-0 text-[9px] font-medium text-muted-foreground">
                                  {point.distanceKm.toFixed(1)} km
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between text-[9px] text-muted-foreground">
                                <span>{point.district}</span>
                                <span className="inline-flex items-center gap-1">
                                  <StatusDot status={point.status} />
                                  {point.status === "disponible" ? "En stock" : "À vérifier"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed text-center text-[10px] text-muted-foreground p-4">
                          Recherche en cours...
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Detailed Point View */
                    <div className="flex flex-1 flex-col justify-between rounded-xl border bg-card p-3 shadow-xs">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-foreground">
                              {selectedPoint.vendor}
                            </p>
                            <p className="text-[9px] text-muted-foreground">
                              {selectedPoint.district} — {selectedPoint.address}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[9px] text-emerald-600 bg-emerald-50 border-emerald-200">
                            Disponible
                          </Badge>
                        </div>

                        <div className="mt-2.5 flex items-center gap-1.5 text-[9px] text-muted-foreground">
                          <Clock className="size-3" />
                          Mis à jour {formatAge(selectedPoint.updatedMinutesAgo)}
                        </div>

                        {showMap && (
                          <div className="mt-2.5 flex h-20 items-center justify-center rounded-lg border bg-muted/60">
                            <div className="flex flex-col items-center gap-1 text-[9px] text-muted-foreground font-medium">
                              <MapPin className="size-4 text-primary animate-bounce" />
                              <span>Itinéraire calculé (4 min)</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {showActions && (
                        <div className="mt-2 flex gap-1.5">
                          <a
                            href={`tel:${selectedPoint.phone}`}
                            className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border bg-background text-[10px] font-semibold text-foreground shadow-xs"
                          >
                            <Phone className="size-3 text-primary" />
                            Appeler
                          </a>
                          <span className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-primary text-[10px] font-semibold text-primary-foreground shadow-xs">
                            <Navigation className="size-3" />
                            Itinéraire
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Home Indicator Bar */}
                <div className="pb-2 pt-1 flex justify-center">
                  <span className="h-1 w-24 rounded-full bg-foreground/20" />
                </div>
              </div>
            </div>
          </div>

          {/* Stepper Controls Centered */}
          <div className="flex flex-col items-center max-w-xl text-center">
            <ol className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {frames.map((frame, position) => {
                const done = position < index
                const active = position === index

                return (
                  <li key={frame.key}>
                    <button
                      type="button"
                      onClick={() => setIndex(position)}
                      aria-current={active ? "step" : undefined}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : done
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      <span className="flex size-4 items-center justify-center rounded-full text-[10px] font-bold">
                        {done ? <Check className="size-3" /> : position + 1}
                      </span>
                      <span className="hidden sm:inline">{frame.label}</span>
                    </button>
                  </li>
                )
              })}
            </ol>

            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 cursor-pointer"
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
                Clique sur une étape pour voir l&apos;écran correspondant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
