import { Metadata } from "next"
import { redirect } from "next/navigation"
import { AdminNav } from "@/app/_components/admin-nav"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const metadata: Metadata = {
  title: { absolute: "Administration | GazPoint" },
}

async function getAdminUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session?.user
  const role = (user as { role?: string | null })?.role ?? "client"
  if (!user || role !== "admin") {
    return null
  }
  return user
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAdminUser()

  if (!user) {
    redirect("/admin/login")
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden w-64 flex-col border-r bg-card lg:block">
        <AdminNav />
      </aside>
      <main className="flex-1 overflow-auto lg:max-w-[calc(100%-16rem)]">
        <div className="container mx-auto py-8 px-4">{children}</div>
      </main>
    </div>
  )
}