import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Shield, Bell, Palette, Database, KeyRound, Globe } from "lucide-react"

export const metadata: Metadata = {
  title: { absolute: "Paramètres | Administration GazPoint" },
}

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="mt-2 text-muted-foreground">
          Configuration de la plateforme et préférences d'administration
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
              Nom, description et coordonnées publiques de GasPoint
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nom de la plateforme</label>
                <input
                  type="text"
                  defaultValue="GasPoint"
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
            <Button variant="outline" disabled>
              Modifier (bientôt disponible)
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6" aria-labelledby="security-heading">
        <h2 id="security-heading" className="text-xl font-semibold">Sécurité</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              Sécurité du compte administrateur
            </CardTitle>
            <CardDescription>
              Gestion de l'authentification et des accès administrateur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Authentification à deux facteurs (2FA)</label>
              <p className="text-sm text-muted-foreground">
                Non configurée pour le moment. Utilisez un gestionnaire de mots de passe sécurisé.
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Changer le mot de passe administrateur</p>
                <p className="text-sm text-muted-foreground">
                  Recommandé tous les 90 jours
                </p>
              </div>
              <Button variant="outline">
                <KeyRound className="size-4 mr-2" />
                Modifier
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Gérer les autres administrateurs</p>
                <p className="text-sm text-muted-foreground">
                  Voir et révoquer les accès admin
                </p>
              </div>
              <Button variant="outline">
                <Shield className="size-4 mr-2" />
                Gérer
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6" aria-labelledby="notifications-heading">
        <h2 id="notifications-heading" className="text-xl font-semibold">Notifications</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5 text-primary" />
              Préférences de notification
            </CardTitle>
            <CardDescription>
              Configurez les alertes reçues par email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <NotificationToggle
                label="Nouveaux vendeurs inscrits"
                description="Recevoir un email à chaque nouvelle inscription vendeur"
              />
              <NotificationToggle
                label="Nouvelles disponibilités publiées"
                description="Recevoir un email pour chaque signalement de disponibilité"
              />
              <NotificationToggle
                label="Alertes de stock critique"
                description="Notification quand un dépôt n'a plus de stock"
                defaultChecked
              />
              <NotificationToggle
                label="Rapports quotidiens"
                description="Résumé quotidien de l'activité de la plateforme"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6" aria-labelledby="appearance-heading">
        <h2 id="appearance-heading" className="text-xl font-semibold">Apparence</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-5 text-primary" />
              Thème et affichage
            </CardTitle>
            <CardDescription>
              Personnalisation de l'interface d'administration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Thème</label>
              <select className="w-full max-w-xs rounded-lg border bg-background px-3 py-2 text-sm">
                <option>Système (par défaut)</option>
                <option>Clair</option>
                <option>Sombre</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Densité d'affichage</label>
              <select className="w-full max-w-xs rounded-lg border bg-background px-3 py-2 text-sm">
                <option>Confortable (par défaut)</option>
                <option>Compact</option>
                <option>Spacieux</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6" aria-labelledby="data-heading">
        <h2 id="data-heading" className="text-xl font-semibold">Données et maintenance</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-5 text-primary" />
              Base de données
            </CardTitle>
            <CardDescription>
              Outils de maintenance et d'export des données
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline">
                <Database className="size-4 mr-2" />
                Exporter utilisateurs (CSV)
              </Button>
              <Button variant="outline">
                <Database className="size-4 mr-2" />
                Exporter vendeurs (CSV)
              </Button>
              <Button variant="outline">
                <Database className="size-4 mr-2" />
                Exporter disponibilités (CSV)
              </Button>
              <Button variant="outline">
                <Database className="size-4 mr-2" />
                Exporter points de vente (CSV)
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-destructive">Zone de danger</p>
                <p className="text-sm text-muted-foreground">
                  Actions irréversibles sur les données de la plateforme
                </p>
              </div>
              <Button variant="destructive" disabled>
                Purger les données de test
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function NotificationToggle({
  label,
  description,
  defaultChecked = false,
}: {
  label: string
  description: string
  defaultChecked?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
      />
    </div>
  )
}