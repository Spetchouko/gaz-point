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

  if (!visible) return null

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-4 pb-4 transition-opacity duration-200",
        "sm:inset-x-auto sm:bottom-6 sm:right-6 sm:px-0 sm:pb-0",
        "opacity-100"
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm shadow-foreground/10 transition-colors hover:bg-primary/90 cursor-pointer",
          "sm:h-11"
        )}
      >
        <Search className="size-4" />
        Trouver du gaz
      </button>
    </div>
  )
}