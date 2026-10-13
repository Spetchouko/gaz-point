import { Metadata } from "next"
import { db } from "@/db"
import { user, pointDeVente, disponibilite, trafficEvent } from "@/db/schema"
import { count, eq, sql, and, gte, lt } from "drizzle-orm"
import { AdminStatsCards } from "@/app/_components/admin-stats-cards"
import { AdminTrafficCharts } from "@/app/_components/admin-traffic-charts"
import { requireStaffModule } from "@/lib/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Store, Cylinder, MapPin } from "lucide-react"

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

  // Trafic : visites / inscriptions / connexions par jour (90 jours) — vues croisées
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

  // Évolution utilisateurs / vendeurs sur 30 jours
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

  const [
    totalAbonnes,
    totalVendeurs,
    totalUtilisateurs,
    totalPoints,
    activeDispos,
    totalBottles,
    newUsers7d,
    newVendors7d,
    newPoints7d,
    newDispos7d,
    newUsers30d,
    newVendors30d,
    newPoints30d,
    newDispos30d,
    newUsersToday,
    newVendorsToday,
    newPointsToday,
    newDisposToday,
  ] = await Promise.all([
    db.select({ count: count() }).from(user).where(eq(user.role, "vendor")),
    db.select({ count: count() }).from(user).where(eq(user.role, "vendor")),
    db.select({ count: count() }).from(user),
    db.select({ count: count() }).from(pointDeVente),
    db.select({ count: count() }).from(disponibilite).where(eq(disponibilite.status, "disponible")),
    db.select({ sum: sql<number>`COALESCE(SUM(${disponibilite.quantity}), 0)` }).from(disponibilite).where(eq(disponibilite.status, "disponible")),
    db.select({ count: count() }).from(user).where(gte(user.createdAt, sevenDaysAgo)),
    db.select({ count: count() }).from(user).where(and(eq(user.role, "vendor"), gte(user.createdAt, sevenDaysAgo))),
    db.select({ count: count() }).from(pointDeVente).where(gte(pointDeVente.createdAt, sevenDaysAgo)),
    db.select({ count: count() }).from(disponibilite).where(gte(disponibilite.createdAt, sevenDaysAgo)),
    db.select({ count: count() }).from(user).where(gte(user.createdAt, thirtyDaysAgo)),
    db.select({ count: count() }).from(user).where(and(eq(user.role, "vendor"), gte(user.createdAt, thirtyDaysAgo))),
    db.select({ count: count() }).from(pointDeVente).where(gte(pointDeVente.createdAt, thirtyDaysAgo)),
    db.select({ count: count() }).from(disponibilite).where(gte(disponibilite.createdAt, thirtyDaysAgo)),
    db.select({ count: count() }).from(user).where(gte(user.createdAt, todayStart)),
    db.select({ count: count() }).from(user).where(and(eq(user.role, "vendor"), gte(user.createdAt, todayStart))),
    db.select({ count: count() }).from(pointDeVente).where(gte(pointDeVente.createdAt, todayStart)),
    db.select({ count: count() }).from(disponibilite).where(gte(disponibilite.createdAt, todayStart)),
  ])

  const stats = {
    abonnes: totalAbonnes[0]?.count ?? 0,
    vendeurs: totalVendeurs[0]?.count ?? 0,
    utilisateurs: totalUtilisateurs[0]?.count ?? 0,
    pointsDeVente: totalPoints[0]?.count ?? 0,
    disponibilitesActives: activeDispos[0]?.count ?? 0,
    bouteillesDisponibles: Number(totalBottles[0]?.sum ?? 0),
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
    { key: "vendors", label: "Vendeurs", icon: Store, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
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