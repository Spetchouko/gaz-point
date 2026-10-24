import { Metadata } from "next"
import { AdminNav } from "@/app/_components/admin-nav"
import { AdminTopBar } from "@/app/_components/admin-top-bar"
import { getStaff } from "@/lib/session"

export const metadata: Metadata = {
  title: { absolute: "Administration | GAZ POINT" },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const staff = await getStaff()
  const permissions = [...staff.permissions]

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <AdminNav role={staff.role} permissions={permissions} />
      </aside>
      <div className="min-w-0 flex-1 lg:max-w-[calc(100%-16rem)]">
        <AdminTopBar role={staff.role} permissions={permissions} />
        <main className="overflow-auto">
          <div className="container mx-auto py-8 px-4">{children}</div>
        </main>
      </div>
    </div>
  )
}