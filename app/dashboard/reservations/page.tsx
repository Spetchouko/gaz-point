import { Metadata } from "next"
import { requireUser } from "@/lib/session"
import { MesReservations } from "@/app/_components/mes-reservations"
import { DashboardNav } from "@/app/_components/dashboard-nav"

export const metadata: Metadata = {
  title: { absolute: "Mes réservations | GazPoints" },
}

export default async function ReservationsPage() {
  const user = await requireUser()
  const role = (user as { role?: string | null }).role ?? "client"
  const isVendor = role === "vendor"

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <DashboardNav pro={isVendor} isVendor={isVendor} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Mes réservations</h1>
          <p className="mt-2 text-muted-foreground">
            Consultez l'historique de vos réservations et leurs statuts.
          </p>
        </div>

        <MesReservations />
      </div>
    </div>
  )
}