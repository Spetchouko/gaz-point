"use client"

import type { ReactNode } from "react"
import { AlertCircle, RefreshCw, type LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function VendorPageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function VendorSectionCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <Card className={cn("overflow-hidden border-border shadow-sm", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/70 px-4 py-3">
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </CardHeader>
      <CardContent className={cn("p-4", contentClassName)}>{children}</CardContent>
    </Card>
  )
}

export function VendorEmptyState({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon: LucideIcon
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-md text-xs text-muted-foreground">{description}</p>
      {actions && <div className="mt-3 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  )
}

export function VendorErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void | Promise<void>
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2 text-sm text-destructive">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{message}</span>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={() => void onRetry()}>
          <RefreshCw className="size-3.5" aria-hidden />
          Réessayer
        </Button>
      )}
    </div>
  )
}

export function VendorNotice({
  children,
  tone = "info",
}: {
  children: ReactNode
  tone?: "info" | "success" | "error"
}) {
  const toneClass = {
    info: "border-primary/20 bg-primary/5 text-primary",
    success: "border-success/25 bg-success/5 text-success",
    error: "border-destructive/25 bg-destructive/5 text-destructive",
  }[tone]

  return (
    <div className={cn("rounded-lg border px-3 py-2 text-xs", toneClass)}>
      {children}
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  disponible: "bg-success/10 text-success border-success/20",
  confirmed: "bg-success/10 text-success border-success/20",
  collected: "bg-secondary text-secondary-foreground",
  terminee: "bg-secondary text-secondary-foreground",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  expired: "bg-destructive/10 text-destructive border-destructive/20",
  indisponible: "bg-muted text-muted-foreground",
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  en_attente: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  a_confirmer: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  hidden: "bg-muted text-muted-foreground",
}

export function VendorStatusBadge({
  status,
  label,
}: {
  status: string
  label?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border", STATUS_STYLES[status] ?? "bg-muted text-muted-foreground")}
    >
      {label ?? status}
    </Badge>
  )
}

export function VendorLoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Chargement">
      <div className="h-7 w-56 animate-pulse rounded bg-muted" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-lg border border-border bg-muted/40" />
        ))}
      </div>
      <div className="space-y-2 rounded-lg border border-border p-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded bg-muted/60" />
        ))}
      </div>
    </div>
  )
}
