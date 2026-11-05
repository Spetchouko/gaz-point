"use client"

import { useCallback } from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Bouton de déclenchement du menu latéral des dashboards.
 * Positionné sous la navigation principale, côté gauche (jamais dans la navbar).
 * - Icône "hamburger" quand le menu est fermé.
 * - Icône "fermeture" (X) quand le menu est ouvert.
 */
export function DashboardMenuButton({
  open,
  onToggle,
  className,
}: {
  open: boolean
  onToggle: () => void
  className?: string
}) {
  const handleClick = useCallback(() => onToggle(), [onToggle])

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
      className={cn(
        "flex items-center justify-center size-10 rounded-lg transition-colors",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        className
      )}
    >
      {open ? (
        <X className="size-5" aria-hidden />
      ) : (
        <Menu className="size-5" aria-hidden />
      )}
    </button>
  )
}
