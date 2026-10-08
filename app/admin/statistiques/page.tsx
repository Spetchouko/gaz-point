import { Metadata } from "next"
import { db } from "@/db"
import { user, pointDeVente, disponibilite } from "@/db/schema"
import { count, eq, desc, sql, and, gte } from "drizzle-orm"
import { AdminStatsCards } from "@/app/_components/admin-stats-cards"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, Store, Package, Truck, Clock, MapPin, BarChart2 } from "lucide-react"

export const metadata: Metadata = {
  title: { absolute: "Statistiques | Administration GazPoint" },
}

export default async function AdminStatsPage() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Évolution sur 30 jours (pour graphiques) - par jour
  const thirtyDaysData = await Promise.all(
    Array.from({ length: 30 }, (_, i) => {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - i))
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      return Promise.all([
        db.select({ count: count() }).from(user).where(and(gte(user.createdAt, dayStart), sql`${user.createdAt} < ${dayEnd}`)),
        db.select({ count: count() }).from(user).where(and(eq(user.role, "vendor"), gte(user.createdAt, dayStart), sql`${user.createdAt} < ${dayEnd}`)),
      ])
    })
  )

  const evolutionData = thirtyDaysData.map(([users, vendors], i) => ({
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - i)).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    users: users[0]?.count ?? 0,
    vendors: vendors[0]?.count ?? 0,
  }))

  const [
    totalUsers,
    totalVendors,
    activeVendors,
    totalPoints,
    activeDispos,
    totalBottles,
    // Tendances 7 jours
    newUsers7d,
    newVendors7d,
    newPoints7d,
    newDispos7d,
    // Tendances 30 jours
    newUsers30d,
    newVendors30d,
    newPoints30d,
    newDispos30d,
    // Aujourd'hui
    newUsersToday,
    newVendorsToday,
    newPointsToday,
    newDisposToday,
  ] = await Promise.all([
    db.select({ count: count() }).from(user),
    db.select({ count: count() }).from(user).where(eq(user.role, "vendor")),
    db.select({ count: count() }).from(user).where(and(eq(user.role, "vendor"), eq(user.role, "vendor"))),
    db.select({ count: count() }).from(pointDeVente),
    db.select({ count: count() }).from(disponibilite).where(eq(disponibilite.status, "disponible")),
    db.select({ sum: sql<number>`COALESCE(SUM(${disponibilite.quantity}), 0)` }).from(disponibilite).where(eq(disponibilite.status, "disponible")),
    // 7 jours
    db.select({ count: count() }).from(user).where(gte(user.createdAt, sevenDaysAgo)),
    db.select({ count: count() }).from(user).where(and(eq(user.role, "vendor"), gte(user.createdAt, sevenDaysAgo))),
    db.select({ count: count() }).from(pointDeVente).where(gte(pointDeVente.createdAt, sevenDaysAgo)),
    db.select({ count: count() }).from(disponibilite).where(gte(disponibilite.createdAt, sevenDaysAgo)),
    // 30 jours
    db.select({ count: count() }).from(user).where(gte(user.createdAt, thirtyDaysAgo)),
    db.select({ count: count() }).from(user).where(and(eq(user.role, "vendor"), gte(user.createdAt, thirtyDaysAgo))),
    db.select({ count: count() }).from(pointDeVente).where(gte(pointDeVente.createdAt, thirtyDaysAgo)),
    db.select({ count: count() }).from(disponibilite).where(gte(disponibilite.createdAt, thirtyDaysAgo)),
    // Aujourd'hui
    db.select({ count: count() }).from(user).where(gte(user.createdAt, todayStart)),
    db.select({ count: count() }).from(user).where(and(eq(user.role, "vendor"), gte(user.createdAt, todayStart))),
    db.select({ count: count() }).from(pointDeVente).where(gte(pointDeVente.createdAt, todayStart)),
    db.select({ count: count() }).from(disponibilite).where(gte(disponibilite.createdAt, todayStart)),
  ])

  const stats = {
    totalUsers: totalUsers[0]?.count ?? 0,
    totalVendors: totalVendors[0]?.count ?? 0,
    activeVendors: activeVendors[0]?.count ?? 0,
    totalPoints: totalPoints[0]?.count ?? 0,
    activeDispos: activeDispos[0]?.count ?? 0,
    totalBottles: Number(totalBottles[0]?.sum ?? 0),
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
    { key: "dispos", label: "Disponibilités", icon: Package, color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  ] as const

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
        <p className="mt-2 text-muted-foreground">
          Indicateurs globaux et tendances de la plateforme
        </p>
      </header>

      <AdminStatsCards stats={stats} />

      <section aria-labelledby="charts-heading">
        <h2 id="charts-heading" className="text-xl font-semibold mb-4">
          Évolution sur 30 jours
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="size-5 text-primary" />
                Inscriptions utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <SimpleLineChart
                  data={evolutionData}
                  dataKey="users"
                  color="hsl(var(--primary))"
                  label="Utilisateurs"
                />
              </div>
            </CardContent          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="size-5 text-emerald-600" />
                Inscriptions vendeurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <SimpleLineChart
                  data={evolutionData}
                  dataKey="vendors"
                  color="hsl(158 64% 52%)"
                  label="Vendeurs"
                />
              </div>
            </CardContent          </Card>
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

function SimpleLineChart({
  data,
  dataKey,
  color,
  label,
}: {
  data: { date: string; users: number; vendors: number }[]
  dataKey: "users" | "vendors"
  color: string
  label: string
}) {
  const values = data.map((d) => d[dataKey])
  const maxValue = Math.max(...values, 1)
  const minValue = Math.min(...values)
  const range = maxValue - minValue || 1

  const width = "100%"
  const height = 256
  const padding = 20
  const chartWidth = `calc(100% - ${padding * 2}px)`
  const chartHeight = height - padding * 2

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-full" role="img" aria-label={`Graphique d'évolution des ${label}`}>
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area */}
      <path
        d={data
          .map((d, i) => {
            const x = padding + (i / (data.length - 1)) * chartWidth
            const y = padding + chartHeight - ((d[dataKey] - minValue) / range) * chartHeight
            return `${i === 0 ? "M" : "L"} ${x} ${y}`
          })
          .join(" ")} L ${padding + chartWidth} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z
        fill="url(#gradient)"
      />
      {/* Line */}
      <path
        d={data
          .map((d, i) => {
            const x = padding + (i / (data.length - 1)) * chartWidth
            const y = padding + chartHeight - ((d[dataKey] - minValue) / range) * chartHeight
            return `${i === 0 ? "M" : "L"} ${x} ${y}`
          })
          .join(" ")}
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Points */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={padding + (i / (data.length - 1)) * chartWidth}
          cy={padding + chartHeight - ((d[dataKey] - minValue) / range) * chartHeight}
          r="4"
          fill={color}
          stroke="white"
          strokeWidth="2"
        />
      ))}
      {/* X axis labels (every 5 days) */}
      {data.map((d, i) => {
        if (i % 5 !== 0 && i !== data.length - 1) return null
        const x = padding + (i / (data.length - 1)) * chartWidth
        return (
          <text
            key={i}
            x={x}
            y={height - 5}
            textAnchor="middle"
            fontSize="10"
            fill="currentColor"
            className="opacity-50"
          >
            {d.date}
          </text>
        )
      })}
    </svg>
  )
}