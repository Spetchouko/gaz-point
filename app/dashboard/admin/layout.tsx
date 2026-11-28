import { requireAdmin } from "@/lib/session"
import type { SessionUser } from "@/lib/session"
import { DashboardAdminClientLayout } from "./admin-client-layout"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAdmin()

  const sessionUser: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image ?? undefined,
    role: user.role ?? undefined,
    phoneNumber: user.phoneNumber ?? undefined,
    phoneVerified: user.phoneVerified ?? undefined,
    phoneNumberVerified: user.phoneNumberVerified ?? undefined,
    isActive: user.isActive ?? undefined,
    mustChangePassword: user.mustChangePassword ?? undefined,
    approvalStatus: user.approvalStatus ?? undefined,
    approvalRequestedAt: user.approvalRequestedAt ?? undefined,
    approvalProcessedAt: user.approvalProcessedAt ?? undefined,
    approvalProcessedBy: user.approvalProcessedBy ?? undefined,
    rejectionReason: user.rejectionReason ?? undefined,
    createdAt: user.createdAt ?? undefined,
    updatedAt: user.updatedAt ?? undefined,
    lastLoginAt: user.lastLoginAt ?? undefined,
  }

  return (
    <DashboardAdminClientLayout sessionUser={sessionUser}>
      {children}
    </DashboardAdminClientLayout>
  )
}