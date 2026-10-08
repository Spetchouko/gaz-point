"use client"

import {
  Users,
  Store,
  Package,
  Truck,
  UserCheck,
  MapPin,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Stats = {
  totalUsers: number
  totalVendors: number
  activeVendors: number
  totalPoints: number
  activeDispos: number
  totalBottles: number
}

const statCards = [
  {
    key: "totalUsers",
    label: "Utilisateurs",
    icon: Users,
    color: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  },
  {
    key: "totalVendors",
    label: "Vendeurs",
    icon: Store,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  },
  {
    key: "activeVendors",
    label: "Vendeurs actifs",
    icon: UserCheck,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  },
  {
    key: "totalPoints",
    label: "Points de vente",
    icon: MapPin,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  },
  {
    key: "activeDispos",
    label: "Disponibilités actives",
    icon: Package,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  },
  {
    key: "totalBottles",
    label: "Bouteilles disponibles",
    icon: Truck,
    color: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  },
] as const

export function AdminStatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map((card) => {
        const value = stats[card.key as keyof Stats]
        const Icon = card.icon
        return (
          <Card key={card.key} className="border transition-shadow hover:shadow-md">
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
        )
      })}
    </div>
  )
}