"use client"

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react"
import Image from "next/image"
import {
  Check,
  ChevronDown,
  LocateFixed,
  MapPin,
  Navigation,
  Pause,
  Phone,
  Play,
  RotateCcw,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  availabilityLabel,
  brands,
  demoPoints,
  formatAge,
  formats,
  type Availability,
} from "@/app/_components/donnees-demo"

const STEP_MS = 2600
const SCREEN_H = 500

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
  mq.addEventListener("change", onChange)
  return () => mq.removeEventListener("change", onChange)
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  )
}

const steps = [
  {
    title: "Tu cherches une bouteille",
    description: "Ouvre la recherche GazPoints depuis ta zone.",
  },
  {
    title: "Tu sélectionnes la marque",
    description: "Tradex, Total, SCTM ou Bocom : choisis ta bouteille.",
  },
  {
    title: "Tu sélectionnes le format",
    description: "6 kg, 12,5 kg ou 15 kg selon ton foyer.",
  },
  {
    title: "Tu vois les disponibilités",
    description: "Points à proximité, statut et dernière mise à jour.",
  },
  {
    title: "Tu ouvres un point de vente",
    description: "Adresse, téléphone et détails du dépôt.",
  },
  {
    title: "Tu consultes la localisation",
    description: "Repère le point directement sur le plan.",
  },
  {
    title: "Tu appelles ou ouvres l'itinéraire",
    description: "Appelle le vendeur ou lance l'itinéraire.",
  },
]

const badgeClass: Record<Availability, string> = {
  disponible: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  à_confirmer: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  indisponible: "bg-red-500/10 text-red-600 border-red-500/30",
}

/* ------------------------------------------------------------------ */
/* Blocs d'interface du téléphone (décoratifs : wrapper aria-hidden)   */
/* ------------------------------------------------------------------ */

function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[500px] w-full shrink-0 flex-col overflow-hidden bg-[#f4f8ff] pt-12">
      {children}
    </div>
  )
}

function AppHeader() {
  return (
    <div className="flex items-center justify-between border-b border-primary/10 bg-primary px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className="flex size-5 items-center justify-center rounded-md bg-white shadow-sm">
          <Image
            src="/brand/logo.png"
            alt=""
            width={40}
            height={40}
            className="size-3.5 object-contain"
          />
        </span>
        <span className="text-[10px] font-bold tracking-tight text-primary-foreground">
          GazPoints
        </span>
      </div>
      <span className="flex items-center gap-1 text-[9px] font-medium text-primary-foreground/85">
        <MapPin className="size-2.5" />
        Douala
      </span>
    </div>
  )
}

function SelectField({
  label,
  value,
  active,
}: {
  label: string
  value: string
  active: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-background px-2 py-1.5 transition-shadow",
        active
          ? "border-primary/60 ring-2 ring-primary/40"
          : "border-zinc-200"
      )}
    >
      <p className="text-[7px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 flex items-center justify-between gap-1">
        <span className="truncate text-[9px] font-semibold text-zinc-900">{value}</span>
        {active ? (
          <Check className="size-3 shrink-0 text-primary" />
        ) : (
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        )}
      </div>
    </div>
  )
}

function SuccessPill({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[8px] font-semibold text-emerald-600">
      <Check className="size-2.5 shrink-0" />
      {children}
    </p>
  )
}

function SearchScreen({
  marque,
  format,
  highlight,
}: {
  marque: string | null
  format: string | null
  highlight: "none" | "marque" | "format"
}) {
  return (
    <Screen>
      <AppHeader />
      <div className="flex-1 space-y-2 overflow-hidden px-2.5 py-2.5">
        <p className="text-[11px] font-bold text-zinc-900">Où trouver du gaz</p>
        <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-background px-2 py-1.5">
          <Search className="size-3 shrink-0 text-muted-foreground" />
          <span className="truncate text-[9px] text-muted-foreground">
            Quartier, rue ou point de repère
          </span>
        </div>
        <div className="space-y-1.5 pt-1">
          <p className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
            Quelle bouteille tu cherches ?
          </p>
          <SelectField
            label="Marque"
            value={marque ?? "Toutes les marques"}
            active={highlight === "marque"}
          />
          <SelectField
            label="Format"
            value={format ?? "Tous les formats"}
            active={highlight === "format"}
          />
        </div>
        <div className="flex items-center gap-1.5 pt-1">
          <div className="h-9 flex-1 rounded-lg border border-zinc-200 bg-background px-2 py-1.5 text-[9px] text-muted-foreground">
            Akwa, Bonanjo…
          </div>
          <div className="flex h-9 items-center gap-1 rounded-lg border border-zinc-200 bg-background px-2 text-[8px] font-semibold text-primary">
            <LocateFixed className="size-3" />
            Position
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-[10px] font-bold text-primary-foreground shadow-sm">
          <Search className="size-3" />
          Voir où il y en a
        </div>
        {(highlight === "marque" || highlight === "format") && (
          <div className="space-y-1.5">
            {highlight === "marque" && <SuccessPill>Marque : {brands[0]}</SuccessPill>}
            {highlight === "format" && <SuccessPill>Format : {formats[1]}</SuccessPill>}
          </div>
        )}
      </div>
    </Screen>
  )
}

function ListScreen() {
  const points = [demoPoints[0], demoPoints[1], demoPoints[2]]
  return (
    <Screen>
      <AppHeader />
      <div className="flex-1 space-y-1.5 overflow-hidden px-2.5 py-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-zinc-900">3 points trouvés</p>
          <span className="text-[8px] text-muted-foreground">À proximité de Douala</span>
        </div>
        {points.map((point) => (
          <div
            key={point.id}
            className="rounded-xl border border-zinc-200 bg-background p-2 shadow-sm"
          >
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold text-zinc-900">{point.vendor}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[8px] text-muted-foreground">
                  <MapPin className="size-2.5 shrink-0" />
                  <span className="truncate">
                    {point.district} — {point.address}
                  </span>
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-1.5 py-0.5 text-[7px] font-semibold",
                  badgeClass[point.status]
                )}
              >
                {availabilityLabel[point.status]}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[8px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <MapPin className="size-2" />
                {point.distanceKm.toLocaleString("fr-FR")} km
              </span>
              <span aria-hidden>•</span>
              <span>Mis à jour : {formatAge(point.updatedMinutesAgo)}</span>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  )
}

function DetailScreen() {
  const point = demoPoints[0]
  return (
    <Screen>
      <AppHeader />
      <div className="flex-1 space-y-1.5 overflow-hidden px-2.5 py-2.5">
        <p className="text-[11px] font-bold text-zinc-900">Point de vente</p>
        <div className="rounded-xl border border-zinc-200 bg-background p-2.5 shadow-sm">
          <div className="flex items-start justify-between gap-1.5">
            <p className="truncate text-[11px] font-bold text-zinc-900">{point.vendor}</p>
            <span
              className={cn(
                "shrink-0 rounded-full border px-1.5 py-0.5 text-[7px] font-semibold",
                badgeClass[point.status]
              )}
            >
              {availabilityLabel[point.status]}
            </span>
          </div>
          <div className="mt-2 space-y-1.5 text-[8px] text-muted-foreground">
            <p className="flex items-center gap-1">
              <MapPin className="size-2.5 shrink-0" />
              {point.district} — {point.address}
            </p>
            <p className="flex items-center gap-1">
              <Phone className="size-2.5 shrink-0" />
              {point.phone}
            </p>
            <p className="flex items-center gap-1">
              <MapPin className="size-2.5 shrink-0" />
              À {point.distanceKm.toLocaleString("fr-FR")} km de ta position
            </p>
            <p className="flex items-center gap-1 text-zinc-500">
              Mis à jour : {formatAge(point.updatedMinutesAgo)} · {point.brands.join(", ")}
            </p>
          </div>
        </div>
      </div>
    </Screen>
  )
}

function MapScreen() {
  const point = demoPoints[0]
  return (
    <Screen>
      <AppHeader />
      <div className="relative flex-1 overflow-hidden">
        <div
          className="absolute inset-0 bg-[#e6f0fb]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(37,99,235,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,0.12) 1px, transparent 1px), linear-gradient(135deg, rgba(37,99,235,0.05) 45%, transparent 45%)",
            backgroundSize: "20px 20px, 20px 20px, 56px 56px",
          }}
        />
        <div className="absolute left-1/2 top-[38%] -translate-x-1/2">
          <span className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 motion-safe:animate-ping" />
          <span className="relative flex size-6 -translate-y-full items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <MapPin className="size-3.5" />
          </span>
        </div>
        <div className="absolute inset-x-2 bottom-2 rounded-xl border border-zinc-200 bg-background p-2 shadow-md">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold text-zinc-900">{point.vendor}</p>
              <p className="mt-0.5 truncate text-[8px] text-muted-foreground">{point.address}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full border px-1.5 py-0.5 text-[7px] font-semibold",
                badgeClass[point.status]
              )}
            >
              {availabilityLabel[point.status]}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-center gap-1 rounded-lg bg-primary py-1.5 text-[9px] font-bold text-primary-foreground">
            <Navigation className="size-2.5" />
            Ouvrir l&apos;itinéraire
          </div>
        </div>
      </div>
    </Screen>
  )
}

function ActionsScreen() {
  const point = demoPoints[0]
  return (
    <Screen>
      <AppHeader />
      <div className="flex-1 space-y-2 px-2.5 py-2.5">
        <p className="text-[11px] font-bold text-zinc-900">Prêt pour le dernier kilomètre</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-background p-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Check className="size-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[9px] font-bold text-zinc-900">{point.vendor}</p>
              <p className="truncate text-[8px] text-muted-foreground">
                {point.district} — {point.address}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex items-center justify-center gap-1 rounded-lg bg-primary py-2 text-[9px] font-bold text-primary-foreground">
              <Phone className="size-2.5" />
              Appeler
            </div>
            <div className="flex items-center justify-center gap-1 rounded-lg border border-primary/30 bg-primary/5 py-2 text-[9px] font-bold text-primary">
              <Navigation className="size-2.5" />
              Itinéraire
            </div>
          </div>
        </div>
      </div>
    </Screen>
  )
}

function renderScreen(index: number) {
  switch (index) {
    case 0:
      return <SearchScreen marque={null} format={null} highlight="none" key={index} />
    case 1:
      return <SearchScreen marque={brands[0]} format={null} highlight="marque" key={index} />
    case 2:
      return <SearchScreen marque={brands[0]} format={formats[1]} highlight="format" key={index} />
    case 3:
      return <ListScreen key={index} />
    case 4:
      return <DetailScreen key={index} />
    case 5:
      return <MapScreen key={index} />
    default:
      return <ActionsScreen key={index} />
  }
}

/* ------------------------------------------------------------------ */
/* Téléphone                                                            */
/* ------------------------------------------------------------------ */

function PhoneMockup({
  step,
  playing,
  reducedMotion,
}: {
  step: number
  playing: boolean
  reducedMotion: boolean
}) {
  return (
    <div
      className="relative isolate w-fit animate-demo-float motion-reduce:animate-none"
      aria-hidden="true"
    >
      {/* halos décoratifs */}
      <div
        className="absolute -inset-14 -z-10"
        style={{
          background: "radial-gradient(closest-side, oklch(0.4467 0.1272 265.6182 / 0.16), transparent)",
        }}
      />
      <div
        className="absolute -inset-8 -z-10 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.3776 0.1447 264.5076 / 0.18) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(62% 62% at 50% 50%, black, transparent)",
        }}
      />

      {/* cadran */}
      <div className="relative rounded-[2.6rem] border-[7px] border-zinc-900 bg-zinc-900 shadow-2xl shadow-primary/15">
        <div className="relative h-[500px] w-[248px] overflow-hidden rounded-[2.15rem] bg-[#f4f8ff] sm:w-[270px]">
          {/* Dynamic Island */}
          <div className="absolute left-1/2 top-2.5 z-30 h-4 w-16 -translate-x-1/2 rounded-full bg-zinc-900" />

          {/* barre de statut */}
          <div className="absolute inset-x-0 top-0 z-20 flex h-8 items-center justify-between px-4">
            <span className="text-[9px] font-bold text-zinc-900">9:41</span>
            <span className="flex items-center gap-1">
              <span className="flex items-end gap-[1.5px]">
                <span className="h-1 w-[2px] rounded-sm bg-zinc-700" />
                <span className="h-1.5 w-[2px] rounded-sm bg-zinc-700" />
                <span className="h-2 w-[2px] rounded-sm bg-zinc-700" />
                <span className="h-2.5 w-[2px] rounded-sm bg-zinc-900" />
              </span>
              <span className="ml-1 flex h-[9px] w-4 items-center rounded-[2px] border border-zinc-500 p-[1px]">
                <span className="h-full w-2/3 rounded-[1px] bg-zinc-900" />
              </span>
            </span>
          </div>

          {/* pastille Aperçu */}
          <span className="absolute left-1/2 top-[34px] z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-zinc-900/85 px-1.5 py-[3px] text-[7px] font-semibold tracking-wide text-white">
            Aperçu · Démo
          </span>

          {/* écrans empilés */}
          <div className="absolute inset-0">
            <div
              className="flex flex-col will-change-transform motion-reduce:transition-none"
              style={{
                transform: `translateY(-${step * SCREEN_H}px)`,
                transition: "transform 750ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {Array.from({ length: 7 }, (_, index) => renderScreen(index))}
            </div>
          </div>

          {/* curseur tactile discret qui fait défiler */}
          {!reducedMotion && (
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute bottom-16 right-5 z-30 flex size-7 items-center justify-center",
                playing ? "animate-demo-swipe" : "opacity-70"
              )}
            >
              <span className="absolute size-7 rounded-full bg-primary/15" />
              <span className="size-3.5 rounded-full bg-primary/70 shadow-md ring-2 ring-white/70" />
            </span>
          )}

          {/* indicateur home */}
          <div className="absolute bottom-2 left-1/2 z-30 h-1 w-16 -translate-x-1/2 rounded-full bg-zinc-900/80" />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Section                                                              */
/* ------------------------------------------------------------------ */

export function Demonstration() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(true)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!playing || reducedMotion) return
    const id = setInterval(() => {
      setStep((current) => (current + 1) % steps.length)
    }, STEP_MS)
    return () => clearInterval(id)
  }, [playing, reducedMotion])

  const replay = () => {
    setStep(0)
    setPlaying(true)
  }

  return (
    <section className="relative w-full overflow-hidden bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="secondary"
            className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]"
          >
            Démonstration
          </Badge>

          <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Découvrez <span className="text-primary">GazPoints</span>
          </h2>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            Une interface simple pour trouver du gaz proche de chez vous.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl items-center gap-10 lg:grid-cols-2 lg:gap-8">
          {/* Rail d'étapes (à droite sur desktop) */}
          <div className="order-2 lg:order-2">
            <ol className="space-y-2">
              {steps.map((stepItem, index) => {
                const active = index === step
                const done = index < step

                return (
                  <li key={stepItem.title}>
                    <button
                      type="button"
                      onClick={() => setStep(index)}
                      aria-current={active ? "step" : undefined}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all",
                        active
                          ? "border-primary/30 bg-primary/5 shadow-sm"
                          : "border-transparent hover:bg-muted/60"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : done
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {done ? <Check className="size-4" /> : index + 1}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block text-sm font-semibold",
                            active ? "text-primary" : "text-foreground"
                          )}
                        >
                          {stepItem.title}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                          {stepItem.description}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {reducedMotion ? (
                <p className="text-xs text-muted-foreground">
                  Lecture automatique désactivée (mouvements réduits).
                </p>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 cursor-pointer"
                  onClick={() => setPlaying((current) => !current)}
                >
                  {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                  {playing ? "Pause" : "Reprendre"}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 cursor-pointer"
                onClick={replay}
              >
                <RotateCcw className="size-4" />
                Rejouer
              </Button>
            </div>

            <p className="sr-only" aria-live="polite">
              Étape {step + 1} sur {steps.length} : {steps[step].title}
            </p>
          </div>

          {/* Téléphone (à gauche sur desktop) */}
          <div className="order-1 mx-auto w-fit lg:order-1">
            <PhoneMockup step={step} playing={playing} reducedMotion={reducedMotion} />
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Aperçu illustratif du parcours GazPoints
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
