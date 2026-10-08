"use client"

import { UserPlus, Store, MapPin, Package, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/gaz"
import { cn } from "@/lib/utils"

type ActivityType = "user" | "vendor" | "point" | "dispo"

type Activity = {
  type: ActivityType
  title: string
  description: string
  meta: string
  date: Date | string
}

const typeConfig: Record<ActivityType, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  user: { icon: UserPlus, color: "bg-sky-500/10 text-sky-600", label: "Utilisateur" },
  vendor: { icon: Store, color: "bg-emerald-500/10 text-emerald-600", label: "Vendeur" },
  point: { icon: MapPin, color: "bg-amber-500/10 text-amber-600", label: "Point de vente" },
  dispo: { icon: Package, color: "bg-blue-500/10 text-blue-600", label: "Disponibilité" },
}

export function AdminRecentActivity({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucune activité récente
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-0">
        <div className="divide-y">
          {activities.map((activity, index) => {
            const config = typeConfig[activity.type]
            const Icon = config.icon
            return (
              <div
                key={index}
                className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    config.color
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{activity.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.meta}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="outline" className={config.color.replace("bg-", "bg-").replace("text-", "text-").replace("border-", "border-")}>
                    {config.label}
                  </Badge>
                  <time className="text-xs text-muted-foreground">
                    {formatDateTime(activity.date)}
                  </time>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}