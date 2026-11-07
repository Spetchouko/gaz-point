import { Metadata } from "next"
import { AdminShell } from "@/app/_components/admin-shell"
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
    <AdminShell role={staff.role} permissions={permissions}>
      {children}
    </AdminShell>
  )
}
