"use client"

import Link from "next/link"
import {
  Users,
  MapPin,
  Activity,
  Cylinder,
  UserCheck,
  BadgeCheck,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Stats = {
  abonnes: number
  vendeurs: number
  utilisateurs: number
  pointsDeVente: number
  disponibilitesActives: number
  bouteillesDisponibles: number
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
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
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
] as const

export function AdminStatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map((card) => {
        const value = stats[card.key as keyof Stats]
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
                    <Icon className="size-6" aria-hidden />
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
