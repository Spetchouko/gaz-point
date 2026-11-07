"use client"

import Link from "next/link"
import {
  Users,
  MapPin,
  Activity,
  Cylinder,
  UserCheck,
  BadgeCheck,
  Tablet,
  Laptop,
  Smartphone,
  Monitor,
  AlarmClock,
  TrendingUp,
  Calendar,
  UserPlus,
  AlertCircle,
  Link as LinkIcon,
  Globe,
  Fingerprint,
  Search,
  Share2,
  BarChart2,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Stats = {
  abonnes?: number
  vendeurs?: number
  utilisateurs?: number
  pointsDeVente?: number
  disponibilitesActives?: number
  bouteillesDisponibles?: number
  totalPageviews?: number
  uniquePageviews?: number
  totalSessions?: number
  avgSessionDuration?: number
  bounceRate?: number
  newVisitors7d?: number
  newVisitors30d?: number
  newVisitorsToday?: number
  mobileUsers?: number
  desktopUsers?: number
  tabletUsers?: number
  directTraffic?: number
  searchTraffic?: number
  socialTraffic?: number
  referralTraffic?: number
  campaignTraffic?: number
  trafficPercentages?: {
    direct?: number
    search?: number
    social?: number
    referral?: number
    campaign?: number
  }
  mostVisitedPages?: Array<{ path: string; views: number }>
  topExitPages?: Array<{ path: string; exits: number }>
}

const statCards = [
  {
    key: "abonnes",
    label: "Abonnés",
    icon: BadgeCheck,
    color: "bg-navy/10 text-navy border-navy/20",
    href: "/admin/users",
  },
  {
    key: "vendeurs",
    label: "Vendeurs",
    icon: UserCheck,
    color: "bg-success/10 text-success border-success/20",
    href: "/admin/vendeurs",
  },
  {
    key: "utilisateurs",
    label: "Utilisateurs",
    icon: Users,
    color: "bg-info/10 text-info border-info/30",
    href: "/admin/users",
  },
  {
    key: "pointsDeVente",
    label: "Points de vente",
    icon: MapPin,
    color: "bg-warning/10 text-warning border-warning/20",
    href: "/admin/points-de-vente",
  },
  {
    key: "disponibilitesActives",
    label: "Disponibilités actives",
    icon: Activity,
    color: "bg-info/10 text-info border-info/20",
    href: "/admin/disponibilites",
  },
  {
    key: "bouteillesDisponibles",
    label: "Bouteilles disponibles",
    icon: Cylinder,
    color: "bg-navy/10 text-navy border-navy/20",
    href: "/admin/disponibilites",
  },
  {
    key: "totalPageviews",
    label: "Pages vues",
    icon: Monitor,
    color: "bg-warning/10 text-warning border-warning/20",
    href: "/admin/statistiques",
  },
  {
    key: "uniquePageviews",
    label: "Pages uniques",
    icon: Globe,
    color: "bg-warning/10 text-warning border-warning/20",
    href: "/admin/statistiques",
  },
  {
    key: "totalSessions",
    label: "Sessions",
    icon: Users,
    color: "bg-info/10 text-info border-info/20",
    href: "/admin/statistiques",
  },
  {
    key: "avgSessionDuration",
    label: "Durée session",
    icon: AlarmClock,
    color: "bg-success/10 text-success border-success/20",
    href: "/admin/statistiques",
  },
  {
    key: "bounceRate",
    label: "Taux rebond",
    icon: AlertCircle,
    color: "bg-destructive/10 text-destructive border-destructive/20",
    href: "/admin/statistiques",
  },
  {
    key: "newVisitors7d",
    label: "Nouveaux (7j)",
    icon: UserPlus,
    color: "bg-navy/10 text-navy border-navy/20",
    href: "/admin/statistiques",
  },
  {
    key: "newVisitors30d",
    label: "Nouveaux (30j)",
    icon: TrendingUp,
    color: "bg-warning/10 text-warning border-warning/20",
    href: "/admin/statistiques",
  },
  {
    key: "newVisitorsToday",
    label: "Nouveaux (auj.)",
    icon: Calendar,
    color: "bg-destructive/10 text-destructive border-destructive/20",
    href: "/admin/statistiques",
  },
  {
    key: "mobileUsers",
    label: "Mobile",
    icon: Smartphone,
    color: "bg-navy/10 text-navy border-navy/20",
    href: "/admin/statistiques",
  },
  {
    key: "desktopUsers",
    label: "Ordinateur",
    icon: Laptop,
    color: "bg-muted/10 text-muted-foreground border-border",
    href: "/admin/statistiques",
  },
  {
    key: "tabletUsers",
    label: "Tablette",
    icon: Tablet,
    color: "bg-info/10 text-info border-info/20",
    href: "/admin/statistiques",
  },
  {
    key: "directTraffic",
    label: "Accès direct",
    icon: Fingerprint,
    color: "bg-muted/10 text-muted-foreground border-border",
    href: "/admin/statistiques",
  },
  {
    key: "searchTraffic",
    label: "Moteurs recherche",
    icon: Search,
    color: "bg-success/10 text-success border-success/20",
    href: "/admin/statistiques",
  },
  {
    key: "socialTraffic",
    label: "Réseaux sociaux",
    icon: Share2,
    color: "bg-navy/10 text-navy border-navy/20",
    href: "/admin/statistiques",
  },
  {
    key: "referralTraffic",
    label: "Sites référents",
    icon: LinkIcon,
    color: "bg-navy/10 text-navy border-navy/20",
    href: "/admin/statistiques",
  },
  {
    key: "campaignTraffic",
    label: "Campagnes",
    icon: BarChart2,
    color: "bg-warning/10 text-warning border-warning/20",
    href: "/admin/statistiques",
  },
] as const

export function AdminStatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {statCards.map((card) => {
        const value = stats[card.key as keyof Stats] ?? 0
        const Icon = card.icon
        return (
          <Link
            key={card.key}
            href={card.href}
            className="block rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  {card.label}
                </p>
                <p className="text-xl font-bold tracking-tight text-foreground">
                  {value.toLocaleString("fr-FR")}
                </p>
              </div>
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                  card.color
                )}
              >
                <Icon className="size-5" aria-hidden={true} />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}