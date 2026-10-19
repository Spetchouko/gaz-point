"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { User, Store, Calendar, Shield, KeyRound, Settings, Power, Trash2, CheckCircle2, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  updateUser,
  toggleVendorStatus,
  toggleUserStatus,
  deleteUser,
  resetUserPassword,
  type ActionResult,
} from "@/app/admin/actions"
import { formatDate, formatDateTime } from "@/lib/gaz"
import { cn } from "@/lib/utils"

type Profile = {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  isActive: boolean
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
  collaborateur: { label: "Collaborateur", color: "bg-orange-100 text-orange-700", icon: User },
}

type DialogKind = "edit" | "role" | "active" | "delete" | "reset" | null

export function AdminUserDetail({
  profile,
  currentUserId,
}: {
  profile: Profile
  currentUserId?: string
}) {
  const [, startTransition] = useTransition()
  const router = useRouter()
  const [dialog, setDialog] = useState<DialogKind>(null)
  const [feedback, setFeedback] = useState<ActionResult | null>(null)
  const [edit, setEdit] = useState({
    name: profile.name,
    email: profile.email,
    phoneNumber: profile.phoneNumber ?? "",
    role: profile.role,
  })

  const role = roleConfig[profile.role] ?? { label: profile.role, color: "bg-muted text-foreground", icon: User }
  const isSelf = profile.id === currentUserId
  const isProtected = profile.role === "admin" || profile.role === "collaborateur"

  const handleSubmitEdit = (formData: FormData) => {
    formData.set("userId", profile.id)
    startTransition(async () => {
      setFeedback(null)
      const result = await updateUser(null, formData)
      setFeedback(result)
      if (result.ok) {
        setDialog(null)
        router.refresh()
      }
    })
  }

  const handleDelete = () => {
    const formData = new FormData()
    formData.set("userId", profile.id)
    setFeedback(null)
    startTransition(async () => {
      const result = await deleteUser(null, formData)
      setFeedback(result)
      if (result.ok) {
        router.push("/admin/users")
        router.refresh()
      }
    })
  }

  const handleReset = (formData: FormData) => {
    formData.set("userId", profile.id)
    void formData
    setFeedback(null)
    startTransition(async () => {
      const result = await resetUserPassword(null, formData)
      setFeedback(result)
    })
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fiche utilisateur</h1>
            <p className="mt-2 text-muted-foreground">Détails du compte et actions d&apos;administration</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn("gap-1.5", role.color)}>
              <role.icon className="size-3" />
              {role.label}
            </Badge>
            <Badge variant="outline" className={profile.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}>
              {profile.isActive ? "Compte actif" : "Compte inactif"}
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
                    <User className="size-5 text-primary" />
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
                    Actions d&apos;administration
                  </CardTitle>
                  <CardDescription>Actions disponibles pour cet utilisateur</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    {!isProtected && (
                      <Button variant="outline" onClick={() => setDialog("edit")}>
                        <User className="size-4 mr-2" />
                        Modifier le profil
                      </Button>
                    )}
                    {!isProtected && profile.role !== "admin" && (
                      <Button
                        variant={profile.role === "vendor" ? "destructive" : "default"}
                        onClick={() => setDialog("role")}
                      >
                        <Settings className="size-4 mr-2" />
                        {profile.role === "vendor" ? "Rétrograder (→ Usager)" : "Promouvoir Vendeur"}
                      </Button>
                    )}
                    {!isProtected && (
                      <Button variant={profile.isActive ? "destructive" : "default"} onClick={() => setDialog("active")}>
                        <Power className="size-4 mr-2" />
                        {profile.isActive ? "Désactiver le compte" : "Réactiver le compte"}
                      </Button>
                    )}
                    {!isProtected && (
                      <Button variant="outline" onClick={() => setDialog("reset")}>
                        <KeyRound className="size-4 mr-2" />
                        Réinitialiser mot de passe
                      </Button>
                    )}
                    {!isProtected && !isSelf && (
                      <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDialog("delete")}>
                        <Trash2 className="size-4 mr-2" />
                        Supprimer le compte
                      </Button>
                    )}
                    {isProtected && (
                      <p className="text-sm text-muted-foreground">
                        Les comptes d&apos;administration ne peuvent pas être modifiés depuis cette page.
                      </p>
                    )}
                  </div>

                  {feedback && (
                    <div
                      className={cn(
                        "flex items-center gap-2 text-sm rounded-lg border px-3 py-2",
                        feedback.ok ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-700 bg-red-50 border-red-200"
                      )}
                    >
                      {feedback.ok ? <CheckCircle2 className="size-4 shrink-0" /> : <X className="size-4 shrink-0" />}
                      <span className="break-words">{feedback.message}</span>
                    </div>
                  )}
                  {isSelf && (
                    <p className="text-xs text-muted-foreground">
                      Vous consultez votre propre compte : certaines actions sont désactivées.
                    </p>
                  )}
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
                  <CardDescription>Informations liées à l&apos;authentification</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5 p-4 rounded-lg bg-muted/30">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Authentification</label>
                    <p className="text-sm">Gérée par Better Auth (email/mot de passe + Google OAuth)</p>
                  </div>
                  <div className="space-y-1.5 p-4 rounded-lg bg-muted/30">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sessions actives</label>
                    <p className="text-sm text-muted-foreground">La connexion sera refusée tant que le compte est inactif</p>
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

      <Dialog open={dialog === "edit"} onOpenChange={(o) => { if (!o) setDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
            <DialogDescription>Mise à jour du nom, de l&apos;email et du rôle</DialogDescription>
          </DialogHeader>
          <form action={handleSubmitEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" name="name" value={edit.name} onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={edit.email} onChange={(e) => setEdit((s) => ({ ...s, email: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber">Téléphone</Label>
              <Input id="phoneNumber" name="phoneNumber" value={edit.phoneNumber} onChange={(e) => setEdit((s) => ({ ...s, phoneNumber: e.target.value }))} placeholder="+237 6 99 00 00 00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Rôle</Label>
              <Select value={edit.role === "admin" || edit.role === "collaborateur" ? "client" : edit.role} onValueChange={(v) => setEdit((s) => ({ ...s, role: (v ?? "client") as "client" | "vendor" }))}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Usager</SelectItem>
                  <SelectItem value="vendor">Vendeur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {feedback && (
              <p role="alert" className={cn("text-sm", feedback.ok ? "text-emerald-600" : "text-destructive")}>{feedback.message}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "role"} onOpenChange={(o) => { if (!o) setDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {profile.role === "vendor" ? "Rétrograder le compte" : "Promouvoir en vendeur"}
            </DialogTitle>
            <DialogDescription>
              {profile.role === "vendor"
                ? `« ${profile.name} » redeviendra un usager classique : son compte perd le rôle vendeur.`
                : `« ${profile.name} » deviendra un vendeur avec accès au tableau de bord professionnel.`}
            </DialogDescription>
          </DialogHeader>
          {feedback && (
            <p role="alert" className={cn("text-sm", feedback.ok ? "text-emerald-600" : "text-destructive")}>{feedback.message}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)}>Annuler</Button>
            <Button
              variant={profile.role === "vendor" ? "destructive" : "default"}
              onClick={() => {
                setFeedback(null)
                const formData = new FormData()
                formData.set("userId", profile.id)
                formData.set("currentRole", profile.role)
                startTransition(async () => {
                  const result = await toggleVendorStatus(null, formData)
                  setFeedback(result)
                  if (result.ok) {
                    setDialog(null)
                    window.location.reload()
                  }
                })
              }}
            >
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "active"} onOpenChange={(o) => { if (!o) setDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{profile.isActive ? "Désactiver le compte" : "Réactiver le compte"}</DialogTitle>
            <DialogDescription>
              {profile.isActive
                ? `« ${profile.name} » ne pourra plus se connecter tant que le compte reste inactif.`
                : `« ${profile.name} » pourra à nouveau se connecter.`}
            </DialogDescription>
          </DialogHeader>
          {feedback && (
            <p role="alert" className={cn("text-sm", feedback.ok ? "text-emerald-600" : "text-destructive")}>{feedback.message}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)}>Annuler</Button>
            <Button
              variant={profile.isActive ? "destructive" : "default"}
              onClick={() => {
                setFeedback(null)
                const formData = new FormData()
                formData.set("userId", profile.id)
                formData.set("currentActive", String(profile.isActive))
                startTransition(async () => {
                  const result = await toggleUserStatus(null, formData)
                  setFeedback(result)
                  if (result.ok) {
                    setDialog(null)
                    window.location.reload()
                  }
                })
              }}
            >
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "reset"} onOpenChange={(o) => { if (!o) setDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Laissez vide pour générer un mot de passe temporaire aléatoire, ou saisissez un
              nouveau mot de passe (8 caractères minimum).
            </DialogDescription>
          </DialogHeader>
          <form action={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Nouveau mot de passe (facultatif)</Label>
              <Input id="newPassword" name="newPassword" type="text" placeholder="Mot de passe temporaire" />
            </div>
            {feedback && (
              <p role="alert" className={cn("text-sm font-medium break-words", feedback.ok ? "text-emerald-600" : "text-destructive")}>{feedback.message}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>Annuler</Button>
              <Button type="submit">Réinitialiser</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "delete"} onOpenChange={(o) => { if (!o) setDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le compte</DialogTitle>
            <DialogDescription>
              Voulez-vous vraiment supprimer définitivement le compte de {" "}
              <span className="font-medium text-foreground">{profile.name}</span> ({profile.email})
              ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {feedback && (
            <p role="alert" className={cn("text-sm", feedback.ok ? "text-emerald-600" : "text-destructive")}>{feedback.message}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="size-4 mr-2" />
              Supprimer définitivement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}