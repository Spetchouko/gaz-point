import { Metadata } from "next"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { user as userTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { AdminStatsCards } from "@/app/_components/admin-stats-cards"
import { requireAdmin } from "@/lib/session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Store, Cylinder, MapPin, Phone, Tablet, Laptop, Smartphone, Monitor } from "lucide-react"
import { AdminProfilWithAvatar } from "@/app/_components/admin-profil-with-avatareditor"

export const metadata: Metadata = {
  title: { absolute: "Mon profil | Administration GAZ POINT" },
}

export default async function AdminProfilPage() {
  const sessionUser = await requireAdmin()

  const rows = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, sessionUser.id))
    .limit(1)

  const profile = rows[0]
  if (!profile) redirect("/connexion")

  // Build stats for the cards component
  const stats = {
    // Basic stats from the profile page context
    abonnes: 0,
    vendeurs: 0,
    utilisateurs: 0,
    pointsDeVente: 0,
    disponibilitesActives: 0,
    bouteillesDisponibles: 0,
    totalPageviews: 0,
    uniquePageviews: 0,
    totalSessions: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
    newVisitors7d: 0,
    newVisitors30d: 0,
    newVisitorsToday: 0,
    mobileUsers: 0,
    desktopUsers: 0,
    tabletUsers: 0,
    directTraffic: 0,
    searchTraffic: 0,
    socialTraffic: 0,
    referralTraffic: 0,
    campaignTraffic: 0,
    trafficPercentages: {
      direct: 0,
      search: 0,
      social: 0,
      referral: 0,
      campaign: 0,
    },
    mostVisitedPages: [],
    topExitPages: [],
  }

  return (
    <div className="space-y-8">
      <AdminProfilWithAvatar stats={stats} />
    </div>
  )
}