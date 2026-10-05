"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { LogOut, Package, MapPin, User, Settings } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
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

  const firstName = session.user.name?.split(" ")[0] ?? "Utilisateur"

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Bienvenue {firstName}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Voici votre espace personnel GazPoint
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="transition-all hover:shadow-md hover:border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="size-5 text-primary" />
                Mes commandes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Suivez vos commandes de gaz en cours et historiques
              </p>
              <Button variant="outline" render={<Link href="/mes-commandes" />}>
                Voir mes commandes
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md hover:border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="size-5 text-primary" />
                Points de vente favoris
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Gérez vos dépôts préférés pour un accès rapide
              </p>
              <Button variant="outline" render={<Link href="/mes-favoris" />}>
                Voir mes favoris
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-all hover:shadow-md hover:border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="size-5 text-primary" />
                Mon profil
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Modifiez vos informations personnelles et préférences
              </p>
              <Button variant="outline" render={<Link href="/profil" />}>
                Modifier mon profil
              </Button>
            </CardContent>
          </Card>
        </div>

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