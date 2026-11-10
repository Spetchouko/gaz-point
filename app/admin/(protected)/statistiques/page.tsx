import { Metadata } from "next"
import { requireAdmin } from "@/lib/session"
import { resolveAnalyticsRange, ANALYTICS_PERIOD_KEYS, type AnalyticsPeriodKey } from "@/lib/publicite-analytics"
import { AnalyticsDashboardClient } from "@/app/_components/analytics-dashboard-client"

export const metadata: Metadata = {
  title: { absolute: "Analyse des données | Administration GAZ POINT" },
}

type SearchParams = Promise<{
  period?: string
  from?: string
  to?: string
}>

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  await requireAdmin()

  const params = await searchParams
  const periodRaw = (params.period ?? "30") as string
  const period =
    ANALYTICS_PERIOD_KEYS.includes(periodRaw as AnalyticsPeriodKey)
      ? (periodRaw as AnalyticsPeriodKey)
      : "30"

  const range = resolveAnalyticsRange(
    period,
    period === "custom" ? params.from : undefined,
    period === "custom" ? params.to : undefined
  )

  return (
    <div className="space-y-8">
      <AnalyticsDashboardClient
        initialPeriod={period}
        initialFrom={range.fromInput}
        initialTo={range.toInput}
      />
    </div>
  )
}
