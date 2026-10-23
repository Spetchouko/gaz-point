"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

function validatePassword(password: string): string | null {
  if (!password) return "Le mot de passe est requis."
  if (password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères."
  return null
}

function ResetPasswordPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const redirectTo = searchParams.get("redirect") ?? "/connexion"
  const { data: session } = authClient.useSession()

  useEffect(() => {
    if (session?.user) {
      router.push("/dashboard")
    }
  }, [session, router])

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const validateForm = () => {
    const passwordError = validatePassword(password)
    let confirmError: string | null = null
    if (password !== confirmPassword) {
      confirmError = "Les mots de passe ne correspondent pas."
    }
    const errors: { password?: string; confirmPassword?: string } = {}
    if (passwordError) errors.password = passwordError
    if (confirmError) errors.confirmPassword = confirmError
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    if (!token) {
      setError("Lien de réinitialisation invalide ou expiré.")
      return
    }

    if (!validateForm()) {
      return
    }

    setError("")
    setLoading(true)

    try {
      const { error: resetError } = await authClient.resetPassword({
        token,
        newPassword: password,
      })

      if (resetError) {
        setError(resetError.message ?? "Impossible de réinitialiser le mot de passe.")
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)

      setTimeout(() => {
        router.push(redirectTo)
      }, 2000)
    } catch {
      setError("Une erreur inattendue est survenue. Veuillez réessayer.")
      setLoading(false)
    }
  }

  const handleInputChange = (field: "password" | "confirmPassword", value: string) => {
    if (field === "password") setPassword(value)
    if (field === "confirmPassword") setConfirmPassword(value)
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (error) setError("")
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-success/10 text-success ring-1 ring-success/20">
              <CheckCircle2 className="size-6" />
            </div>
            <CardTitle className="text-2xl">Mot de passe réinitialisé</CardTitle>
            <p className="text-muted-foreground">
              Votre mot de passe a été mis à jour avec succès.
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <Button className="w-full" onClick={() => router.push(redirectTo)}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Image
              src="/brand/logo.png"
              alt="GazPoints"
              width={26}
              height={26}
              className="h-6.5 w-6.5 object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
          <p className="text-muted-foreground">
            Entrez votre nouveau mot de passe ci-dessous
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {!token && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2" role="alert">
              <AlertCircle className="size-4 shrink-0" />
              Lien de réinitialisation invalide ou expiré.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="8 caractères minimum"
                  value={password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  onBlur={() => setSubmitted(true)}
                  required
                  minLength={8}
                  className="pl-10 pr-10"
                  disabled={loading || !token}
                  aria-invalid={submitted && !!fieldErrors.password}
                  aria-describedby={submitted && fieldErrors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading || !token}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {submitted && fieldErrors.password && (
                <p id="password-error" className="text-sm text-destructive" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirmez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  onBlur={() => setSubmitted(true)}
                  required
                  minLength={8}
                  className="pl-10 pr-10"
                  disabled={loading || !token}
                  aria-invalid={submitted && !!fieldErrors.confirmPassword}
                  aria-describedby={submitted && fieldErrors.confirmPassword ? "confirm-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading || !token}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {submitted && fieldErrors.confirmPassword && (
                <p id="confirm-error" className="text-sm text-destructive" role="alert">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2" role="alert">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || !token}>
              {loading ? <Loader2 className="size-4 mr-2 animate-spin" /> : "Réinitialiser le mot de passe"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Retour à la{" "}
            <Link href="/connexion" className="text-primary hover:underline font-medium">
              connexion
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageContent />
    </Suspense>
  )
}