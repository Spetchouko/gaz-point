"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { LogOut } from "lucide-react"
import { DashboardNav } from "@/app/_components/dashboard-nav"
import { useTranslation } from "@/lib/i18n"
import { TrouverMonGaz } from "@/app/_components/trouver-mon-gaz"
import { MesReservations } from "@/app/_components/mes-reservations"

export function DashboardClient() {
  const t = useTranslation()
  const router = useRouter()
  const { data: session } = authClient.useSession()

  useEffect(() => {
    if (session === null) {
      router.push("/connexion")
    }
  }, [session, router])

  if (!session?.user) {
    return null
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background py-6 sm:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <DashboardNav pro={false} />

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
            {t("button_find_gas")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("hero_subtitle")}
          </p>
        </div>

        <TrouverMonGaz />

        <Separator className="my-8 bg-border" />

        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t("nav_reservations")}</h2>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            {t("description") || "Consultez l'historique de vos réservations et leurs statuts."}
          </p>
        </div>

        <MesReservations />

        <Separator className="my-8 bg-border" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar className="size-12 shrink-0">
              <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? "User"} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {session.user.name?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{session.user.name}</p>
              <p className="text-sm text-muted-foreground truncate">{session.user.email}</p>
            </div>
          </div>
          <Button variant="destructive" onClick={handleSignOut} className="gap-2 shrink-0 w-full sm:w-auto">
            <LogOut className="size-4" />
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  )
}