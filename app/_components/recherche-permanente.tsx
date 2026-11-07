"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTrouverGaz } from "@/lib/use-trouver-gaz"

export function RecherchePermanente() {
  const [visible, setVisible] = useState(false)
  const handleClick = useTrouverGaz()

  useEffect(() => {
    const hero = document.getElementById("accueil")

    if (!hero) return

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "-72px 0px -45% 0px", threshold: 0 }
    )

    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4 transition-all duration-300",
        "sm:inset-x-auto sm:bottom-6 sm:right-6 sm:px-0 sm:pb-0",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "pointer-events-auto flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm shadow-foreground/10 transition-colors hover:bg-primary/90 cursor-pointer",
          "sm:h-11"
        )}
      >
        <Search className="size-4" />
        Trouver du gaz
      </button>
    </div>
  )
}