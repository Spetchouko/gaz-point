import { Metadata } from "next"
import { db } from "@/db"
import { user, pointDeVente, disponibilite, trafficEvent, publiciteEvent } from "@/db/schema"
import { count, eq, sql, and, gte, lt, sum, desc } from "drizzle-orm"
import { AdminStatsCards } from "@/app/_components/admin-stats-cards"
import { requireStaffModule } from "@/lib/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Store, Cylinder, MapPin, Phone, Laptop, Smartphone, Monitor } from "lucide-react"
import { AdminStatistiquesChartsWrapperV2 } from "@/app/_components/admin-statistiques-charts-wrapper-v2"
import { resolveAnalyticsRange, parseUserAgent, type AnalyticsRange } from "@/lib/publicite-analytics"

export const metadata: Metadata = {
  title: { absolute: "Statistiques | Administration GAZ POINT" },
}

function dayLabel(offsetFromToday: number): string {
  const d = new Date()
  d.setDate(d.getDate() - offsetFromToday)
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
}

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  await requireStaffModule("statistiques")

  const params = await searchParams
  const range = resolveAnalyticsRange(params.period, params.from, params.to)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // Helper function to get period boundaries
  function getPeriodBounds(period: string): { from: Date; to: Date } {
    const now = new Date()
    switch (period) {
      case "today":
        return { from: todayStart, to: now }
      case "7":
        return { from: sevenDaysAgo, to: now }
      case "30":
        return { from: thirtyDaysAgo, to: now }
      case "90":
        return { from: ninetyDaysAgo, to: now }
      case "custom":
        return { from: range.from, to: range.to }
      default:
        return { from: thirtyDaysAgo, to: now }
    }
  }

  const { from: periodFrom, to: periodTo } = getPeriodBounds(range.key)

  // ============================================================
  // 1. TRAFIC : visites / inscriptions / connexions par jour
  // ============================================================
  const trafficRows = await db
    .select({
      eventType: trafficEvent.eventType,
      createdAt: trafficEvent.createdAt,
      consented: trafficEvent.consented,
    })
    .from(trafficEvent)
    .where(and(gte(trafficEvent.createdAt, periodFrom), lt(trafficEvent.createdAt, periodTo)))

  const buckets: Record<string, { date: string; visits: number; signups: number; signins: number }> = {}
  const daysDiff = Math.ceil((periodTo.getTime() - periodFrom.getTime()) / (24 * 60 * 60 * 1000))
  const maxDays = Math.min(daysDiff, 90)

  for (let i = maxDays - 1; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dayStartTs = dayStart.getTime()
    buckets[dayStartTs] = { date: dayLabel(i), visits: 0, signups: 0, signins: 0 }
  }
  for (const row of trafficRows) {
    const dayTs = new Date(row.createdAt)
    const key = new Date(dayTs.getFullYear(), dayTs.getMonth(), dayTs.getDate()).getTime()
    const bucket = buckets[key]
    if (!bucket) continue
    if (row.eventType === "pageview") bucket.visits += 1
    else if (row.eventType === "signup") bucket.signups += 1
    else if (row.eventType === "signin") bucket.signins += 1
  }
  const trafficData = Object.values(buckets)

  // ============================================================
  // 2. ÉVOLUTION UTILISATEURS / VENDEURS
  // ============================================================
  const evolutionDays = Math.min(maxDays, 30)
  const evolutionData = await Promise.all(
    Array.from({ length: evolutionDays }, (_, i) => {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (evolutionDays - 1 - i))
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      return Promise.all([
        db.select({ count: count() }).from(user).where(and(gte(user.createdAt, dayStart), lt(user.createdAt, dayEnd))),
        db.select({ count: count() }).from(user).where(and(eq(user.role, "vendor"), gte(user.createdAt, dayStart), lt(user.createdAt, dayEnd))),
      ])
    })
  )
  const evolutionSeries = evolutionData.map(([users, vendors], i) => ({
    date: dayLabel(evolutionDays - 1 - i),
    users: users[0]?.count ?? 0,
    vendors: vendors[0]?.count ?? 0,
  }))

  // ============================================================
  // 3. COMPTER LES INDICATEURS DE TRAFIC
  // ============================================================
  const wherePeriod = and(
    gte(trafficEvent.createdAt, periodFrom),
    lt(trafficEvent.createdAt, periodTo)
  )

  const totalPageviewsResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(trafficEvent)
    .where(and(wherePeriod, eq(trafficEvent.eventType, "pageview")))
  const totalPageviews = totalPageviewsResult[0]?.count ?? 0

  const uniquePageviewsResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${trafficEvent.path})` })
    .from(trafficEvent)
    .where(and(wherePeriod, eq(trafficEvent.eventType, "pageview")))
  const uniquePageviews = uniquePageviewsResult[0]?.count ?? 0

  const totalSessionsResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${trafficEvent.userId})` })
    .from(trafficEvent)
    .where(and(wherePeriod, eq(trafficEvent.eventType, "pageview")))
  const totalSessions = totalSessionsResult[0]?.count ?? 0

  const sessionData = await db
    .select({
      userId: trafficEvent.userId,
      Min: sql<string>`MIN(${trafficEvent.createdAt})`,
      Max: sql<string>`MAX(${trafficEvent.createdAt})`,
    })
    .from(trafficEvent)
    .where(and(wherePeriod, eq(trafficEvent.eventType, "pageview")))
    .groupBy(trafficEvent.userId)

  let totalSessionTime = 0
  let totalSessionsCalculated = 0
  let bounceSessions = 0

  for (const row of sessionData) {
    const minDate = new Date(row.Min)
    const maxDate = new Date(row.Max)
    if (Number.isNaN(minDate.getTime()) || Number.isNaN(maxDate.getTime())) continue
    const duration = maxDate.getTime() - minDate.getTime()
    totalSessionTime += duration
    totalSessionsCalculated += 1
    if (duration <= 1000) {
      bounceSessions += 1
    }
  }

  const avgSessionDurationMs = totalSessionsCalculated > 0 ? totalSessionTime / totalSessionsCalculated : 0
  const avgSessionDuration = Math.round(avgSessionDurationMs / 1000 / 60)
  const bounceRate = totalSessionsCalculated > 0 ? (bounceSessions / totalSessionsCalculated) * 100 : 0

  const newVisitorsTodayResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${trafficEvent.userId})` })
    .from(trafficEvent)
    .where(and(gte(trafficEvent.createdAt, todayStart), lt(trafficEvent.createdAt, now), eq(trafficEvent.eventType, "pageview")))
  const newVisitorsToday = newVisitorsTodayResult[0]?.count ?? 0

  const newVisitors7dResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${trafficEvent.userId})` })
    .from(trafficEvent)
    .where(and(gte(trafficEvent.createdAt, sevenDaysAgo), lt(trafficEvent.createdAt, now), eq(trafficEvent.eventType, "pageview")))
  const newVisitors7d = newVisitors7dResult[0]?.count ?? 0

  const newVisitors30dResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${trafficEvent.userId})` })
    .from(trafficEvent)
    .where(and(gte(trafficEvent.createdAt, thirtyDaysAgo), lt(trafficEvent.createdAt, now), eq(trafficEvent.eventType, "pageview")))
  const newVisitors30d = newVisitors30dResult[0]?.count ?? 0

  // ============================================================
  // 4. ANALYSE USER AGENT (Device, OS, Browser, Resolution)
  // ============================================================
  const uaRows = await db
    .select({ userAgent: trafficEvent.userAgent, screenWidth: trafficEvent.screenWidth, screenHeight: trafficEvent.screenHeight })
    .from(trafficEvent)
    .where(and(wherePeriod, eq(trafficEvent.eventType, "pageview")))
    .limit(5000)

  let mobileCount = 0
  let desktopCount = 0
  let tabletCount = 0
  const osCounts: Record<string, number> = {}
  const browserCounts: Record<string, number> = {}
  const resolutionCounts: Record<string, number> = {}

  for (const row of uaRows) {
    const ua = row.userAgent ?? ""
    const parsed = parseUserAgent(ua)

    if (parsed.device === "mobile") mobileCount++
    else if (parsed.device === "tablet") tabletCount++
    else desktopCount++

    if (parsed.os) osCounts[parsed.os] = (osCounts[parsed.os] ?? 0) + 1
    if (parsed.browser) browserCounts[parsed.browser] = (browserCounts[parsed.browser] ?? 0) + 1

    if (row.screenWidth && row.screenHeight) {
      const resKey = `${row.screenWidth}x${row.screenHeight}`
      resolutionCounts[resKey] = (resolutionCounts[resKey] ?? 0) + 1
    }
  }

  const osData = Object.entries(osCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count], i) => ({ name, count, color: ["hsl(142 70% 50%)", "hsl(220 95% 55%)", "hsl(217 91% 60%)", "hsl(350 85% 55%)", "hsl(268 82% 56%)", "hsl(30 90% 55%)"][i] }))

  const browserData = Object.entries(browserCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], i) => ({ name, count, color: ["hsl(217 91% 60%)", "hsl(220 95% 55%)", "hsl(25 95% 55%)", "hsl(200 95% 55%)", "hsl(300 70% 55%)"][i] }))

  const resolutionData = Object.entries(resolutionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count], i) => ({ name, count, color: ["hsl(142 70% 50%)", "hsl(217 91% 60%)", "hsl(268 82% 56%)", "hsl(350 85% 55%)", "hsl(30 90% 55%)", "hsl(180 70% 50%)"][i] }))

  // ============================================================
  // 5. SOURCES DE TRAFIC
  // ============================================================
  const sourceRows = await db
    .select({
      referrer: trafficEvent.referrer,
      utmSource: trafficEvent.utmSource,
      utmMedium: trafficEvent.utmMedium,
      utmCampaign: trafficEvent.utmCampaign,
    })
    .from(trafficEvent)
    .where(and(wherePeriod, eq(trafficEvent.eventType, "pageview")))
    .limit(5000)

  const SEARCH_HOSTS = ["google.", "bing.", "yahoo.", "duckduckgo.", "qwant.", "ecosia.", "yandex.", "baidu.", "startpage.", "search.brave."]
  const SOCIAL_HOSTS = ["facebook.", "fb.", "instagram.", "twitter.", "x.com", "t.co", "linkedin.", "youtube.", "youtu.be", "tiktok.", "snapchat.", "whatsapp.", "wa.me", "telegram.", "t.me", "pinterest.", "reddit.", "threads."]
  const CAMPAIGN_MEDIUMS = ["cpc", "ppc", "paid", "paidsearch", "display", "banner", "cpm", "ads", "ad", "sponsored", "email"]

  function referrerHost(referrer: string | null | undefined): string | null {
    if (!referrer) return null
    try { return new URL(referrer).hostname.toLowerCase() || null } catch { return null }
  }

  function matchesHost(host: string, patterns: string[]): boolean {
    return patterns.some((pattern) => host.includes(pattern))
  }

  function classifySource(input: { referrer?: string | null; utmSource?: string | null; utmMedium?: string | null; utmCampaign?: string | null }): "direct" | "search" | "social" | "referral" | "campaign" {
    const medium = (input.utmMedium ?? "").toLowerCase().trim()
    const source = (input.utmSource ?? "").toLowerCase().trim()
    const campaign = (input.utmCampaign ?? "").toLowerCase().trim()
    if (source || campaign || CAMPAIGN_MEDIUMS.includes(medium)) return "campaign"
    const host = referrerHost(input.referrer)
    if (!host) return "direct"
    if (matchesHost(host, SEARCH_HOSTS)) return "search"
    if (matchesHost(host, SOCIAL_HOSTS)) return "social"
    return "referral"
  }

  const sourceCategories = { direct: 0, search: 0, social: 0, referral: 0, campaign: 0 }
  for (const row of sourceRows) {
    const source = classifySource({ referrer: row.referrer, utmSource: row.utmSource, utmMedium: row.utmMedium, utmCampaign: row.utmCampaign })
    sourceCategories[source]++
  }

  const directTraffic = sourceCategories.direct
  const searchTraffic = sourceCategories.search
  const socialTraffic = sourceCategories.social
  const referralTraffic = sourceCategories.referral
  const campaignTraffic = sourceCategories.campaign
  const totalTraffic = directTraffic + searchTraffic + socialTraffic + referralTraffic + campaignTraffic
  const trafficPercentages = {
    direct: totalTraffic > 0 ? Math.round((directTraffic / totalTraffic) * 100) : 0,
    search: totalTraffic > 0 ? Math.round((searchTraffic / totalTraffic) * 100) : 0,
    social: totalTraffic > 0 ? Math.round((socialTraffic / totalTraffic) * 100) : 0,
    referral: totalTraffic > 0 ? Math.round((referralTraffic / totalTraffic) * 100) : 0,
    campaign: totalTraffic > 0 ? Math.round((campaignTraffic / totalTraffic) * 100) : 0,
  }

  // ============================================================
  // 6. PAGES LES PLUS CONSULTÉES + ENTRÉE/SORTIE
  // ============================================================
  const pageViewRows = await db
    .select({ path: trafficEvent.path, total: count() })
    .from(trafficEvent)
    .where(and(wherePeriod, eq(trafficEvent.eventType, "pageview")))
    .groupBy(trafficEvent.path)
    .orderBy(sql`count(*) desc`)
    .limit(20)

  const mostVisitedPages: Array<{ path: string; views: number }> = []
  for (const row of pageViewRows) {
    mostVisitedPages.push({ path: row.path ?? "/", views: Number(row.total) })
  }

  // Pages d'entrée (premières pages visitées par session)
  const entryRows = await db
    .select({ path: trafficEvent.path, total: count() })
    .from(trafficEvent)
    .where(and(wherePeriod, eq(trafficEvent.eventType, "pageview")))
    .groupBy(trafficEvent.path)
    .orderBy(sql`count(*) desc`)
    .limit(10)

  // Pages de sortie (dernières pages visitées par session) - approximation
  const sessionPathRows = await db
    .select({ userId: trafficEvent.userId, path: trafficEvent.path, createdAt: trafficEvent.createdAt })
    .from(trafficEvent)
    .where(and(wherePeriod, eq(trafficEvent.eventType, "pageview")))
    .orderBy(trafficEvent.userId, trafficEvent.createdAt)

  const exitPaths: Record<string, number> = {}
  let lastUser: string | null = null
  let lastPath: string | null = null

  for (const row of sessionPathRows) {
    if (row.userId !== lastUser && lastPath) {
      exitPaths[lastPath] = (exitPaths[lastPath] ?? 0) + 1
    }
    lastUser = row.userId ?? ""
    lastPath = row.path
  }
  if (lastPath) exitPaths[lastPath] = (exitPaths[lastPath] ?? 0) + 1

  const entryExitPages = mostVisitedPages.slice(0, 8).map((p) => ({
    name: p.path.split('/').pop() || p.path,
    entries: entryRows.find((e) => e.path === p.path)?.total ?? 0,
    exits: exitPaths[p.path] ?? 0,
  }))

  // ============================================================
  // 7. INDICATEURS EXISTANTS (utilisateurs, vendeurs, points, dispo)
  // ============================================================
  const totalUtilisateursResult = await db.select({ count: count() }).from(user)
  const totalVendeursResult = await db.select({ count: count() }).from(user).where(eq(user.role, "vendor"))
  const totalAbonnesResult = await db.select({ count: count() }).from(user).where(eq(user.role, "client"))
  const totalPointsResult = await db.select({ count: count() }).from(pointDeVente).where(eq(pointDeVente.isActive, true))

  const activeDisposResult = await db
    .select({ count: count() })
    .from(disponibilite)
    .where(and(eq(disponibilite.status, "disponible")))

  const totalBottlesResult = await db
    .select({ sum: sum(disponibilite.quantity) })
    .from(disponibilite)
    .where(and(eq(disponibilite.status, "disponible")))

  // Tendances
  const newUsersTodayResult = await db.select({ count: count() }).from(user).where(and(gte(user.createdAt, todayStart), lt(user.createdAt, now)))
  const newVendorsTodayResult = await db.select({ count: count() }).from(user).where(and(eq(user.role, "vendor"), gte(user.createdAt, todayStart), lt(user.createdAt, now)))
  const newPointsTodayResult = await db.select({ count: count() }).from(pointDeVente).where(and(gte(pointDeVente.createdAt, todayStart), lt(pointDeVente.createdAt, now)))
  const newDisposTodayResult = await db.select({ count: count() }).from(disponibilite).where(and(gte(disponibilite.createdAt, todayStart), lt(disponibilite.createdAt, now)))

  const newUsers7dResult = await db.select({ count: count() }).from(user).where(and(gte(user.createdAt, sevenDaysAgo), lt(user.createdAt, now)))
  const newVendors7dResult = await db.select({ count: count() }).from(user).where(and(eq(user.role, "vendor"), gte(user.createdAt, sevenDaysAgo), lt(user.createdAt, now)))
  const newPoints7dResult = await db.select({ count: count() }).from(pointDeVente).where(and(gte(pointDeVente.createdAt, sevenDaysAgo), lt(pointDeVente.createdAt, now)))
  const newDispos7dResult = await db.select({ count: count() }).from(disponibilite).where(and(gte(disponibilite.createdAt, sevenDaysAgo), lt(disponibilite.createdAt, now)))

  const newUsers30dResult = await db.select({ count: count() }).from(user).where(and(gte(user.createdAt, thirtyDaysAgo), lt(user.createdAt, now)))
  const newVendors30dResult = await db.select({ count: count() }).from(user).where(and(eq(user.role, "vendor"), gte(user.createdAt, thirtyDaysAgo), lt(user.createdAt, now)))
  const newPoints30dResult = await db.select({ count: count() }).from(pointDeVente).where(and(gte(pointDeVente.createdAt, thirtyDaysAgo), lt(pointDeVente.createdAt, now)))
  const newDispos30dResult = await db.select({ count: count() }).from(disponibilite).where(and(gte(disponibilite.createdAt, thirtyDaysAgo), lt(disponibilite.createdAt, now)))

  const stats = {
    abonnes: totalAbonnesResult[0]?.count ?? 0,
    vendeurs: totalVendeursResult[0]?.count ?? 0,
    utilisateurs: totalUtilisateursResult[0]?.count ?? 0,
    pointsDeVente: totalPointsResult[0]?.count ?? 0,
    disponibilitesActives: activeDisposResult[0]?.count ?? 0,
    bouteillesDisponibles: Number(totalBottlesResult[0]?.sum ?? 0),
    totalPageviews,
    uniquePageviews,
    totalSessions,
    avgSessionDuration,
    bounceRate: Math.round(bounceRate),
    newVisitors7d,
    newVisitors30d,
    newVisitorsToday,
    mobileUsers: mobileCount,
    desktopUsers: desktopCount,
    tabletUsers: tabletCount,
    directTraffic,
    searchTraffic,
    socialTraffic,
    referralTraffic,
    campaignTraffic,
    trafficPercentages,
    mostVisitedPages,
  }

  const trends = {
    today: { users: newUsersTodayResult[0]?.count ?? 0, vendors: newVendorsTodayResult[0]?.count ?? 0, points: newPointsTodayResult[0]?.count ?? 0, dispos: newDisposTodayResult[0]?.count ?? 0 },
    "7j": { users: newUsers7dResult[0]?.count ?? 0, vendors: newVendors7dResult[0]?.count ?? 0, points: newPoints7dResult[0]?.count ?? 0, dispos: newDispos7dResult[0]?.count ?? 0 },
    "30j": { users: newUsers30dResult[0]?.count ?? 0, vendors: newVendors30dResult[0]?.count ?? 0, points: newPoints30dResult[0]?.count ?? 0, dispos: newDispos30dResult[0]?.count ?? 0 },
  }

  const trendCards = [
    { key: "users", label: "Utilisateurs", icon: Users, color: "bg-sky-500/10 text-sky-600 border-sky-500/30" },
    { key: "vendors", label: "Vendeurs", icon: Store, color: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30" },
    { key: "points", label: "Points de vente", icon: MapPin, color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
    { key: "dispos", label: "Disponibilités", icon: Cylinder, color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  ] as const

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
          <p className="mt-2 text-muted-foreground">
            Indicateurs globaux, trafic anonyme et tendances de la plateforme
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            defaultValue={range.key}
            onChange={(e) => {
              const p = new URLSearchParams()
              p.set("period", e.target.value)
              if (e.target.value === "custom") {
                p.set("from", range.fromInput)
                p.set("to", range.toInput)
              }
              window.location.search = p.toString()
            }}
            className="h-9 rounded-lg border bg-background px-3 py-1.5 text-sm"
          >
            <option value="today">Aujourd'hui</option>
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
            <option value="custom">Période personnalisée</option>
          </select>
          {range.key === "custom" && (
            <>
              <input type="date" defaultValue={range.fromInput} onChange={(e) => { const p = new URLSearchParams(); p.set("period", "custom"); p.set("from", e.target.value); p.set("to", range.toInput); window.location.search = p.toString() }} className="h-9 rounded-lg border bg-background px-3 text-sm" />
              <span className="text-muted-foreground">→</span>
              <input type="date" defaultValue={range.toInput} onChange={(e) => { const p = new URLSearchParams(); p.set("period", "custom"); p.set("from", range.fromInput); p.set("to", e.target.value); window.location.search = p.toString() }} className="h-9 rounded-lg border bg-background px-3 text-sm" />
            </>
          )}
        </div>
      </header>

      <AdminStatsCards stats={stats} />

      <AdminStatistiquesChartsWrapperV2
        trafficData={trafficData}
        evolutionSeries={evolutionSeries}
        mobileCount={mobileCount}
        desktopCount={desktopCount}
        tabletCount={tabletCount}
        osData={osData}
        browserData={browserData}
        resolutionData={resolutionData}
        directTraffic={directTraffic}
        searchTraffic={searchTraffic}
        socialTraffic={socialTraffic}
        referralTraffic={referralTraffic}
        campaignTraffic={campaignTraffic}
        mostVisitedPages={mostVisitedPages.slice(0, 10).map((p) => ({ name: p.path.split('/').pop() || p.path, count: p.views }))}
        entryExitPages={entryExitPages}
      />

      <section aria-labelledby="trends-heading">
        <h2 id="trends-heading" className="text-xl font-semibold mb-4">
          Tendances
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trendCards.map((card) => {
            const Icon = card.icon
            const today = trends.today[card.key as keyof typeof trends.today]
            const seven = trends["7j"][card.key as keyof typeof trends["7j"]]
            const thirty = trends["30j"][card.key as keyof typeof trends["30j"]]
            return (
              <Card key={card.key} className="border transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="size-4" />
                    {card.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">Aujourd'hui</span>
                    <span className="font-bold text-lg">{today}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">7 derniers jours</span>
                    <span className="font-bold text-lg">{seven}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">30 derniers jours</span>
                    <span className="font-bold text-lg">{thirty}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}