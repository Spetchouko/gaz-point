"use client"

import { FOOTER_COPYRIGHT, FOOTER_TAGLINE } from "@/lib/footer-text"

export function DashboardFooter() {
  return (
    <footer className="bg-mint border-t border-border py-4">
      <div className="container mx-auto px-4 text-center">
        <div className="border-t border-border my-3"></div>
        <p className="text-xs text-muted-foreground">{FOOTER_COPYRIGHT}</p>
        <p className="mt-1 text-xs text-muted-foreground">{FOOTER_TAGLINE}</p>
      </div>
    </footer>
  )
}
