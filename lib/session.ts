import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export type ProRole = "vendor" | "admin"

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect("/connexion")
  return user
}

export async function requirePro() {
  const user = await requireUser()
  const role = (user as unknown as { role?: string | null }).role ?? "client"
  if (role !== "vendor" && role !== "admin") redirect("/dashboard")
  return { user, role: role as ProRole }
}
