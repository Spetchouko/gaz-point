import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/db"
import { avis } from "@/db/schema"
import { AvisForm } from "@/app/_components/avis-form"
import { DashboardNav } from "@/app/_components/dashboard-nav"
import { requireUser } from "@/lib/session"
import type { AvisStatus } from "@/lib/avis-shared"

export const metadata: Metadata = {
  title: { absolute: "Donner mon avis | GazPoints" },
}

export default async function AvisPage() {
  const user = await requireUser()
  const role = user.role ?? "client"

  // La publication d'avis est réservée aux usagers et aux vendeurs.
  if (role !== "client" && role !== "vendor") redirect("/dashboard")

  const [existing] = await db
    .select()
    .from(avis)
    .where(eq(avis.userId, user.id))
    .limit(1)

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-2xl px-4">
        <DashboardNav pro={role === "vendor"} />

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Donner mon avis</h1>
          <p className="mt-2 text-muted-foreground">
            Partage ton expérience avec GazPoints. Ton avis sera publié sur la page
            d&apos;accueil après validation par notre équipe.
          </p>
        </header>

        <AvisForm
          defaultQuote={existing?.quote ?? ""}
          defaultCity={existing?.city ?? ""}
          currentStatus={(existing?.status as AvisStatus | undefined) ?? null}
        />
      </div>
    </div>
  )
}
