import { Metadata } from "next"
import { requireUser } from "@/lib/session"
import { MesReservations } from "@/app/_components/mes-reservations"
import { ClientLayout } from "@/app/_components/client-layout"

export const metadata: Metadata = {
  title: { absolute: "Mes réservations | GazPoints" },
}

export default async function ReservationsPage() {
  const user = await requireUser()
  const role = (user as { role?: string | null }).role ?? "client"

  if (role === "admin" || role === "collaborateur") {
    return <div>Accès réservé aux clients.</div>
  }

  return (
    <ClientLayout
      clientName={user.name ?? "Usager"}
      clientEmail={user.email}
    >
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Mes réservations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultez l'historique de vos réservations et leurs statuts.
        </p>
      </div>

      <MesReservations />
    </ClientLayout>
  )
}
