"use client"

import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CtaFinal() {
  return (
    <section className="w-full bg-sand py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="relative mx-auto max-w-3xl rounded-xl border border-border bg-white p-6 md:px-12 md:py-10 shadow-sm flex flex-col items-center text-center">
          <Badge
            variant="secondary"
            className="mt-1 h-5 bg-primary-foreground/15 px-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-primary"
          >
            Ne pars pas chercher au hasard
          </Badge>

          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Vérifie d'abord où il y en a.
          </h2>

          <div className="mt-5 w-full sm:w-auto">
            <Link href="/#trouver-du-gaz">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-xl border border-input bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-strong focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-ring/50"
              >
                Trouver mon gaz
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-foreground/60">
            Gratuit · Sans abonnement · Sans carte bancaire
          </p>
        </div>
      </div>
    </section>
  )
}