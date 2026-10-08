import { Metadata } from "next"
import { db } from "@/db"
import { user, pointDeVente, disponibilite } from "@/db/schema"
import { count, eq, desc, sql, gte, and } from "drizzle-orm"
import { AdminStatsCards } from "@/app/_components/admin-stats-cards"
import { AdminRecentActivity } from "@/app/_components/admin-recent-activity"

export const metadata: Metadata = {
  title: { absolute: "Administration | GazPoint" },
}

export default async function AdminDashboardPage() {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    totalVendors,
    activeVendors,
    totalPoints,
    activeDispos,
    totalBottles,
    recentUsers,
    recentVendors,
    recentPoints,
    recentDispos,
  ] = await Promise.all([
    db.select({ count: count() }).from(user),
    db.select({ count: count() }).from(user).where(eq(user.role, "vendor")),
    db
      .select({ count: count() })
      .from(user)
      .where(and(eq(user.role, "vendor"), eq(user.role, "vendor"))),
    db.select({ count: count() }).from(pointDeVente),
    db
      .select({ count: count() })
      .from(disponibilite)
      .where(eq(disponibilite.status, "disponible")),
    db
      .select({ sum: sql<number>`COALESCE(SUM(${disponibilite.quantity}), 0)` })
      .from(disponibilite)
      .where(eq(disponibilite.status, "disponible")),
    db
      .select()
      .from(user)
      .where(gte(user.createdAt, sevenDaysAgo))
      .orderBy(desc(user.createdAt))
      .limit(5),
    db
      .select()
      .from(user)
      .where(and(eq(user.role, "vendor"), gte(user.createdAt, sevenDaysAgo)))
      .orderBy(desc(user.createdAt))
      .limit(5),
    db
      .select()
      .from(pointDeVente)
      .where(gte(pointDeVente.createdAt, sevenDaysAgo))
      .orderBy(desc(pointDeVente.createdAt))
      .limit(5),
    db
      .select()
      .from(disponibilite)
      .where(gte(disponibilite.createdAt, sevenDaysAgo))
      .orderBy(desc(disponibilite.createdAt))
      .limit(5),
  ])

  const stats = {
    totalUsers: totalUsers[0]?.count ?? 0,
    totalVendors: totalVendors[0]?.count ?? 0,
    activeVendors: activeVendors[0]?.count ?? 0,
    totalPoints: totalPoints[0]?.count ?? 0,
    activeDispos: activeDispos[0]?.count ?? 0,
    totalBottles: Number(totalBottles[0]?.sum ?? 0),
  }

  const recentActivity = [
    ...recentUsers.map((u) => ({
      type: "user" as const,
      title: "Nouvel utilisateur inscrit",
      description: u.name,
      meta: u.email,
      date: u.createdAt,
    })),
    ...recentVendors.map((v) => ({
      type: "vendor" as const,
      title: "Nouveau vendeur inscrit",
      description: v.name,
      meta: v.email,
      date: v.createdAt,
    })),
    ...recentPoints.map((p) => ({
      type: "point" as const,
      title: "Nouveau point de vente créé",
      description: p.name,
      meta: `${p.district} — ${p.address}`,
      date: p.createdAt,
    })),
    ...recentDispos.map((d) => ({
      type: "dispo" as const,
      title: "Nouvelle disponibilité publiée",
      description: `${d.format ?? "Format ?"} — ${d.quantity ?? 0} bouteilles`,
      meta: d.status === "disponible" ? "Disponible" : d.status,
      date: d.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="mt-2 text-muted-foreground">
          Vue d'ensemble de la plateforme GasPoint
        </p>
      </header>

      <AdminStatsCards stats={stats} />

      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="text-xl font-semibold mb-4">
          Activité récente
        </h2>
        <AdminRecentActivity activities={recentActivity} />
      </section>
    </div>
  )
}