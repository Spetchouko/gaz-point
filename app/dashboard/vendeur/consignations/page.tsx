import type { Metadata } from "next"
import { VendorLayout } from "@/app/_components/vendor-layout"
import { requirePro } from "@/lib/session"
import { MesConsignations } from "@/app/_components/mes-consignations"

export const metadata: Metadata = {
  title: { absolute: "Mes consignations | GazPoints" },
}

export default async function ConsignationsPage() {
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
      <MesConsignations />
    </VendorLayout>
  )
}
