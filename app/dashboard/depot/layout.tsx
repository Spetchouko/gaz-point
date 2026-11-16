import { redirect } from "next/navigation"
import { requireUser } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function DepotLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()

  if ((user.role ?? "client") !== "vendor") {
    redirect("/dashboard")
  }

  return children
}
