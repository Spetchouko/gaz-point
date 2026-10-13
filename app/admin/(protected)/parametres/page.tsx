import { Metadata } from "next"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminExports } from "@/app/_components/admin-exports"
import { Database, Globe, KeyRound, Shield, Users } from "lucide-react"

export const metadata: Metadata = {
  title: { absolute: "Paramètres | Administration GAZ POINT" },
}

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="mt-2 text-muted-foreground">
          Configuration de la plateforme et préférences d&apos;administration
        </p>
      </header>

      <section className="space-y-6" aria-labelledby="general-heading">
        <h2 id="general-heading" className="text-xl font-semibold">Général</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-5 text-primary" />
              Informations de la plateforme
            </CardTitle>
            <CardDescription>
              Nom, description et coordonnées publiques de GAZ POINT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nom de la plateforme</label>
                <input
                  type="text"
                  defaultValue="GAZ POINT"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  readOnly
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email de contact</label>
                <input
                  type="email"
                  defaultValue="petchouko@gmail.com"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  readOnly
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea
                defaultValue="Plateforme de localisation et de signalement de disponibilité de gaz au Cameroun."
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[80px]"
                readOnly
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6" aria-labelledby="data-heading">
        <h2 id="data-heading" className="text-xl font-semibold">
          Données et exports
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-5 text-primary" />
              Export des données
            </CardTitle>
            <CardDescription>
              Génère un fichier CSV à partir des données réelles de la base Neon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminExports />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6" aria-labelledby="security-heading">
        <h2 id="security-heading" className="text-xl font-semibold">
          Accès administrateur
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              Gestion des accès
            </CardTitle>
            <CardDescription>
              Seul un administrateur peut créer, révoquer ou réattribuer des accès
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Collaborateurs administrateurs</p>
                <p className="text-sm text-muted-foreground">
                  Créer, désactiver ou réactiver les accès collaborateurs
                </p>
              </div>
              <Button render={<Link href="/admin/collaborateurs" />} variant="outline" className="gap-2">
                <Users className="size-4" />
                Gérer les accès
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Mon compte</p>
                <p className="text-sm text-muted-foreground">
                  Consulter et mettre à jour vos informations de profil
                </p>
              </div>
              <Button render={<Link href="/admin/profil" />} variant="outline" className="gap-2">
                <KeyRound className="size-4" />
                Mon profil
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
