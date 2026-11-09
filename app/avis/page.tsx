import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/db"
import { avis } from "@/db/schema"
import { AvisForm } from "@/app/_components/avis-form"
import { requireUser } from "@/lib/session"
import type { AvisStatus } from "@/lib/avis-shared"
import { ClientLayout } from "@/app/_components/client-layout"

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
    <ClientLayout
      clientName={user.name ?? "Usager"}
      clientEmail={user.email}
    >
      <AvisForm
        defaultQuote={existing?.quote ?? ""}
        defaultCity={existing?.city ?? ""}
        currentStatus={(existing?.status as AvisStatus | undefined) ?? null}
      />
    </ClientLayout>
  )
}
