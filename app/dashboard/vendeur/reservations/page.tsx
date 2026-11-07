import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { VendorLayout } from "@/app/_components/vendor-layout"
import { requirePro } from "@/lib/session"
import { MesReservationsVendeur } from "@/app/_components/mes-reservations-vendeur"

export const metadata: Metadata = {
  title: { absolute: "Mes réservations | GazPoints" },
}

export default async function ReservationsPage() {
  const { user, role } = await requirePro()

  if (role !== "vendor") {
    return <div>Accès réservé aux vendeurs.</div>
  }

  return (
    <VendorLayout
      role={role}
      vendorName={user.name ?? "Vendeur"}
      vendorEmail={user.email}
    >
      <MesReservationsVendeur />
    </VendorLayout>
  )
}