"use client"

import { useState, useRef, useEffect } from "react"
import { Settings, Sun, Monitor, Moon, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/app/_components/theme-provider"
import { useTranslation } from "@/lib/i18n"

export function SettingsPopover() {
  const { theme, setTheme } = useTheme()
  const t = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const themes = [
    { key: "light" as const, label: t("settings_light"), icon: Sun },
    { key: "system" as const, label: t("settings_system"), icon: Monitor },
    { key: "dark" as const, label: t("settings_dark"), icon: Moon },
  ] as const

  return (
    <div ref={ref} className="relative inline-block">
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("settings_appearance")}
        aria-expanded={open}
        aria-haspopup="true"
        className="rounded-full cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <Settings className="size-5" />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border bg-card p-4 shadow-sm"
          aria-label={t("settings_appearance")}
        >
          <div>
            <h3 className="text-sm font-semibold mb-2">{t("settings_appearance")}</h3>
            <div className="space-y-1">
              {themes.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => { setTheme(key); setOpen(false) }}
                  className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    theme === key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
                  }`}
                  aria-pressed={theme === key}
                >
                  <Icon className="size-4" />
                  <span className="flex-1 text-left">{label}</span>
                  {theme === key && <Check className="size-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
