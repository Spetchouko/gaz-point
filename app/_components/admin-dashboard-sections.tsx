"use client"

import Link from "next/link"
import {
  BarChart3,
  Users,
  Store,
  MapPin,
  Megaphone,
  Activity,
  Settings,
  ChevronRight,
  UserPlus,
  Cylinder,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AdminRecentActivity } from "./admin-recent-activity"

type Stat = {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const statItems: Stat[] = [
  {
    label: "Abonnés",
    value: 0,
    icon: UserPlus,
    color: "bg-success/10 text-success border-success/20",
  },
  {
    label: "Vendeurs",
    value: 0,
    icon: Store,
    color: "bg-primary/10 text-primary border-primary/20",
  },
  {
    label: "Points de vente",
    value: 0,
    icon: MapPin,
    color: "bg-warning/10 text-warning border-warning/20",
  },
  {
    label: "Dispo. actives",
    value: 0,
    icon: Cylinder,
    color: "bg-info/10 text-info border-info/20",
  },
  {
    label: "Bouteilles",
    value: 0,
    icon: BarChart3,
    color: "bg-navy/10 text-navy border-navy/20",
  },
  {
    label: "Utilisateurs",
    value: 0,
    icon: Users,
    color: "bg-info/10 text-info border-info/20",
  },
]

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
  const values: Stat[] = [
    { ...statItems[0], value: stats?.abonnes ?? 0 },
    { ...statItems[1], value: stats?.vendeurs ?? 0 },
    { ...statItems[2], value: stats?.pointsDeVente ?? 0 },
    { ...statItems[3], value: stats?.disponibilitesActives ?? 0 },
    { ...statItems[4], value: stats?.bouteillesDisponibles ?? 0 },
    { ...statItems[5], value: stats?.utilisateurs ?? 0 },
  ]

  const quickLinks = [
    { label: "Utilisateurs", href: "/admin/users", icon: Users },
    { label: "Vendeurs", href: "/admin/vendeurs", icon: Store },
    { label: "Points de vente", href: "/admin/points-de-vente", icon: MapPin },
    { label: "Disponibilités", href: "/admin/disponibilites", icon: Cylinder },
    { label: "Publicités", href: "/admin/marketing", icon: Megaphone },
    { label: "Avis & témoignages", href: "/admin/avis", icon: Shield },
    { label: "Statistiques", href: "/admin/statistiques", icon: Activity },
    { label: "Paramètres", href: "/admin/parametres", icon: Settings },
  ]

  return (
    <div className="space-y-6">
      {/* Cartes statistiques — ligne pleine largeur */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {values.map((s) => {
          const Icon = s.icon
          return (
            <a
              key={s.label}
              href={`#${s.label.toLowerCase().replace(/\s/g, "-")}`}
              className="block rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    {String(s.value).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                  </p>
                </div>
                <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl border", s.color)}>
                  <Icon className="size-5" aria-hidden />
                </div>
              </div>
            </a>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Activité récente — occupe les 2/3 sur grand écran */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Activité récente
            </h2>
          </div>
          {recentActivity ?? (
            <AdminRecentActivity activities={[]} canDelete={false} />
          )}
        </div>

        {/* Liens rapides — colonne latérale de 1/3 */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Accès rapides
            </h2>
          </div>
          <div className="space-y-2 rounded-lg border bg-card p-4">
            {quickLinks.map((l) => {
              const Icon = l.icon
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{l.label}</span>
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
