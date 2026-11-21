import { redirect } from "next/navigation"
import { MonAvis } from "@/app/_components/dashboard/mon-avis"
import { avisTypeFromRole } from "@/lib/avis-shared"
import { getRoleDashboardPath, isAuthRole } from "@/lib/auth-routing"
import { getCurrentUser } from "@/lib/session"

export const dynamic = "force-dynamic"

/** Espace « Donner mon avis », réservé aux clients et aux vendeurs. */
export default async function AvisPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/connexion")

  if (user.role !== "client" && user.role !== "vendor") {
    redirect(isAuthRole(user.role) ? getRoleDashboardPath(user.role) : "/")
  }

  return <MonAvis role={avisTypeFromRole(user.role)} />
}
