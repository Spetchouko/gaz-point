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
import { Card, CardContent } from "@/components/ui/card"
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
    color: "bg-violet-500/10 text-violet-600 border-violet-500/30",
    href: "/admin/users",
  },
  {
    key: "vendeurs",
    label: "Vendeurs",
    icon: UserCheck,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30",
    href: "/admin/vendeurs",
  },
  {
    key: "utilisateurs",
    label: "Utilisateurs",
    icon: Users,
    color: "bg-sky-500/10 text-sky-600 border-sky-500/30",
    href: "/admin/users",
  },
  {
    key: "pointsDeVente",
    label: "Points de vente",
    icon: MapPin,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    href: "/admin/points-de-vente",
  },
  {
    key: "disponibilitesActives",
    label: "Disponibilités actives",
    icon: Activity,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    href: "/admin/disponibilites",
  },
  {
    key: "bouteillesDisponibles",
    label: "Bouteilles disponibles",
    icon: Cylinder,
    color: "bg-purple-500/10 text-purple-600 border-purple-500/30",
    href: "/admin/disponibilites",
  },
  {
    key: "totalPageviews",
    label: "Pages vues",
    icon: Monitor,
    color: "bg-orange-500/10 text-orange-600 border-orange-500/30",
    href: "/admin/statistiques",
  },
  {
    key: "uniquePageviews",
    label: "Pages uniques",
    icon: Globe,
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    href: "/admin/statistiques",
  },
  {
    key: "totalSessions",
    label: "Sessions",
    icon: Users,
    color: "bg-teal-500/10 text-teal-600 border-teal-500/30",
    href: "/admin/statistiques",
  },
  {
    key: "avgSessionDuration",
    label: "Durée session",
    icon: AlarmClock,
    color: "bg-green-500/10 text-green-600 border-green-500/30",
    href: "/admin/statistiques",
  },
  {
    key: "bounceRate",
    label: "Taux rebond",
    icon: AlertCircle,
    color: "bg-red-500/10 text-red-600 border-red-500/30",
    href: "/admin/statistiques",
  },
  {
    key: "newVisitors7d",
    label: "Nouveaux (7j)",
    icon: UserPlus,
    color: "bg-pink-500/10 text-pink-600 border-pink-500/30",
    href: "/admin/statistiques",
  },
  {
    key: "newVisitors30d",
    label: "Nouveaux (30j)",
    icon: TrendingUp,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    href: "/admin/statistiques",
  },
  {
    key: "newVisitorsToday",
    label: "Nouveaux (auj.)",
    icon: Calendar,
    color: "bg-red-500/10 text-red-600 border-red-500/30",
    href: "/admin/statistiques",
  },
  {
    key: "mobileUsers",
    label: "Mobile",
    icon: Smartphone,
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
    href: "/admin/statistiques",
  },
  {
    key: "desktopUsers",
    label: "Ordinateur",
    icon: Laptop,
    color: "bg-gray-500/10 text-gray-600 border-gray-500/30",
    href: "/admin/statistiques",
  },
  {
    key: "tabletUsers",
    label: "Tablette",
    icon: Tablet,
    color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
    href: "/admin/statistiques",
  },
  {
    key: "directTraffic",
    label: "Accès direct",
    icon: Fingerprint,
    color: "bg-neutral-500/10 text-neutral-600 border-neutral-500/30",
    href: "/admin/statistiques",
  },
  {
    key: "searchTraffic",
    label: "Moteurs recherche",
    icon: Search,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30",
    href: "/admin/statistiques",
  },
  {
    key: "socialTraffic",
    label: "Réseaux sociaux",
    icon: Share2,
    color: "bg-pink-500/10 text-pink-600 border-pink-500/30",
    href: "/admin/statistiques",
  },
  {
    key: "referralTraffic",
    label: "Sites référents",
    icon: LinkIcon,
    color: "bg-purple-500/10 text-purple-600 border-purple-500/30",
    href: "/admin/statistiques",
  },
  {
    key: "campaignTraffic",
    label: "Campagnes",
    icon: BarChart2,
    color: "bg-orange-500/10 text-orange-600 border-orange-500/30",
    href: "/admin/statistiques",
  },
] as const

export function AdminStatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map((card) => {
        const value = stats[card.key as keyof Stats] ?? 0
        const Icon = card.icon
        return (
          <Link
            key={card.key}
            href={card.href}
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Card className="h-full border transition-shadow hover:shadow-md hover:border-primary/40">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-3xl font-bold tracking-tight mt-1">
                      {value.toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex size-12 items-center justify-center rounded-xl border",
                      card.color
                    )}
                  >
                    <Icon className="size-6" aria-hidden={true} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}