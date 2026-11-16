"use client"

import { useEffect } from "react"
import { useLang } from "@/app/_components/lang-provider"

export function LangUpdater() {
  const { lang } = useLang()
  useEffect(() => {
    try {
      document.documentElement.lang = lang
    } catch {}
  }, [lang])
  return null
}
