import { DashboardShell } from "@/app/_components/dashboard/dashboard-shell"
import type { DashboardUser } from "@/lib/auth-session"
import { requireVendor } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireVendor()

  const sessionUser: DashboardUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    role: user.role ?? null,
    emailVerified: user.emailVerified,
    isActive: user.isActive ?? null,
    phoneNumber: user.phoneNumber ?? null,
    createdAt: user.createdAt ?? null,
    lastLoginAt: user.lastLoginAt ?? null,
    mustChangePassword: user.mustChangePassword ?? null,
  }

  return (
    <DashboardShell role="vendor" session={sessionUser} status="authenticated">
      {children}
    </DashboardShell>
  )
}
