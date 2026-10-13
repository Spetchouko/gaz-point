"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { createAdminCollaborator, type ActionResult } from "@/app/admin/actions"

export function AdminCollaborateurForm() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const role = (session?.user as { role?: string } | undefined)?.role
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [feedback, setFeedback] = useState<ActionResult | null>(null)

  // Seul l'administrateur (super-admin) peut créer des accès collaborateurs.
  // Le contrôle serveur reste assuré par requireAdmin() dans l'action.
  if (role !== "admin") return null

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    setFeedback(null)
    try {
      const result = await createAdminCollaborator(null, formData)
      setFeedback(result)
      if (result.ok) {
        router.refresh()
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        className="gap-2"
        onClick={() => {
          setFeedback(null)
          setOpen(true)
        }}
      >
        <UserPlus className="size-4" />
        Nouveau collaborateur
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un collaborateur</DialogTitle>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="collab-name">Nom</Label>
                <Input id="collab-name" name="name" placeholder="Ex: Jean Dupont" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="collab-email">Email</Label>
                <Input
                  id="collab-email"
                  name="email"
                  type="email"
                  placeholder="collaborateur@gazpoint.cm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="collab-phoneNumber">Téléphone</Label>
                <Input
                  id="collab-phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+237 6 99 00 00 00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="collab-password">Mot de passe</Label>
                <Input
                  id="collab-password"
                  name="password"
                  type="password"
                  minLength={8}
                  placeholder="8 caractères minimum"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Le collaborateur pourra consulter le tableau de bord et exporter les
              données. Seul l&apos;administrateur peut gérer les accès.
            </p>

            {feedback && (
              <p
                role={feedback.ok ? "status" : "alert"}
                className={
                  feedback.ok
                    ? "flex items-center gap-2 text-sm text-emerald-600"
                    : "text-sm text-destructive"
                }
              >
                {feedback.ok && <CheckCircle2 className="size-4" />}
                {feedback.message}
              </p>
            )}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Créer le collaborateur"
                )}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Fermer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
