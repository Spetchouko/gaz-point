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
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Mes réservations
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Consultez l'historique de vos réservations et leurs statuts.
            </p>
          </div>

          <MesReservations />
        </div>
      </div>
    </ClientLayout>
  )
}
