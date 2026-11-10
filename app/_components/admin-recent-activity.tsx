"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ChevronDown, ChevronUp, ClipboardList, Cylinder, MapPin, Store, Trash2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { deleteActivity, deleteActivities } from "@/app/admin/actions"
import { formatDateTime } from "@/lib/gaz"
import { cn } from "@/lib/utils"

export type ActivityType = "user" | "vendor" | "point" | "dispo" | "admin"

export type Activity = {
  id: string
  type: ActivityType
  title: string
  description: string
  meta: string
  date: Date | string
  deletable: boolean
  /** Route de la fiche associée (utilisateur, vendeur, point…). */
  href?: string
}

type FilterKey = "all" | ActivityType

const typeConfig: Record<
  ActivityType,
  { icon: React.ComponentType<{ className?: string }>; color: string; label: string }
> = {
  user: { icon: UserPlus, color: "bg-info/10 text-info border-info/30", label: "Utilisateur" },
  vendor: { icon: Store, color: "bg-success/10 text-success border-success/20", label: "Vendeur" },
  point: { icon: MapPin, color: "bg-warning/10 text-warning border-warning/20", label: "Point de vente" },
  dispo: { icon: Cylinder, color: "bg-info/10 text-info border-info/20", label: "Disponibilité" },
  admin: { icon: ClipboardList, color: "bg-navy/10 text-navy border-navy/20", label: "Administration" },
}

const filterOptions: { value: FilterKey; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "user", label: "Utilisateurs" },
  { value: "vendor", label: "Vendeurs" },
  { value: "point", label: "Points de vente" },
  { value: "dispo", label: "Disponibilités" },
  { value: "admin", label: "Administration" },
]

export function AdminRecentActivity({
  activities,
  canDelete,
  initialLimit = 5,
}: {
  activities: Activity[]
  canDelete: boolean
  /** Nombre maximal d'événements affichés lorsque la liste est déroulée initialement (au départ elle reste réduite). */
  initialLimit?: number
}) {
  const [filter, setFilter] = useState<FilterKey>("all")
  const [expanded, setExpanded] = useState(false)
  const [, startTransition] = useTransition()

  const filtered =
    filter === "all" ? activities : activities.filter((a) => a.type === filter)
  const visible = expanded ? filtered : filtered.slice(0, initialLimit)
  const hiddenCount = Math.max(0, filtered.length - visible.length)
  const deletable = filtered.filter((a) => a.deletable && canDelete)

  const handleDelete = (activityId: string) => {
    const formData = new FormData()
    formData.set("activityId", activityId)
    startTransition(async () => {
      await deleteActivity(null, formData)
    })
  }

  const handleClearAll = () => {
    const ids = activities.filter((a) => a.deletable).map((a) => a.id)
    if (ids.length === 0) return
    const formData = new FormData()
    formData.set("activityIds", ids.join(","))
    startTransition(async () => {
      await deleteActivities(null, formData)
    })
  }

  return (
    <Card>
      <CardContent className="pt-0 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed">
          <div className="w-full sm:w-56 py-2">
            <Select value={filter} onValueChange={(v) => setFilter((v ?? "all") as FilterKey)}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {canDelete && deletable.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
              onClick={handleClearAll}
            >
              <Trash2 className="size-3.5" />
              Effacer les actions admin ({deletable.length})
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Activités récentes
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-primary"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                Réduire les activités
                <ChevronUp className="size-3.5" aria-hidden />
              </>
            ) : (
              <>
                Voir toutes les activités
                <ChevronDown className="size-3.5" aria-hidden />
              </>
            )}
          </Button>
        </div>

        {visible.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">Aucune activité récente</p>
        ) : (
          <div
            className={cn(
              "divide-y divide-border overflow-y-auto rounded-md",
              expanded ? "max-h-96" : "max-h-52"
            )}
          >
            {visible.map((activity) => {
              const config = typeConfig[activity.type]
              const Icon = config.icon
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                      config.color
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </div>
                  {activity.href ? (
                    <Link
                      href={activity.href}
                      className="group flex-1 min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <p className="font-medium text-foreground leading-snug transition-colors group-hover:text-primary">
                        {activity.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground truncate">
                        {activity.description}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">{activity.meta}</p>
                    </Link>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground leading-snug">{activity.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground truncate">
                        {activity.description}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">{activity.meta}</p>
                    </div>
                  )}
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-auto pl-2">
                    <Badge variant="outline" className={config.color}>
                      {config.label}
                    </Badge>
                    <time className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDateTime(activity.date)}
                    </time>
                  </div>
                  {activity.deletable && canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(activity.id)}
                      aria-label={`Supprimer l'activité ${activity.title}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!expanded && hiddenCount > 0 && (
          <button
            type="button"
            className="w-full rounded-md py-1.5 text-center text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary"
            onClick={() => setExpanded(true)}
          >
            … {hiddenCount} autre{hiddenCount > 1 ? "s" : ""} activité{hiddenCount > 1 ? "s" : ""} — Voir toutes les activités
          </button>
        )}
      </CardContent>
    </Card>
  )
}
