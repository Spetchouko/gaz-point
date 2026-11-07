import type { Metadata } from "next"
import { ClientLayout } from "@/app/_components/client-layout"
import { requireUser } from "@/lib/session"
import { HistoriqueCodes } from "@/app/_components/historique-codes"

export const metadata: Metadata = {
  title: { absolute: "Historique des codes de réservation | GazPoints" },
}

export default async function HistoriqueCodesPage() {
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
      <HistoriqueCodes />
    </ClientLayout>
  )
}
