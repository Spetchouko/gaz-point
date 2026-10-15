"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { LogOut } from "lucide-react"
import { DashboardNav } from "@/app/_components/dashboard-nav"
import { TrouverMonGaz } from "@/app/_components/trouver-mon-gaz"
import { MesReservations } from "@/app/_components/mes-reservations"

export function DashboardClient() {
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
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <DashboardNav pro={false} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Trouver du gaz disponible
          </h1>
          <p className="mt-2 text-muted-foreground">
            Trouvez rapidement un point de vente où le gaz est disponible près de chez vous.
          </p>
        </div>

        <TrouverMonGaz />

        <Separator className="my-8" />

        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Mes réservations</h2>
          <p className="mt-1 text-muted-foreground">
            Consultez l'historique de vos réservations et leurs statuts.
          </p>
        </div>

        <MesReservations />

        <Separator className="my-8" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-12">
              <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? "User"} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {session.user.name?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{session.user.name}</p>
              <p className="text-sm text-muted-foreground">{session.user.email}</p>
            </div>
          </div>
          <Button variant="destructive" onClick={handleSignOut} className="gap-2">
            <LogOut className="size-4" />
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  )
}