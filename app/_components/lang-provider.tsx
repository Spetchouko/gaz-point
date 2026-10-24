"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Lang = "fr" | "en"

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void } | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const raw = localStorage.getItem("gaz-lang")
      if (raw === "fr" || raw === "en") return raw
    } catch {}
    return "fr"
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gaz-lang")
      if (raw === "fr" || raw === "en") setLangState(raw)
    } catch {}
  }, [])

  const handleSet = (l: Lang) => {
    setLangState(l)
    try { localStorage.setItem("gaz-lang", l) } catch {}
  }

  return (
    <LangContext.Provider value={{ lang, setLang: handleSet }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error("useLang must be inside LangProvider")
  return ctx
}
