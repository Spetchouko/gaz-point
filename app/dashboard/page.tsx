import { Metadata } from "next"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { reservation, favori } from "@/db/schema"
import { eq, count, and } from "drizzle-orm"
import { DashboardClient } from "@/app/_components/dashboard-client"
import { ClientLayout } from "@/app/_components/client-layout"
import { requireUser } from "@/lib/session"

export const metadata: Metadata = {
  title: { absolute: "Tableau de bord | GazPoints" },
}

type GlobalStats = {
  totalReservations: number
  activeReservations: number
  totalFavorites: number
}

export default async function DashboardPage() {
  const user = await requireUser()
  const role = (user as { role?: string | null }).role ?? "client"

  if (role === "admin" || role === "collaborateur") {
    redirect("/admin")
  }

  // Un vendeur qui atterrit sur /dashboard (lien direct, favori, etc.) est
  // redirigé vers son dashboard professionnel. Seuls les clients restent sur
  // ce dashboard usager.
  if (role === "vendor") {
    redirect("/dashboard/vendeur")
  }

  const [
    totalReservations,
    activeReservations,
    totalFavorites,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(reservation)
      .where(eq(reservation.userId, user.id)),
    db
      .select({ count: count() })
      .from(reservation)
      .where(
        and(
          eq(reservation.userId, user.id),
          eq(reservation.status, "confirmed"),
        ),
      ),
    db.select({ count: count() }).from(favori).where(eq(favori.userId, user.id)),
  ])

  const globalStats: GlobalStats = {
    totalReservations: Number(totalReservations[0]?.count ?? 0),
    activeReservations: Number(activeReservations[0]?.count ?? 0),
    totalFavorites: Number(totalFavorites[0]?.count ?? 0),
  }

  return (
    <ClientLayout
      clientName={user.name ?? "Usager"}
      clientEmail={user.email}
    >
      <DashboardClient
        clientName={user.name}
        clientEmail={user.email}
        globalStats={globalStats}
      />
    </ClientLayout>
  )
}