import { redirect } from "next/navigation"
import { requireUser } from "@/lib/session"
import { getRoleDashboardPath, isAuthRole } from "@/lib/auth-routing"

export const dynamic = "force-dynamic"

export default async function DepotLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()

  if ((user.role ?? "client") !== "vendor") {
    if (!isAuthRole(user.role)) {
      redirect("/connexion")
    }
    redirect(getRoleDashboardPath(user.role, user.mustChangePassword === true))
  }

  return children
}
