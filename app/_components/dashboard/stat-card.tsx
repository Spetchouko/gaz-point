"use client"

import Link from "next/link"
import { ArrowRight, ChevronUp, ChevronDown, Minus } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { AnimatedCounter } from "@/app/_components/dashboard/animated-counter"
import { cn } from "@/lib/utils"

interface StatCardProps {
  id: string
  title: string
  label: string
  value: number
  change: number | null
  trend: "up" | "down" | "neutral" | null
  trendLabel: string
  link: string
  icon: React.ElementType
}

const TREND_ICONS: Record<"up" | "down" | "neutral" | null, React.ElementType> = {
  up: ChevronUp,
  down: ChevronDown,
  neutral: Minus,
  null: Minus,
}

export function StatCard({
  id,
  title,
  label,
  value,
  change,
  trend,
  trendLabel,
  link,
  icon: Icon,
}: StatCardProps) {
  const hasChange = change !== null && change !== undefined
  const TrendIcon = TREND_ICONS[trend ?? "null"]

  return (
    <Card
      key={id}
      className={cn(
        "border border-border shadow-sm hover:shadow-md transition-shadow duration-300",
        "group",
      )}
    >
      <CardContent className="pt-5 pb-5 sm:pb-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <AnimatedCounter value={value} className="text-2xl sm:text-3xl font-bold text-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-primary group-hover:bg-primary/10 transition-colors">
            <Icon className="size-5" />
          </div>
        </div>

        {hasChange && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <TrendIcon className="size-3.5 shrink-0" />
            <span
              className={cn(
                "font-medium",
                trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-muted-foreground",
              )}
            >
              {trend === "neutral"
                ? "Stable"
                : `${change > 0 ? "+" : ""}${change}%`}
            </span>
            <span className="text-muted-foreground">
              vs période précédente ({trendLabel})
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 pb-0">
        <Link
          href={link}
          className="w-full text-xs font-medium text-primary hover:underline group-hover:text-primary/80 transition-colors"
        >
          Voir les détails <ArrowRight className="size-3.5 ml-1" />
        </Link>
      </CardFooter>
    </Card>
  )
}
