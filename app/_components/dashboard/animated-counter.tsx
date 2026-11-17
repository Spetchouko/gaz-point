"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Compteur animé : fait défiler les chiffres de 0 (ou de la valeur
 * précédente) vers la valeur cible à l'affichage et à chaque changement
 * de période. Aucune dépendance externe : animation via requestAnimationFrame.
 */
interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
  durationMs?: number
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  durationMs = 700,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0)
  const previous = useRef<number | null>(null)
  const initialized = useRef(false)
  const frame = useRef<number | null>(null)

  const format = (v: number) => {
    const formatted = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString()
    return `${prefix}${formatted}${suffix}`
  }

  useEffect(() => {
    if (frame.current) {
      cancelAnimationFrame(frame.current)
      frame.current = null
    }

    const start = initialized.current && previous.current !== null ? previous.current : 0
    const end = value
    const startTime = Date.now()

    const step = () => {
      const elapsed = Date.now() - startTime
      const t = Math.min(1, elapsed / durationMs)
      // Ease-out cubic pour une fin de transition douce.
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(start + (end - start) * eased))
      if (t < 1) {
        frame.current = requestAnimationFrame(step)
      } else {
        previous.current = end
        initialized.current = true
      }
    }

    frame.current = requestAnimationFrame(step)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [value, durationMs])

  return (
    <span className={className}>
      {format(display)}
    </span>
  )
}
