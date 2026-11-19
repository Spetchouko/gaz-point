"use client"

import { redirect } from "next/navigation"
import { ThemeProvider } from "@/app/_components/theme-provider"
import { DashboardClientLayout } from "@/app/_components/dashboard/client-layout"
import { useAuthModal } from "@/lib/auth-context"
import { useDashboardSession, useAutoRefreshSession } from "@/lib/auth-session"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Rafraîchir automatiquement la session au focus de la fenêtre
  useAutoRefreshSession()

  return (
    <ThemeProvider>
      <DashboardClientLayout>
        {children}
      </DashboardClientLayout>
    </ThemeProvider>
  )
}
