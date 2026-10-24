"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, MapPin, Quote } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { AvisPublic } from "@/lib/avis-shared"

const PAGE_SIZE = 6

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
          {name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Avatar className={cn("size-12 shrink-0", className)}>
      <AvatarFallback className="bg-mint text-lg font-semibold text-primary-strong">
        {name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

export function TemoignageCard({ item }: { item: AvisPublic }) {
  return (
    <li>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AvatarMark name={item.name} avatarUrl={item.avatarUrl} />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{item.name}</p>
              {item.city && (
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {item.city}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Quote className="size-4 text-primary/40" aria-hidden />
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
            {item.quote}
          </p>
        </CardContent>

        <CardFooter className="mt-auto border-t border-border pt-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {item.type === "vendeur" ? "Vendeur" : "Usager"}
          </span>
        </CardFooter>
      </Card>
    </li>
  )
}

export function Temoignages({ avis }: { avis: AvisPublic[] }) {
  const [page, setPage] = useState(0)

  // Aucun avis approuvé : la section n'apparaît pas et ne laisse aucun espace.
  if (avis.length === 0) return null

  const pages = Math.ceil(avis.length / PAGE_SIZE)
  const current = Math.min(page, pages - 1)
  const visible = avis.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)

  return (
    <section className="w-full bg-sand py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="secondary"
            className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]"
          >
            Ils utilisent GazPoints
          </Badge>

          <h2 className="mt-6 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            La parole à ceux qui l&apos;utilisent
          </h2>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            Des usagers et des vendeurs racontent ce que GazPoints change pour
            eux.
          </p>
        </div>

        <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <TemoignageCard key={item.id} item={item} />
          ))}
        </ul>

        {pages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setPage(Math.max(current - 1, 0))}
              disabled={current === 0}
              aria-label="Avis précédents"
              className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="size-5" />
            </button>

            <span className="text-sm font-medium text-muted-foreground" aria-live="polite">
              Page {current + 1} sur {pages}
            </span>

            <button
              type="button"
              onClick={() => setPage(Math.min(current + 1, pages - 1))}
              disabled={current >= pages - 1}
              aria-label="Avis suivants"
              className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
