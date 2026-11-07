"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  KeyRound,
  Mail,
  Phone,
  Power,
  Shield,
  UserCheck,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
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
import { AdminCollabPermissionsDialog } from "@/app/_components/admin-collab-permissions-dialog"
import { ADMIN_MODULE_LABELS, type AdminModuleUi } from "@/app/_components/admin-module-labels"
import {
  toggleAdminCollaboratorStatus,
  type ActionResult,
} from "@/app/admin/actions"
import { formatDate, formatDateTime } from "@/lib/gaz"
import { cn } from "@/lib/utils"

type CollaborateurProfile = {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  image: string | null
  emailVerified: boolean
  phoneVerified: boolean | null
  createdAt: Date | string
  updatedAt: Date | string
}

export function AdminCollaborateurDetail({
  profile,
  permissions,
  currentUserId,
}: {
  profile: CollaborateurProfile
  permissions: AdminModuleUi[]
  currentUserId: string
}) {
  const [, startTransition] = useTransition()
  const router = useRouter()
  const [permissionsOpen, setPermissionsOpen] = useState(false)
  const [confirmDisable, setConfirmDisable] = useState(false)
  const [feedback, setFeedback] = useState<ActionResult | null>(null)

  const isAdmin = profile.role === "admin"
  const isSelf = profile.id === currentUserId
  const roleLabel = isAdmin ? "Administrateur" : "Collaborateur"
  const roleColor = isAdmin
    ? "bg-navy/10 text-navy"
    : "bg-navy/10 text-navy"

  const handleDisable = () => {
    setFeedback(null)
    const formData = new FormData()
    formData.set("userId", profile.id)
    formData.set("currentRole", profile.role)
    startTransition(async () => {
      const result = await toggleAdminCollaboratorStatus(null, formData)
      setFeedback(result)
      if (result.ok) {
        setConfirmDisable(false)
        router.push("/admin/collaborateurs")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2"
          render={<Link href="/admin/collaborateurs" />}
          nativeButton={false}
        >
          <ArrowLeft className="size-4 mr-2" />
          Retour aux collaborateurs
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fiche collaborateur</h1>
            <p className="mt-1 text-muted-foreground">
              Compte créé le {formatDate(profile.createdAt)}
            </p>
          </div>
          <Badge variant="secondary" className={cn("gap-1.5", roleColor)}>
            {isAdmin ? <Shield className="size-3" /> : <UserCheck className="size-3" />}
            {roleLabel}
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={profile.image ?? undefined} alt={profile.name} />
              <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                {profile.name?.charAt(0).toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-2xl font-semibold">{profile.name}</p>
              <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
            </div>
            {isSelf && (
              <Badge variant="outline" className="bg-muted">
                Vous
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="size-5 text-primary" />
              Informations
            </CardTitle>
            <CardDescription>Coordonnées et état du compte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <a href={`mailto:${profile.email}`} className="hover:text-primary">
                {profile.email}
              </a>
              {profile.emailVerified && (
                <Badge
                  variant="outline"
                  className="bg-success/5 text-success border-success/20"
                >
                  Email vérifié
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" />
              {profile.phoneNumber ? (
                <a href={`tel:${profile.phoneNumber}`} className="hover:text-primary">
                  {profile.phoneNumber}
                </a>
              ) : (
                <span className="text-muted-foreground">Non renseigné</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Créé le {formatDate(profile.createdAt)} · modifié le{" "}
                {formatDateTime(profile.updatedAt)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="size-5 text-primary" />
              Permissions
            </CardTitle>
            <CardDescription>Modules accessibles à ce compte</CardDescription>
            {!isAdmin && (
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPermissionsOpen(true)}
                >
                  <KeyRound className="size-4 mr-2" />
                  Gérer
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <Badge variant="secondary" className="bg-navy/10 text-navy">
                Tous les accès
              </Badge>
            ) : permissions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {permissions.map((p) => (
                  <Badge key={p} variant="outline">
                    {ADMIN_MODULE_LABELS[p]}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Consultation seule (aucun module attribué).
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Power className="size-5 text-primary" />
            Actions
          </CardTitle>
          <CardDescription>Gestion du statut de ce compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSelf ? (
            <p className="text-sm text-muted-foreground">
              Vous consultez votre propre compte : la désactivation n&apos;est pas
              disponible.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button variant="destructive" onClick={() => setConfirmDisable(true)}>
                <Power className="size-4 mr-2" />
                Désactiver (→ Usager)
              </Button>
            </div>
          )}

          {feedback && !feedback.ok && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <X className="size-4 shrink-0" />
              <span className="break-words">{feedback.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {!isAdmin && (
        <AdminCollabPermissionsDialog
          open={permissionsOpen}
          onClose={() => {
            setPermissionsOpen(false)
            router.refresh()
          }}
          collaboratorId={profile.id}
          collaboratorName={profile.name}
          initialModules={permissions}
        />
      )}

      <Dialog
        open={confirmDisable}
        onOpenChange={(o) => {
          if (!o) setConfirmDisable(false)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Désactiver le collaborateur</DialogTitle>
            <DialogDescription>
              « {profile.name} » perd ses accès d&apos;administration et redevient un
              usager classique.
            </DialogDescription>
          </DialogHeader>
          {feedback && !feedback.ok && (
            <p role="alert" className="text-sm text-destructive">
              {feedback.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDisable(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDisable}>
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
