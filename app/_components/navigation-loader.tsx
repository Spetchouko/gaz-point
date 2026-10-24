"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { PageLoader } from "@/app/_components/page-loader"

export function NavigationLoader() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [pathname])

  if (!loading) return null
  return <PageLoader message="Chargement de la page…" />
}
