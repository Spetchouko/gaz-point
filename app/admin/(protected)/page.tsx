import { Metadata } from "next"
import { db } from "@/db"
import { user, pointDeVente, disponibilite, adminAction } from "@/db/schema"
import { count, eq, desc, sql, gte, and, inArray } from "drizzle-orm"
import { getStaff } from "@/lib/session"
import { AdminStatsCards } from "@/app/_components/admin-stats-cards"
import { AdminRecentActivity, type Activity } from "@/app/_components/admin-recent-activity"

export const metadata: Metadata = {
  title: { absolute: "Administration | GAZ POINT" },
}

type RecentActionRow = {
  id: string
  targetType: string | null
  targetId: string | null
  action: string | null
  details: string | null
  createdAt: Date
  adminName: string
  adminEmail: string
}

export default async function AdminDashboardPage() {
  const staff = await getStaff()
  const isAdmin = staff.role === "admin"
  const canDelete = isAdmin

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalAbonnes,
    totalVendeurs,
    totalUtilisateurs,
    totalPoints,
    activeDispos,
    totalBottles,
    recentUsers,
    recentVendors,
    recentPoints,
    recentDispos,
    recentActions,
  ] = await Promise.all([
    db.select({ count: count() }).from(user).where(eq(user.role, "vendor")),
    db.select({ count: count() }).from(user).where(eq(user.role, "vendor")),
    // Isolation : un collaborateur ne compte pas les comptes d'administration.
    isAdmin
      ? db.select({ count: count() }).from(user)
      : db.select({ count: count() }).from(user).where(inArray(user.role, ["client", "vendor"])),
    db.select({ count: count() }).from(pointDeVente),
    db
      .select({ count: count() })
      .from(disponibilite)
      .where(eq(disponibilite.status, "disponible")),
    db
      .select({ sum: sql<number>`COALESCE(SUM(${disponibilite.quantity}), 0)` })
      .from(disponibilite)
      .where(eq(disponibilite.status, "disponible")),
    // Collaboration : on ne remonte que les utilisateurs (abonnés + vendeurs).
    isAdmin
      ? db
          .select()
          .from(user)
          .where(gte(user.createdAt, sevenDaysAgo))
          .orderBy(desc(user.createdAt))
          .limit(5)
      : db
          .select()
          .from(user)
          .where(and(gte(user.createdAt, sevenDaysAgo), inArray(user.role, ["client", "vendor"])))
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
    // Les actions de l'administrateur principal ne sont jamais exposées aux collaborateurs.
    isAdmin
      ? db
          .select({
            id: adminAction.id,
            targetType: adminAction.targetType,
            targetId: adminAction.targetId,
            action: adminAction.action,
            details: adminAction.details,
            createdAt: adminAction.createdAt,
            adminName: user.name,
            adminEmail: user.email,
          })
          .from(adminAction)
          .innerJoin(user, eq(adminAction.adminId, user.id))
          .orderBy(desc(adminAction.createdAt))
          .limit(24)
      : ([] as RecentActionRow[]),
  ])

  const stats = {
    abonnes: totalAbonnes[0]?.count ?? 0,
    vendeurs: totalVendeurs[0]?.count ?? 0,
    utilisateurs: totalUtilisateurs[0]?.count ?? 0,
    pointsDeVente: totalPoints[0]?.count ?? 0,
    disponibilitesActives: activeDispos[0]?.count ?? 0,
    bouteillesDisponibles: Number(totalBottles[0]?.sum ?? 0),
  }

  const verbs: Record<string, string> = {
    create: "Création",
    update: "Modification",
    delete: "Suppression",
    toggle: "Changement de statut",
    export: "Export",
    export_collaborateur: "Export",
  }
  const nouns: Record<string, string> = {
    user: " d'utilisateur",
    users: " utilisateurs",
    vendor: " de vendeur",
    vendors: " vendeurs",
    collaborateur: " de collaborateur",
    collaborateurs: " collaborateurs",
    point: " de point de vente",
    points: " points de vente",
    disponibilite: " de disponibilité",
    disponibilites: " disponibilités",
    activite: " d'activité",
    publicite: " de publicité",
  }
  const nounFor = (targetType: string | null) => nouns[targetType ?? ""] ?? ""

  // Route de la fiche correspondant à une action d'administration (accès rapide).
  const targetHref = (targetType: string | null, targetId: string | null): string | undefined => {
    switch (targetType) {
      case "user":
      case "users":
        return targetId ? `/admin/users/${targetId}` : "/admin/users"
      case "vendor":
      case "vendors":
        return targetId ? `/admin/vendeurs/${targetId}` : "/admin/vendeurs"
      case "collaborateur":
      case "collaborateurs":
        return targetId ? `/admin/collaborateurs/${targetId}` : "/admin/collaborateurs"
      case "point":
      case "points":
        return targetId ? `/admin/points-de-vente/${targetId}` : "/admin/points-de-vente"
      case "disponibilite":
      case "disponibilites":
        return "/admin/disponibilites"
      case "publicite":
        return "/admin/marketing"
      default:
        return undefined
    }
  }

  const adminActivities: Activity[] = recentActions.map((a) => ({
    id: a.id,
    type: "admin",
    title: `${verbs[a.action ?? ""] ?? a.action}${nounFor(a.targetType)}`,
    description: a.details && a.details !== "" ? a.details : (a.targetId ?? ""),
    meta: `${a.adminName}${a.adminEmail ? ` · ${a.adminEmail}` : ""}`,
    date: a.createdAt,
    deletable: true,
    href: targetHref(a.targetType, a.targetId),
  }))

  const systemActivities: Activity[] = [
    ...recentUsers.map((u) => ({
      id: `user_${u.id}`,
      type: "user" as const,
      title: "Nouvel utilisateur inscrit",
      description: u.name,
      meta: u.email,
      date: u.createdAt,
      deletable: false,
      href: `/admin/users/${u.id}`,
    })),
    ...recentVendors.map((v) => ({
      id: `vendor_${v.id}`,
      type: "vendor" as const,
      title: "Nouveau vendeur inscrit",
      description: v.name,
      meta: v.email,
      date: v.createdAt,
      deletable: false,
      href: `/admin/vendeurs/${v.id}`,
    })),
    ...recentPoints.map((p) => ({
      id: `point_${p.id}`,
      type: "point" as const,
      title: "Nouveau point de vente créé",
      description: p.name,
      meta: `${p.district} — ${p.address}`,
      date: p.createdAt,
      deletable: false,
      href: `/admin/points-de-vente/${p.id}`,
    })),
    ...recentDispos.map((d) => ({
      id: `dispo_${d.id}`,
      type: "dispo" as const,
      title: "Nouvelle disponibilité publiée",
      description: `${d.format ?? "Format ?"} — ${d.quantity ?? 0} bouteilles`,
      meta: d.status === "disponible" ? "Disponible" : d.status,
      date: d.createdAt,
      deletable: false,
      href: "/admin/disponibilites",
    })),
  ]

  const recentActivity = [...(isAdmin ? adminActivities : []), ...systemActivities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 24)

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="mt-2 text-muted-foreground">
          Vue d&apos;ensemble de la plateforme GAZ POINT
        </p>
      </header>

      <AdminStatsCards stats={stats} />

      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="text-xl font-semibold mb-4">
          Activité récente
        </h2>
        <AdminRecentActivity activities={recentActivity} canDelete={canDelete} />
      </section>
    </div>
  )
}