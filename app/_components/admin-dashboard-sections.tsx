"use client"

import { useCallback, useState, useEffect } from "react"
import {
  BarChart3, Users, Store, MapPin, Megaphone, Activity, Settings,
  ChevronDown, ChevronRight, Eye, EyeOff,
} from "lucide-react"
import { DashboardSection } from "./dashboard-section"
import { useLang } from "./lang-provider"

type SectionKey = "overview" | "users" | "points" | "marketing" | "analytics" | "settings"
const STORAGE_KEY = "gaz-admin-sections-v2"

export function AdminDashboardSections({
  stats,
  recentActivity,
}: {
  stats?: {
    abonnes?: number
    vendeurs?: number
    utilisateurs?: number
    pointsDeVente?: number
    disponibilitesActives?: number
    bouteillesDisponibles?: number
  }
  recentActivity?: React.ReactNode
}) {
  const { lang } = useLang()
  const t = {
    fr: {
      overview: "Vue d'ensemble",
      users: "Utilisateurs et vendeurs",
      points: "Points de vente et disponibilités",
      marketing: "Marketing et publicité",
      analytics: "Analyses et statistiques",
      settings: "Paramètres et administration",
      expandAll: "Tout déplier",
      collapseAll: "Tout replier",
    },
    en: {
      overview: "Overview",
      users: "Users and vendors",
      points: "Points of sale and availabilities",
      marketing: "Marketing and ads",
      analytics: "Analytics and stats",
      settings: "Settings and administration",
      expandAll: "Expand all",
      collapseAll: "Collapse all",
    },
  }[lang === "en" ? "en" : "fr"]

  const allKeys: SectionKey[] = [
    "overview",
    "users",
    "points",
    "marketing",
    "analytics",
    "settings",
  ]

  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<string, boolean>>
        const next: Record<string, boolean> = {}
        allKeys.forEach((k) => {
          next[k] = k === "overview" ? true : (parsed[k] === true ? true : false)
        })
        setOpenKeys(next)
      } else {
        const next: Record<string, boolean> = {}
        allKeys.forEach((k) => (next[k] = k === "overview" ? true : false))
        setOpenKeys(next)
      }
    } catch {}
  }, [])

  const save = useCallback((next: Record<string, boolean>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
  }, [])

  const expandAll = useCallback(() => {
    const next = { ...openKeys }
    allKeys.forEach((k) => (next[k] = true))
    setOpenKeys(next)
    save(next)
  }, [openKeys, save])

  const collapseAll = useCallback(() => {
    const next = { ...openKeys }
    allKeys.forEach((k) => (next[k] = k === "overview" ? true : false))
    setOpenKeys(next)
    save(next)
  }, [openKeys, save])

  const toggleSingle = useCallback(
    (key: SectionKey) => {
      const next = { ...openKeys, [key]: !openKeys[key] }
      setOpenKeys(next)
      save(next)
    },
    [openKeys, save]
  )

  if (!mounted) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span className="px-2 py-0.5 rounded bg-muted border text-[10px] uppercase tracking-wider font-medium">Chargement…</span>
        </div>
        {allKeys.map((k) => (
          <section key={k} className="border rounded-xl bg-card shadow-sm overflow-hidden">
            <div className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground bg-muted/30">
              <span className="flex-1 text-left">{t[k as keyof typeof t] ?? k}</span>
            </div>
          </section>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={expandAll}
          className="text-xs px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          aria-label={t.expandAll}
        >
          <Eye className="size-3" />
          {t.expandAll}
        </button>
        <button
          onClick={collapseAll}
          className="text-xs px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          aria-label={t.collapseAll}
        >
          <EyeOff className="size-3" />
          {t.collapseAll}
        </button>
      </div>

      <DashboardSection
        title={t.overview}
        icon={BarChart3}
        defaultOpen={true}
        storageKey={STORAGE_KEY}
        count={stats ? stats.abonnes ?? 0 : undefined}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CompactStat label="Abonnés" value={stats?.abonnes ?? 0} color="text-navy" />
          <CompactStat label="Vendeurs" value={stats?.vendeurs ?? 0} color="text-success" />
          <CompactStat label="Points" value={stats?.pointsDeVente ?? 0} color="text-warning" />
          <CompactStat label="Dispo actives" value={stats?.disponibilitesActives ?? 0} color="text-info" />
          <CompactStat label="Bouteilles" value={stats?.bouteillesDisponibles ?? 0} color="text-navy" />
          <CompactStat label="Utilisateurs" value={stats?.utilisateurs ?? 0} color="text-info" />
        </div>
        <div className="mt-4">{recentActivity}</div>
      </DashboardSection>

      <DashboardSection
        title={t.users}
        icon={Users}
        storageKey={STORAGE_KEY}
        count={stats ? stats.abonnes : undefined}
      >
        <QuickLinkGrid links={[
          { label: "Utilisateurs", href: "/admin/users", icon: Users },
          { label: "Vendeurs", href: "/admin/vendeurs", icon: Store },
          { label: "Collaborateurs", href: "/admin/collaborateurs", icon: Users },
        ]} />
      </DashboardSection>

      <DashboardSection
        title={t.points}
        icon={MapPin}
        storageKey={STORAGE_KEY}
        count={stats ? stats.pointsDeVente : undefined}
      >
        <QuickLinkGrid links={[
          { label: "Points de vente", href: "/admin/points-de-vente", icon: MapPin },
          { label: "Disponibilités", href: "/admin/disponibilites", icon: Activity },
        ]} />
      </DashboardSection>

      <DashboardSection title={t.marketing} icon={Megaphone} storageKey={STORAGE_KEY}>
        <QuickLinkGrid links={[{ label: "Marketing et publicité", href: "/admin/marketing", icon: Megaphone }]} />
      </DashboardSection>

      <DashboardSection title={t.analytics} icon={Activity} storageKey={STORAGE_KEY}>
        <QuickLinkGrid links={[{ label: "Statistiques", href: "/admin/statistiques", icon: BarChart3 }]} />
      </DashboardSection>

      <DashboardSection title={t.settings} icon={Settings} storageKey={STORAGE_KEY}>
        <QuickLinkGrid links={[
          { label: "Paramètres", href: "/admin/parametres", icon: Settings },
          { label: "Mon profil", href: "/admin/profil", icon: Users },
        ]} />
      </DashboardSection>
    </div>
  )
}

function CompactStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background p-3 shadow-sm">
      <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function QuickLinkGrid({ links }: { links: Array<{ label: string; href: string; icon: React.ComponentType<{ className?: string }> }> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {links.map((l) => {
        const Icon = l.icon
        return (
          <a
            key={l.href}
            href={l.href}
            className="flex items-center gap-2 rounded-md border bg-background px-3 py-2.5 text-sm font-medium text-foreground hover:text-primary hover:border-primary/30 transition-colors shadow-sm"
          >
            <Icon className="size-4 text-muted-foreground shrink-0" />
            <span className="truncate">{l.label}</span>
          </a>
        )
      })}
    </div>
  )
}
