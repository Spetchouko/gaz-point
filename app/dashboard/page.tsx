import { Metadata } from "next"
import { redirect } from "next/navigation"
import { requireUser } from "@/lib/session"
import { DashboardClient } from "@/app/_components/dashboard-client"

export const metadata: Metadata = {
  title: { absolute: "Tableau de bord | GazPoint" },
}

export default async function DashboardPage() {
  const user = await requireUser()
  const role = (user as { role?: string | null }).role ?? "client"

  if (role === "vendor" || role === "admin") {
    redirect("/dashboard/vendeur")
  }

  return <DashboardClient />
}