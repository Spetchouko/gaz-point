import { Metadata } from "next"
import { redirect } from "next/navigation"
import { requireUser } from "@/lib/session"
import { DashboardClient } from "@/app/_components/dashboard-client"

export const metadata: Metadata = {
  title: { absolute: "Tableau de bord | GazPoints" },
}

export default async function DashboardPage() {
  const user = await requireUser()
  const role = (user as { role?: string | null }).role ?? "client"

  if (role === "admin" || role === "collaborateur") {
    redirect("/admin")
  }

  // Allow vendors to access client dashboard features (search, reservations)
  // They can still access /dashboard/vendeur for vendor-specific features

  return (
    <div className="min-h-screen bg-background py-6 sm:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
            Bienvenue {user.name}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Content de te voir de retour !
          </p>
        </div>

        <DashboardClient />
      </div>
    </div>
  )
}