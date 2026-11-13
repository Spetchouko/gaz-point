"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  const handleScroll = useCallback(() => {
    if (typeof window === "undefined") return
    setVisible(window.scrollY > 100)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Retour en haut de page"
      className={`
        fixed bottom-6 right-6 z-40
        h-12 w-12 rounded-full bg-primary text-primary-foreground
        shadow-lg shadow-primary/20
        flex items-center justify-center
        transition-all duration-300 ease-in-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}
      `}
    >
      <ArrowUp className="size-5" aria-hidden />
      <span className="sr-only">Retour en haut de page</span>
    </button>
  )
}
