import { Metadata } from "next"
import { db } from "@/db"
import { user, pointDeVente, disponibilite, trafficEvent, publiciteEvent } from "@/db/schema"
import { count, eq, sql, and, gte, lt, sum } from "drizzle-orm"
import { AdminStatsCards } from "@/app/_components/admin-stats-cards"
import { AdminTrafficCharts } from "@/app/_components/admin-traffic-charts"
import { requireStaffModule } from "@/lib/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Store, Cylinder, MapPin, Phone, Tablet, Laptop, Smartphone, Monitor, BrowserChrome, BrowserSafari, BrowserFirefox, BrowserEdge, Globe, BarChart2, LineChart, PieChart, Activity } from "lucide-react"
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  Legend,
  ComposedChart,
  Tooltip,
  Area,
} from "recharts"

export const metadata: Metadata = {
  title: { absolute: "Statistiques | Administration GAZ POINT" },
}

function dayLabel(offsetFromToday: number): string {
  const d = new Date()
  d.setDate(d.getDate() - offsetFromToday)
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
}

export default async function AdminStatsPage() {
  await requireStaffModule("statistiques")

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // ============================================================
  // 1. TRAFIC : visites / inscriptions / connexions par jour (90 jours)
  // ============================================================
  const trafficRows = await db
    .select({
      eventType: trafficEvent.eventType,
      createdAt: trafficEvent.createdAt,
      consented: trafficEvent.consented,
    })
    .from(trafficEvent)
    .where(gte(trafficEvent.createdAt, ninetyDaysAgo))

  const buckets: Record<string, { date: string; visits: number; signups: number; signins: number }> = {}
  for (let i = 89; i >= 0; i--) {
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
  // 2. ÉVOLUTION UTILISATEURS / VENDEURS sur 30 jours
  // ============================================================
  const evolutionData = await Promise.all(
    Array.from({ length: 30 }, (_, i) => {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - i))
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      return Promise.all([
        db.select({ count: count() }).from(user).where(and(gte(user.createdAt, dayStart), lt(user.createdAt, dayEnd))),
        db.select({ count: count() }).from(user).where(and(eq(user.role, "vendor"), gte(user.createdAt, dayStart), lt(user.createdAt, dayEnd))),
      ])
    })
  )
  const evolutionSeries = evolutionData.map(([users, vendors], i) => ({
    date: dayLabel(29 - i),
    users: users[0]?.count ?? 0,
    vendors: vendors[0]?.count ?? 0,
  }))

  // ============================================================
  // 3. COMPTER LES INDICATEURS DE TRAFIC
  // ============================================================

  // Total des pages vues (avec doublons)
  const totalPageviewsResult = await db
    .select({ count: sql<number>`COUNT(*)` }).from(trafficEvent).where(and(gte(trafficEvent.createdAt, ninetyDaysAgo), eq(trafficEvent.eventType, "pageview")))
  const totalPageviews = totalPageviewsResult[0]?.count ?? 0

  // Pages uniques consultées
  const uniquePageviewsResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${trafficEvent.path})` }).from(trafficEvent).where(and(gte(trafficEvent.createdAt, ninetyDaysAgo), eq(trafficEvent.eventType, "pageview")))
  const uniquePageviews = uniquePageviewsResult[0]?.count ?? 0

  // Sessions totales (userId uniques + pageview)
  const totalSessionsResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${trafficEvent.userId})` }).from(trafficEvent).where(and(gte(trafficEvent.createdAt, ninetyDaysAgo), eq(trafficEvent.eventType, "pageview")))
  const totalSessions = totalSessionsResult[0]?.count ?? 0

  // Durée moyenne de session et taux de rebond
  const sessionData = await db
    .select({ userId: trafficEvent.userId, Min: sql`MIN(${trafficEvent.createdAt})`, Max: sql`MAX(${trafficEvent.createdAt})` })
    .from(trafficEvent)
    .where(and(gte(trafficEvent.createdAt, ninetyDaysAgo), eq(trafficEvent.eventType, "pageview")))
    .groupBy(trafficEvent.userId)

  let totalSessionTime = 0
  let totalSessionsCalculated = 0
  let bounceSessions = 0

  for (const row of sessionData) {
    const duration = new Date(row.Max).getTime() - new Date(row.Min).getTime()
    totalSessionTime += duration
    totalSessionsCalculated += 1
    if (duration <= 1000) { // Moins de 1 seconde = rebond
      bounceSessions += 1
    }
  }

  const avgSessionDurationMs = totalSessionsCalculated > 0 ? totalSessionTime / totalSessionsCalculated : 0
  const avgSessionDuration = Math.round(avgSessionDurationMs / 1000 / 60) // en minutes
  const bounceRate = totalSessionsCalculated > 0 ? (bounceSessions / totalSessionsCalculated) * 100 : 0

  // Nouveaux visiteurs (pageviews uniques par userId)
  const newVisitors7dResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${trafficEvent.userId})` }).from(trafficEvent).where(and(gte(trafficEvent.createdAt, sevenDaysAgo), eq(trafficEvent.eventType, "pageview")))
  const newVisitors7d = newVisitors7dResult[0]?.count ?? 0

  const newVisitors30dResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${trafficEvent.userId})` }).from(trafficEvent).where(and(gte(trafficEvent.createdAt, thirtyDaysAgo), eq(trafficEvent.eventType, "pageview")))
  const newVisitors30d = newVisitors30dResult[0]?.count ?? 0

  const newVisitorsTodayResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${trafficEvent.userId})` }).from(trafficEvent).where(and(gte(trafficEvent.createdAt, todayStart), eq(trafficEvent.eventType, "pageview")))
  const newVisitorsToday = newVisitorsTodayResult[0]?.count ?? 0

  // ============================================================
  // 4. RÉPARTITION APPIAREILS (mobile/desktop/tablette)
  // ============================================================
  const uaRows = await db
    .select({ userAgent: trafficEvent.userAgent })
    .from(trafficEvent)
    .where(and(gte(trafficEvent.createdAt, ninetyDaysAgo), eq(trafficEvent.eventType, "pageview")))
    .limit(1000)

  let mobileCount = 0
  let desktopCount = 0
  let tabletCount = 0

  for (const row of uaRows) {
    const ua = row.userAgent ?? ""
    const lowerUa = ua.toLowerCase()
    const isMobile = /mobi|android|iphone|palmid|windows phone|iemobile/.test(lowerUa)
    const isTablet = /ipad|tablet|sandbox/.test(lowerUa) && !isMobile

    if (isMobile) mobileCount++
    else if (isTablet) tabletCount++
    else desktopCount++
  }

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
    .where(and(gte(trafficEvent.createdAt, ninetyDaysAgo), eq(trafficEvent.eventType, "pageview")))
    .limit(500)

  const SEARCH_HOSTS = [
    "google.", "bing.", "yahoo.", "duckduckgo.", "qwant.", "ecosia.",
    "yandex.", "baidu.", "startpage.", "search.brave.",
  ]

  const SOCIAL_HOSTS = [
    "facebook.", "fb.", "instagram.", "twitter.", "x.com", "t.co",
    "linkedin.", "youtube.", "youtu.be", "tiktok.", "snapchat.",
    "whatsapp.", "wa.me", "telegram.", "t.me", "pinterest.", "reddit.", "threads.",
  ]

  const CAMPAIGN_MEDIUMS = [
    "cpc", "ppc", "paid", "paidsearch", "display", "banner", "cpm", "ads", "ad", "sponsored", "email",
  ]

  function referrerHost(referrer: string | null | undefined): string | null {
    if (!referrer) return null
    try {
      const url = new URL(referrer)
      return url.hostname.toLowerCase() || null
    } catch {
      return null
    }
  }

  function matchesHost(host: string, patterns: string[]): boolean {
    return patterns.some((pattern) => host.includes(pattern))
  }

  function classifySource(input: {
    referrer?: string | null
    utmSource?: string | null
    utmMedium?: string | null
    utmCampaign?: string | null
  }): "direct" | "search" | "social" | "referral" | "campaign" {
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

  const sourceCategories = {
    direct: 0,
    search: 0,
    social: 0,
    referral: 0,
    campaign: 0,
  }

  for (const row of sourceRows) {
    const source = classifySource({
      referrer: row.referrer,
      utmSource: row.utmSource,
      utmMedium: row.utmMedium,
      utmCampaign: row.utmCampaign,
    })
    sourceCategories[source]++
  }

  const directTraffic = sourceCategories.direct
  const searchTraffic = sourceCategories.search
  const socialTraffic = sourceCategories.social
  const referralTraffic = sourceCategories.referral
  const campaignTraffic = sourceCategories.campaign

  // Pourcentages
  const totalTraffic = directTraffic + searchTraffic + socialTraffic + referralTraffic + campaignTraffic
  const trafficPercentages = {
    direct: totalTraffic > 0 ? Math.round((directTraffic / totalTraffic) * 100) : 0,
    search: totalTraffic > 0 ? Math.round((searchTraffic / totalTraffic) * 100) : 0,
    social: totalTraffic > 0 ? Math.round((socialTraffic / totalTraffic) * 100) : 0,
    referral: totalTraffic > 0 ? Math.round((referralTraffic / totalTraffic) * 100) : 0,
    campaign: totalTraffic > 0 ? Math.round((campaignTraffic / totalTraffic) * 100) : 0,
  }

  // ============================================================
  // 6. PAGES LES PLUS CONSULTÉES
  // ============================================================
  const pageViewRows = await db
    .select({ path: trafficEvent.path, total: count() })
    .from(trafficEvent)
    .where(and(gte(trafficEvent.createdAt, ninetyDaysAgo), eq(trafficEvent.eventType, "pageview")))
    .groupBy(trafficEvent.path)
    .orderBy(sql`count(*) desc`)
    .limit(10)

  const mostVisitedPages: Array<{ path: string; views: number }> = []
  for (const row of pageViewRows) {
    mostVisitedPages.push({ path: row.path, views: Number(row.total) })
  }

  // ============================================================
  // 6b. INDICATEURS EXISTANTS (utilisateurs, vendeurs, points, dispo)
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

  const totalUtilisateurs = totalUtilisateursResult
  const totalVendeurs = totalVendeursResult
  const totalAbonnes = totalAbonnesResult
  const totalPoints = totalPointsResult
  const activeDispos = activeDisposResult
  const totalBottles = totalBottlesResult

  // Tendances : nouveaux utilisateurs/vendeurs/points/dispos sur aujourd'hui, 7j, 30j
  const todayStartTs = todayStart.getTime()
  const sevenDaysAgoTs = sevenDaysAgo.getTime()
  const thirtyDaysAgoTs = thirtyDaysAgo.getTime()

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

  const newUsersToday = newUsersTodayResult
  const newVendorsToday = newVendorsTodayResult
  const newPointsToday = newPointsTodayResult
  const newDisposToday = newDisposTodayResult
  const newUsers7d = newUsers7dResult
  const newVendors7d = newVendors7dResult
  const newPoints7d = newPoints7dResult
  const newDispos7d = newDispos7dResult
  const newUsers30d = newUsers30dResult
  const newVendors30d = newVendors30dResult
  const newPoints30d = newPoints30dResult
  const newDispos30d = newDispos30dResult

  // ============================================================
  // 7. Préparer les données pour les composants
  // ============================================================

  const stats = {
    // Indicateurs existants
    abonnes: totalAbonnes[0]?.count ?? 0,
    vendeurs: totalVendeurs[0]?.count ?? 0,
    utilisateurs: totalUtilisateurs[0]?.count ?? 0,
    pointsDeVente: totalPoints[0]?.count ?? 0,
    disponibilitesActives: activeDispos[0]?.count ?? 0,
    bouteillesDisponibles: Number(totalBottles[0]?.sum ?? 0),
    // Nouveaux indicateurs de trafic
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
    today: {
      users: newUsersToday[0]?.count ?? 0,
      vendors: newVendorsToday[0]?.count ?? 0,
      points: newPointsToday[0]?.count ?? 0,
      dispos: newDisposToday[0]?.count ?? 0,
    },
    "7j": {
      users: newUsers7d[0]?.count ?? 0,
      vendors: newVendors7d[0]?.count ?? 0,
      points: newPoints7d[0]?.count ?? 0,
      dispos: newDispos7d[0]?.count ?? 0,
    },
    "30j": {
      users: newUsers30d[0]?.count ?? 0,
      vendors: newVendors30d[0]?.count ?? 0,
      points: newPoints30d[0]?.count ?? 0,
      dispos: newDispos30d[0]?.count ?? 0,
    },
  }

  const trendCards = [
    { key: "users", label: "Utilisateurs", icon: Users, color: "bg-sky-500/10 text-sky-600 border-sky-500/30" },
    { key: "vendors", label: "Vendeurs", icon: Store, color: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30" },
    { key: "points", label: "Points de vente", icon: MapPin, color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
    { key: "dispos", label: "Disponibilités", icon: Cylinder, color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  ] as const

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
        <p className="mt-2 text-muted-foreground">
          Indicateurs globaux, trafic anonyme et tendances de la plateforme
        </p>
      </header>

      <AdminStatsCards stats={stats} />

      <section aria-labelledby="charts-heading">
        <h2 id="charts-heading" className="text-xl font-semibold mb-4">
          Graphiques interactifs
        </h2>
        <AdminTrafficCharts trafficData={trafficData} evolutionData={evolutionSeries} />
      </section>

      <section aria-labelledby="analysis-heading">
        <h2 id="analysis-heading" className="text-xl font-semibold mb-4">
          Analyse approfondie
        </h2>
        
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* Répartition appareils */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tablet className="size-5 text-primary" />
                Répartition appareils
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart data={[
                    { name: "Mobile", count: mobileCount, color: "hsl(142 70% 50%)" },
                    { name: "Desktop", count: desktopCount, color: "hsl(217 91% 60%)" },
                    { name: "Tablette", count: tabletCount, color: "hsl(268 82% 56%)" },
                  ]}>
                    <Pie dataKey="count" cx="50%" cy="50%" r="40" />
                    <Cell dataKey="name" label="{name}" fill="{color}" />
                    <Cell dataKey="count" label="{count} ({percentage}%)" x={80} y={0} fill="hsl(var(--foreground))" fontSize={12} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Sources de trafic */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="size-5 text-success" />
                Sources de trafic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={[
                    { name: "Accès direct", count: directTraffic },
                    { name: "Moteurs de recherche", count: searchTraffic },
                    { name: "Réseaux sociaux", count: socialTraffic },
                    { name: "Sites référents", count: referralTraffic },
                    { name: "Campagnes", count: campaignTraffic },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    {[
                      { dataKey: "count", name: "Visiteurs", fill: "hsl(var(--primary))", type: "bar" },
                    ].map((entry, i) => (
                      <Bar key={i} dataKey="count" name={entry.name} fill={entry.fill} />
                    ))}
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

      <section aria-labelledby="traffic-heading">
        <h2 id="traffic-heading" className="text-xl font-semibold mb-4">
          Trafic détaillé
        </h2>
        
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* Évolution dans le temps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5 text-primary" />
                Évolution dans le temps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trafficData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="visits"
                      name="Visites"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Bar dataKey="signups" name="Inscriptions" fill="hsl(158 64% 52%)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="signins" name="Connexions" fill="hsl(217 91% 60%)" radius={[3, 3, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pages les plus consultées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="size-5 text-primary" />
                Pages les plus consultées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={mostVisitedPages.map((p, i) => ({ name: p.path.split('/').pop() || p.path, count: p.views }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    {mostVisitedPages.slice(0, 5).map((p, i) => (
                      <Bar key={i} dataName={i} dataKey="count" name={p.path.split('/').pop() || p.path} fill="hsl(var(--primary))" />
                    ))}
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

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
                    <span className="text-sm text-muted-foreground">Aujourd&apos;hui</span>
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