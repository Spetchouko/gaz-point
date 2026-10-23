"use client"

import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CtaFinal() {
  return (
    <section className="w-full bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-strong px-6 py-12 text-center text-primary-foreground shadow-sm md:px-12 md:py-16">
          <Badge
            variant="secondary"
            className="mt-1 h-6 bg-primary-foreground/15 px-3 text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground"
          >
            Ne pars pas chercher au hasard
          </Badge>

          <h2 className="mt-5 text-balance font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            Vérifie d&apos;abord où il y en a.
          </h2>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <Link href="/#trouver-du-gaz">
              <Button
                size="lg"
                className="h-12 w-full gap-2 bg-primary-foreground px-8 text-base text-primary hover:bg-primary-foreground/90 sm:w-auto cursor-pointer"
              >
                Trouver mon gaz
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-xs text-primary-foreground/70">
            Gratuit · Sans abonnement · Sans carte bancaire
          </p>
        </div>
      </div>
    </section>
  )
}
