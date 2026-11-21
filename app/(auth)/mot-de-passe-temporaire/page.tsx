"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSafeSession } from "@/lib/auth-session"
import { changeTemporaryPassword } from "@/lib/auth-actions"
import type { ActionResult } from "@/lib/action-result"
import { Button } from "@/components/ui/button"
import { PasswordField } from "@/components/ui/password-field"
import { ButtonSpinner } from "@/app/_components/spinner"
import { AlertCircle, CheckCircle2, Loader2, Lock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function MotDePasseTemporairePage() {
  const router = useRouter()
  const { data: session, isPending: isSessionPending } = useSafeSession()

  const [isPending, setIsPending] = useState(false)
  const [feedback, setFeedback] = useState<ActionResult | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  }>({})

  // La route est déjà protégée côté serveur. Cette vérification évite seulement
  // d'afficher le formulaire pendant que la session est encore en chargement.
  useEffect(() => {
    if (isSessionPending) return
    if (!session?.user) {
      router.push("/connexion-admin")
    }
  }, [isSessionPending, session, router])

  const validateForm = () => {
    const errors: {
      currentPassword?: string
      newPassword?: string
      confirmPassword?: string
    } = {}
    if (!currentPassword) {
      errors.currentPassword = "Le mot de passe temporaire est requis."
    }
    if (!newPassword) errors.newPassword = "Le nouveau mot de passe est requis."
    else if (newPassword.length < 8)
      errors.newPassword = "Le mot de passe doit contenir au moins 8 caractères."
    if (!confirmPassword) errors.confirmPassword = "La confirmation est requise."
    else if (newPassword !== confirmPassword)
      errors.confirmPassword = "Les deux mots de passe ne correspondent pas."
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsPending(true)
    setFeedback(null)

    try {
      const formData = new FormData()
      formData.set("currentPassword", currentPassword)
      formData.set("newPassword", newPassword)
      formData.set("confirmPassword", confirmPassword)

      const result = await changeTemporaryPassword(null, formData)
      setFeedback(result)

      if (result.ok) {
        setTimeout(() => {
          window.location.assign("/api/auth/role-redirect")
        }, 1000)
      }
    } catch {
      setFeedback({ ok: false, message: "Une erreur inattendue est survenue." })
    } finally {
      setIsPending(false)
    }
  }

  // Si la session n'est pas disponible, la redirection est gérée par useEffect.
  if (isSessionPending || !session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Dialog open>
        <DialogContent className="sm:max-w-md bg-card" showCloseButton={false}>
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-warning/10 text-warning ring-1 ring-warning/20">
              <Lock className="size-6" />
            </div>
            <DialogTitle className="text-xl font-bold">Mot de passe temporaire</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Votre mot de passe actuel est temporaire. Pour sécuriser votre compte,
              veuillez définir un nouveau mot de passe avant de continuer.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div className="space-y-2">
              <PasswordField
                id="current-password"
                name="currentPassword"
                label="Mot de passe temporaire"
                placeholder="Votre mot de passe actuel"
                autoComplete="current-password"
                value={currentPassword}
                onChange={setCurrentPassword}
                required
                ariaInvalid={!!fieldErrors.currentPassword}
                ariaDescribedby={
                  fieldErrors.currentPassword ? "current-password-error" : undefined
                }
              />
              {fieldErrors.currentPassword && (
                <p id="current-password-error" className="text-sm text-destructive" role="alert">
                  {fieldErrors.currentPassword}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <PasswordField
                id="new-password"
                name="newPassword"
                label="Nouveau mot de passe"
                placeholder="8 caractères minimum"
                minLength={8}
                value={newPassword}
                onChange={setNewPassword}
                required
                autoComplete="new-password"
                ariaInvalid={!!fieldErrors.newPassword}
                ariaDescribedby={
                  fieldErrors.newPassword ? "new-password-error" : undefined
                }
              />
              {fieldErrors.newPassword && (
                <p id="new-password-error" className="text-sm text-destructive" role="alert">
                  {fieldErrors.newPassword}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <PasswordField
                id="confirm-password"
                name="confirmPassword"
                label="Confirmer le nouveau mot de passe"
                placeholder="Répétez le mot de passe"
                minLength={8}
                value={confirmPassword}
                onChange={setConfirmPassword}
                required
                autoComplete="new-password"
                ariaInvalid={!!fieldErrors.confirmPassword}
                ariaDescribedby={
                  fieldErrors.confirmPassword ? "confirm-password-error" : undefined
                }
              />
              {fieldErrors.confirmPassword && (
                <p id="confirm-password-error" className="text-sm text-destructive" role="alert">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {feedback && !feedback.ok && (
              <div
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2"
                role="alert"
              >
                <AlertCircle className="size-4 shrink-0" />
                {feedback.message}
              </div>
            )}

            {feedback && feedback.ok && (
              <div
                className="rounded-md bg-success/10 p-3 text-sm text-success flex items-center gap-2"
                role="status"
              >
                <CheckCircle2 className="size-4 shrink-0" />
                {feedback.message}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isPending || Boolean(feedback?.ok)}
            >
              {isPending ? (
                <ButtonSpinner />
              ) : feedback?.ok ? (
                "Mot de passe modifié"
              ) : (
                "Changer mon mot de passe"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
