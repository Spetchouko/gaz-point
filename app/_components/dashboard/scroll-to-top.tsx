"use client"

import { useCallback, useEffect, useState, type RefObject } from "react"
import { ArrowUp } from "lucide-react"

export function ScrollToTop({
  scrollContainerRef,
}: {
  scrollContainerRef?: RefObject<HTMLElement | null>
}) {
  const [visible, setVisible] = useState(false)

  const getScrollTop = useCallback(() => {
    if (scrollContainerRef?.current) return scrollContainerRef.current.scrollTop
    if (typeof window === "undefined") return 0
    return window.scrollY
  }, [scrollContainerRef])

  const handleScroll = useCallback(() => {
    setVisible(getScrollTop() > 100)
  }, [getScrollTop])

  const scrollToTop = useCallback(() => {
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [scrollContainerRef])

  useEffect(() => {
    const container = scrollContainerRef?.current
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true })
      handleScroll()
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      container?.removeEventListener("scroll", handleScroll)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll, scrollContainerRef])

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Retour en haut de page"
      className={`
        fixed bottom-6 right-6 z-40
        flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground
        shadow-lg shadow-primary/20
        transition-all duration-300 ease-in-out
        ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}
      `}
    >
      <ArrowUp className="size-5" aria-hidden />
      <span className="sr-only">Retour en haut de page</span>
    </button>
  )
}
