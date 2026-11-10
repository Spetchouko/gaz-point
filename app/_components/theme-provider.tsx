"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { initTheme, setTheme, type Theme } from "@/lib/theme"

type ThemeContextType = {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const raw = localStorage.getItem("gaz-theme")
      if (raw === "light" || raw === "dark" || raw === "system") return raw
    } catch {}
    return "system"
  })

  // Initialiser le thème du document immédiatement (évite le flash de thème par défaut)
  if (typeof window !== "undefined") {
    initTheme()
  }

  const handleSet = (t: Theme) => {
    setThemeState(t)
    setTheme(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSet }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider")
  return ctx
}
