"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, MapPin, Quote, Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  avisFirstName,
  avisTypeLabel,
  type AvisPublic,
} from "@/lib/avis-shared"

function AvatarMark({
  name,
  avatarUrl,
  className,
}: {
  name: string
  avatarUrl?: string | null
  className?: string
}) {
  if (avatarUrl) {
    return (
      <Avatar className={cn("size-12 shrink-0", className)}>
        <AvatarImage src={avatarUrl} alt="" />
        <AvatarFallback className="bg-mint text-base font-semibold text-primary-strong">
          {avisFirstName(name).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Avatar className={cn("size-12 shrink-0", className)}>
      <AvatarFallback className="bg-mint text-lg font-semibold text-primary-strong">
        {avisFirstName(name).charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return null
  return (
    <div className="flex items-center gap-0.5" aria-label={`Note : ${rating} sur 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            "size-4",
            index < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
          )}
        />
      ))}
      <span className="ml-1.5 text-xs font-semibold text-foreground">{rating}/5</span>
    </div>
  )
}

export function TemoignageCard({ item }: { item: AvisPublic }) {
  return (
    <li className="w-[85vw] max-w-sm shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)]">
      <Card className="h-full border-border bg-card shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AvatarMark name={item.name} avatarUrl={item.avatarUrl} />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{avisFirstName(item.name)}</p>
              {item.city && (
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {item.city}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <RatingStars rating={item.rating} />
          <Quote className="size-4 text-primary/40" aria-hidden />
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {item.quote}
          </p>
        </CardContent>

        <CardFooter className="mt-auto border-t border-border pt-4">
          <Badge variant="secondary" className="text-xs font-medium">
            {avisTypeLabel(item.type)}
          </Badge>
        </CardFooter>
      </Card>
    </li>
  )
}

export function Temoignages({ avis }: { avis: AvisPublic[] }) {
  const [items, setItems] = useState(avis)
  const scrollerRef = useRef<HTMLUListElement>(null)

  // Les avis sont rendus côté serveur. Au retour sur l'onglet (ou au focus),
  // on recharge la liste publique pour refléter immédiatement une validation
  // administrative récente.
  useEffect(() => {
    let cancelled = false
    async function refresh() {
      try {
        const response = await fetch("/api/avis/public", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!response.ok) return
        const data = await response.json()
        if (!cancelled && Array.isArray(data.avis)) {
          setItems(data.avis as AvisPublic[])
        }
      } catch {
        // La liste servie par le serveur reste affichée en cas d'erreur réseau.
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh()
    }

    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      cancelled = true
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  // Aucun avis approuvé : la section n'apparaît pas et ne laisse aucun espace.
  if (items.length === 0) return null

  const scroll = (direction: "left" | "right") => {
    const element = scrollerRef.current
    if (!element) return
    const amount = Math.max(element.clientWidth * 0.8, 260)
    element.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }

  return (
    <section className="w-full bg-sand py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="secondary"
            className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]"
          >
            Ils nous font confiance
          </Badge>

          <h2 className="mt-6 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Ce que nos utilisateurs pensent de GazPoints
          </h2>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            Des clients et des vendeurs racontent ce que GazPoints change pour
            eux.
          </p>
        </div>

        <div className="relative mt-12">
          <ul
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]"
          >
            {items.map((item) => (
              <TemoignageCard key={item.id} item={item} />
            ))}
          </ul>

          {items.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => scroll("left")}
                aria-label="Avis précédents"
                className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted"
              >
                <ChevronLeft className="size-5" />
              </button>
              <span className="text-sm font-medium text-muted-foreground">
                Faites défiler les avis
              </span>
              <button
                type="button"
                onClick={() => scroll("right")}
                aria-label="Avis suivants"
                className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
