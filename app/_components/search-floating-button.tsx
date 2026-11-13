"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

const SCROLL_SECTION_ID = "recherche-gaz"

export function FloatingSearchButton() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // After navigating to home page with anchor, scroll to section
  useEffect(() => {
    if (pathname === "/" && window.location.hash === `#${SCROLL_SECTION_ID}`) {
      const element = document.getElementById(SCROLL_SECTION_ID)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
      // Nettoie le hash après le scroll pour éviter qu'il ne reste dans l'URL
      window.history.replaceState(null, "", window.location.pathname)
    }
  }, [pathname])

  const isHome = pathname === "/"

  const handleClick = () => {
    if (isHome) {
      const element = document.getElementById(SCROLL_SECTION_ID)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    } else {
      // Navigue vers la landing page avec l'ancre de recherche, sans scroll automatique
      router.push(`/?#${SCROLL_SECTION_ID}`, undefined, { scroll: false })
    }
  }

  if (!mounted) return null

  return (
    <div
      className="fixed bottom-[110px] right-6 z-50 transition-all duration-300 ease-out"
    >
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-strong transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Trouver mon gaz"
        title="Trouver mon gaz"
      >
        <Search className="size-4" />
        <span className="hidden sm:flex text-sm font-medium">Trouver mon gaz</span>
      </button>
    </div>
  )
}
