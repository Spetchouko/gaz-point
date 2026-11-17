import { redirect } from "next/navigation"
import { requireUser } from "@/lib/session"
import { ThemeProvider } from "@/app/_components/theme-provider"
import { DashboardClientLayout } from "@/app/_components/dashboard/client-layout"
import { useAuthModal } from "@/lib/auth-context"
import { useDashboardSession } from "@/lib/auth-session"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()

  if ((user.role ?? "client") !== "vendor") {
    redirect("/dashboard")
  }

  const { status, user: dashboardUser, isAuthenticated, isLoading, role } =
    useDashboardSession()

  return (
    <ThemeProvider>
      <DashboardClientLayout session={dashboardUser} status={status}>
        {children}
      </DashboardClientLayout>
    </ThemeProvider>
  )
}
