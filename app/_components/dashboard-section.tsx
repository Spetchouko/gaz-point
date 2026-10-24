"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DashboardSectionProps {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  count?: number
  defaultOpen?: boolean
  storageKey?: string
  children: React.ReactNode
  className?: string
}

export function DashboardSection({
  title,
  icon: Icon,
  count,
  defaultOpen = false,
  storageKey = "gaz-admin-sections",
  children,
  className = "",
}: DashboardSectionProps) {
  const [open, setOpen] = useState<boolean>(defaultOpen)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<string, boolean>>
        if (typeof parsed[title] === "boolean") setOpen(parsed[title])
      }
    } catch {}
  }, [title, storageKey])

  const toggle = useCallback(() => {
    const next = !open
    setOpen(next)
    try {
      const raw = localStorage.getItem(storageKey)
      const parsed = raw ? (JSON.parse(raw) as Partial<Record<string, boolean>>) : {}
      parsed[title] = next
      localStorage.setItem(storageKey, JSON.stringify(parsed))
    } catch {}
  }, [open, title, storageKey])

  if (!mounted) {
    return (
      <section className={cn("border rounded-xl bg-card shadow-sm overflow-hidden", className)} aria-label={title}>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground bg-muted/50" onClick={toggle} aria-expanded={defaultOpen}>
          {Icon && <Icon className="size-4 text-primary shrink-0" />}
          <span className="flex-1 text-left">{title}</span>
          {count !== undefined && <span className="text-xs text-muted-foreground">{count}</span>}
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
        <div className="hidden">
          {children}
        </div>
      </section>
    )
  }

  return (
    <section className={cn("border rounded-xl bg-card shadow-sm overflow-hidden transition-all", className)} aria-label={title}>
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground bg-muted/30 hover:bg-muted/60 transition-colors text-left"
        aria-expanded={open}
        aria-controls={`section-content-${title.replace(/\s+/g, "-")}`}
      >
        {Icon && <Icon className="size-4 text-primary shrink-0" aria-hidden="true" />}
        <span className="flex-1">{title}</span>
        {count !== undefined && <span className="text-xs text-muted-foreground font-normal">{count}</span>}
        <span className="ml-2 shrink-0" aria-hidden="true">
          {open ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        </span>
      </button>
      <div
        id={`section-content-${title.replace(/\s+/g, "-")}`}
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          open ? "max-h-[9999px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="p-4 md:p-5 border-t border-border/60">
          {children}
        </div>
      </div>
    </section>
  )
}
