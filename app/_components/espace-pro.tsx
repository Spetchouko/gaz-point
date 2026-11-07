import { asc, desc, eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { disponibilite, pointDeVente, user as userTable } from "@/db/schema"
import {
  assignVendor,
  createPointDeVente,
  reportDisponibilite,
  type ActionResult,
} from "@/app/dashboard/pro/actions"
import { EspaceProClient } from "@/app/_components/espace-pro/client"

export async function EspacePro({
  role,
  reporterName,
  points,
  vendors,
}: {
  role: "vendor" | "admin" | "collaborateur"
  reporterName: string
  points: {
    id: string
    name: string
    district: string
    address: string
    phone: string | null
    vendorId: string | null
    vendorName: string | null
    report: {
      id: string
      status: string | null
      createdAt: Date
      note: string | null
      quantity: number | null
      format: string | null
      brand: string | null
      source: string | null
      reportedByName: string | null
    } | null
  }[]
  vendors: {
    id: string
    name: string
    email: string
  }[]
}) {
  return (
    <EspaceProClient
      role={role}
      reporterName={reporterName}
      points={points}
      vendors={vendors}
      reportDisponibilite={reportDisponibilite}
      assignVendor={assignVendor}
      createPointDeVente={createPointDeVente}
    />
  )
}
