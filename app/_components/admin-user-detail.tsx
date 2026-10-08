"use client"

import { User, Mail, Phone, Calendar, Shield, KeyRound, MapPin, Settings } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate, formatDateTime } from "@/lib/gaz"
import { cn } from "@/lib/utils"

type Profile = {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  image: string | null
  createdAt: Date | string
  updatedAt: Date | string
  emailVerified: boolean
  phoneVerified: boolean | null
}

const roleConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  client: { label: "Usager", color: "bg-sky-100 text-sky-700", icon: User },
  vendor: { label: "Vendeur", color: "bg-emerald-100 text-emerald-700", icon: Store },
  admin: { label: "Administrateur", color: "bg-purple-100 text-purple-700", icon: Shield },
}

import { User as UserIcon, Store, Shield } from "lucide-react"

export function AdminUserDetail({ profile }: { profile: Profile }) {
  const role = roleConfig[profile.role] ?? { label: profile.role, color: "bg-muted text-foreground", icon: UserIcon }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fiche utilisateur</h1>
            <p className="mt-2 text-muted-foreground">Détails du compte et actions d'administration</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn("gap-1.5", role.color)}>
              <role.icon className="size-3" />
              {role.label}
            </Badge>
          </div>
        </header>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar className="size-20">
                  <AvatarImage src={profile.image ?? undefined} alt={profile.name} />
                  <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
                    {profile.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-2xl font-semibold">{profile.name}</p>
                    <Badge variant="secondary" className={role.color}>
                      <role.icon className="size-3" />
                      {role.label}
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Membre depuis le {formatDate(profile.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="infos" className="space-y-6">
            <TabsList aria-label="Sections du profil">
              <TabsTrigger value="infos">Informations</TabsTrigger>
              <TabsTrigger value="technique">Technique</TabsTrigger>
              <TabsTrigger value="securite">Sécurité</TabsTrigger>
            </TabsList>

            <TabsContent value="infos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="size-5 text-primary" />
                    Informations personnelles
                  </CardTitle>
                  <CardDescription>Détails du compte utilisateur</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nom complet</label>
                    <p className="font-medium">{profile.name}</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                    <a href={`mailto:${profile.email}`} className="text-foreground hover:text-primary underline-offset-2 hover:underline">
                      {profile.email}
                    </a>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Téléphone</label>
                    <p>{profile.phoneNumber ? (
                      <a href={`tel:${profile.phoneNumber}`} className="text-foreground hover:text-primary underline-offset-2 hover:underline">
                        {profile.phoneNumber}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Non renseigné</span>
                    )}</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rôle</label>
                    <Badge variant="secondary" className={role.color}>
                      <role.icon className="size-3" />
                      {role.label}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email vérifié</label>
                    <Badge variant={profile.emailVerified ? "default" : "outline"}>
                      {profile.emailVerified ? "Vérifié" : "Non vérifié"}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Téléphone vérifié</label>
                    <Badge variant={profile.phoneVerified ? "default" : "outline"}>
                      {profile.phoneVerified ? "Vérifié" : "Non vérifié"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="size-5 text-primary" />
                    Actions d'administration
                  </CardTitle>
                  <CardDescription>Actions disponibles pour cet utilisateur</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button variant="outline">
                    <UserIcon className="size-4 mr-2" />
                    Modifier le profil
                  </Button>
                  {profile.role !== "admin" && (
                    <Button variant={profile.role === "vendor" ? "destructive" : "default"}>
                      <Settings className="size-4 mr-2" />
                      {profile.role === "vendor" ? "Désactiver (→ Usager)" : "Promouvoir Vendeur"}
                    </Button>
                  )}
                  <Button variant="outline">
                    <KeyRound className="size-4 mr-2" />
                    Réinitialiser mot de passe
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technique" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="size-5 text-primary" />
                    Dates importantes
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 p-4 rounded-lg bg-muted/30">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Créé le</label>
                    <p className="font-mono text-sm">{formatDateTime(profile.createdAt)}</p>
                  </div>
                  <div className="space-y-1.5 p-4 rounded-lg bg-muted/30">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dernière modification</label>
                    <p className="font-mono text-sm">{formatDateTime(profile.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="size-5 text-primary" />
                    Identifiants techniques
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5 p-4 rounded-lg bg-muted/30">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">User ID</label>
                    <code className="font-mono text-sm break-all">{profile.id}</code>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="securite" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="size-5 text-primary" />
                    Sécurité du compte
                  </CardTitle>
                  <CardDescription>Informations liées à l'authentification</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5 p-4 rounded-lg bg-muted/30">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Authentification</label>
                    <p className="text-sm">Gérée par Better Auth (email/mot de passe + Google OAuth)</p>
                  </div>
                  <div className="space-y-1.5 p-4 rounded-lg bg-muted/30">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sessions actives</label>
                    <p className="text-sm text-muted-foreground">Consulter via l'interface d'administration Better Auth</p>
                  </div>
                  <div className="space-y-1.5 p-4 rounded-lg bg-muted/30">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Comptes liés</label>
                    <p className="text-sm text-muted-foreground">Google (si connecté via OAuth)</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}