"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { User, KeyRound, Trash2, Power, CheckCircle2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PhoneInput } from "@/app/_components/phone-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateUser, toggleUserStatus, deleteUser, resetUserPassword } from "@/app/admin/actions"
import { formatDate } from "@/lib/gaz"
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

type DialogKind = "edit" | "active" | "delete" | "reset" | null

export function AdminClientDetail({
  profile,
  currentUserId,
}: {
  profile: Profile
  currentUserId?: string
}) {
  const [, startTransition] = useTransition()
  const router = useRouter()
  const [dialog, setDialog] = useState<DialogKind>(null)
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)
  const [edit, setEdit] = useState({
    name: profile.name,
    email: profile.email,
    phoneNumber: profile.phoneNumber ?? "",
    role: profile.role === "vendor" ? "client" : profile.role,
  })

  const roleLabel = profile.role === "client" ? "Client" : "Usager"
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
        router.push("/admin/clients")
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
            <h1 className="text-3xl font-bold tracking-tight">Dtail du client</h1>
            <p className="mt-2 text-muted-foreground">Dtail du compte client et actions dadministration</p>
          </div>
          <Badge variant="secondary" className="gap-1.5 bg-info/10 text-info border-info/20">
            <User className="size-3" />
            {roleLabel}
          </Badge>
        </header>

        <div className="space-y-6">
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="flex items-center gap-3 p-5">
              <span className="text-3xl font-bold">{profile.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={profile.isActive ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                  {profile.isActive ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </div>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
              <div className="space-y-1.5">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Email</dt>
                <dd className="text-sm font-medium">{profile.email}</dd>
              </div>
              <div className="space-y-1.5">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Telephone</dt>
                <dd className="text-sm font-medium">
                  {profile.phoneNumber || <span className="text-muted-foreground">Non renseign</span>}
                </dd>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Date dinscription</dt>
                <dd className="text-sm font-medium">{formatDate(profile.createdAt)}</dd>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Email vriifi</dt>
                <Badge variant={profile.emailVerified ? "default" : "outline"} className="border-border">
                  {profile.emailVerified ? "Oui" : "Non"}
                </Badge>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Telephone vriifi</dt>
                <Badge variant={profile.phoneVerified === true ? "default" : "outline"} className="border-border">
                  {profile.phoneVerified === true ? "Oui" : profile.phoneVerified === false ? "Non" : "N/A"}
                </Badge>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Dernire modification</dt>
                <dd className="text-sm font-medium">{formatDate(profile.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isProtected && (
              <>
                <Button variant="outline" onClick={() => setDialog("edit")}>
                  <User className="size-4 mr-2" />
                  Modifier le profil
                </Button>
                <Button variant={profile.isActive ? "destructive" : "default"} onClick={() => setDialog("active")}>
                  <Power className="size-4 mr-2" />
                  {profile.isActive ? "Dsactiver le compte" : "Ractiver le compte"}
                </Button>
                <Button variant="outline" onClick={() => setDialog("reset")}>
                  <KeyRound className="size-4 mr-2" />
                  Rinitialiser mot de passe
                </Button>
                {!isSelf(profile.id, currentUserId) && (
                  <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDialog("delete")}>
                    <Trash2 className="size-4 mr-2" />
                    Supprimer le compte
                  </Button>
                )}
                {isSelf(profile.id, currentUserId) && (
                  <p className="text-sm text-muted-foreground">Vous consultez votre propre compte : certaines actions sont dsactivEs.</p>
                )}
              </>
            )}
            {isProtected && (
              <p className="text-sm text-muted-foreground">Les comptes dadministration ne peuvent pas tre modifies depuis cette page.</p>
            )}
          </div>

          {feedback && (
            <div
              className={cn(
                "flex items-center gap-2 text-sm rounded-lg border px-3 py-2",
                feedback.ok ? "text-success bg-success/5 border-success/20" : "text-destructive bg-destructive/5 border-destructive/20"
              )}
            >
              {feedback.ok ? <CheckCircle2 className="size-4 shrink-0" /> : <X className="size-4 shrink-0" />}
              <span className="break-words">{feedback.message}</span>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialog === "edit"} onOpenChange={(o) => { if (!o) setDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
            <DialogDescription>Mise jour du nom, de lmail et du rle</DialogDescription>
          </DialogHeader>
          <form action={handleSubmitEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" name="name" value={edit.name} onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Mail</Label>
              <Input id="email" name="email" type="email" value={edit.email} onChange={(e) => setEdit((s) => ({ ...s, email: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <PhoneInput
                id="phoneNumber"
                name="phoneNumber"
                label="Telephone"
                value={edit.phoneNumber ?? undefined}
                onChange={(normalized) => setEdit((s) => ({ ...s, phoneNumber: normalized ?? "" }))}
                />
            </div>
            {feedback && (
              <p role="alert" className={cn("text-sm", feedback.ok ? "text-success" : "text-destructive")}>{feedback.message}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "active"} onOpenChange={(o) => { if (!o) setDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{profile.isActive ? "Dsactiver le compte" : "Ractiver le compte"}</DialogTitle>
            <DialogDescription>
              {profile.isActive
                ? <span> <span className="font-medium">{profile.name}</span> ne pourra plus se connecter tant que le compte reste inactif.</span>
                : <span> <span className="font-medium">{profile.name}</span> pourra retrouver se connecter.</span>}
            </DialogDescription>
          </DialogHeader>
          {feedback && (
            <p role="alert" className={cn("text-sm", feedback.ok ? "text-success" : "text-destructive")}>{feedback.message}</p>
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

      <Dialog open={dialog === "delete"} onOpenChange={(o) => { if (!o) setDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le compte</DialogTitle>
            <DialogDescription>
              Voulez vraiment supprimer dfinitivement le compte de {" "}
              <span className="font-medium text-foreground">{profile.name}</span> ({profile.email})?
              Cette action est irrfutable.
            </DialogDescription>
          </DialogHeader>
          {feedback && (
            <p role="alert" className={cn("text-sm", feedback.ok ? "text-success" : "text-destructive")}>{feedback.message}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="size-4 mr-2" />
              Supprimer dfinitivement
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "reset"} onOpenChange={(o) => { if (!o) setDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Laissez vide pour gnorer un mot de passe temporaire alatoire, ou saisissez un
              nouveau mot de passe (8 caractres minimum).
            </DialogDescription>
          </DialogHeader>
          <form action={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Nouveau mot de passe (facultatif)</Label>
              <Input id="newPassword" name="newPassword" type="text" placeholder="Mot de passe temporaire" />
            </div>
            {feedback && (
              <p role="alert" className={cn("text-sm font-medium break-words", feedback.ok ? "text-success" : "text-destructive")}>{feedback.message}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>Annuler</Button>
              <Button type="submit">Rinitialiser</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function isSelf(userId: string, currentUserId?: string): boolean {
  return userId === currentUserId
}
