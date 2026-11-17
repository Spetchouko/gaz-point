"use client"

import Link from "next/link"
import {
  UserPlus,
  Store,
  Clock,
  Mail,
  CheckCircle2,
  AlertCircle,
  UserCog,
  ArrowRight,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/gaz"

interface ActivityItem {
  id: string
  type:
    | "signup"
    | "point_created"
    | "disponibilite_published"
    | "reservation_new"
    | "reservation_confirmed"
    | "reservation_cancelled"
    | "account_modified"
  title: string
  subtitle: string
  userName: string
  userEmail?: string
  createdAt: string
  link?: string
}

const ACTIVITY_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  signup: { icon: UserPlus, color: "text-primary" },
  point_created: { icon: Store, color: "text-orange-600" },
  disponibilite_published: { icon: Clock, color: "text-purple-600" },
  reservation_new: { icon: Mail, color: "text-blue-600" },
  reservation_confirmed: { icon: CheckCircle2, color: "text-emerald-600" },
  reservation_cancelled: { icon: AlertCircle, color: "text-red-600" },
  account_modified: { icon: UserCog, color: "text-muted-foreground" },
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const IconMap = ACTIVITY_CONFIG

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="flex items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="size-4 text-primary" />
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {activities.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm">Aucune activité récente enregistrée.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {activities.map((activity) => {
              const { icon: Icon, color } =
                IconMap[activity.type] ?? IconMap.account_modified
              return (
                <Link
                  key={activity.id}
                  href={activity.link ?? "#"}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 text-sm transition-colors hover:bg-muted/50",
                    activity.link ? "group" : "",
                  )}
                >
                  <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", color)}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground leading-tight">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.subtitle}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(activity.createdAt)}
                    </span>
                    {activity.link && (
                      <ArrowRight className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
