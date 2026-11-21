"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Mail, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useCallback, useState } from "react"
import Image from "next/image"
import { ButtonSpinner } from "@/app/_components/spinner"

function validateEmail(email: string): string | null {
  if (!email.trim()) return "L'adresse e-mail est requise."
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return "Format d'e-mail invalide."
  return null
}

export function MotDePasseDemanderPageContent() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [showEmail, setShowEmail] = useState(false)
  const [error, setError] = useState("")
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleInputChange = useCallback((value: string) => {
    setEmail(value)
    if (fieldError) setFieldError(null)
    if (error) setError("")
  }, [fieldError, error])

  const validateForm = () => {
    const emailError = validateEmail(email)
    const errors: { email?: string } = {}
    if (emailError) errors.email = emailError
    setFieldError(errors.email ?? null)
    return !emailError
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    if (!validateForm()) {
      return
    }

    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/password-reset/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || "Échec de l'envoi.")
      }

      // Anti-énumération : on affiche toujours "succès" même si l'email est inconnu.
      setSuccess(true)
      setLoading(false)
    } catch {
      setError("Une erreur inattendue est survenue. Veuillez réessayer.")
      setLoading(false)
    }
  }

  const handleInputBlur = () => {
    setSubmitted(true)
    if (!validateForm()) {
      return
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-success/10 text-success ring-1 ring-success/20">
              <CheckCircle2 className="size-6" />
            </div>
            <CardTitle className="text-2xl">E-mail envoyé</CardTitle>
            <p className="text-muted-foreground">
              Si un compte est associé à cette adresse e-mail, vous recevrez un lien de réinitialisation.
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <Button className="w-full" onClick={() => router.push("/connexion")}>
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Button
            render={<Link href="/" />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="justify-start gap-1 text-muted-foreground hover:text-foreground"
          >
            <Mail className="size-4" />
            Retour à l’accueil
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Image
                src="/brand/logo.png"
                alt="GazPoints"
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
              />
            </div>
            <CardTitle className="text-xl font-bold">Mot de passe oublié</CardTitle>
            <p className="text-sm text-muted-foreground">
              Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onBlur={handleInputBlur}
                    required
                    className="pl-9"
                    disabled={loading}
                    aria-invalid={submitted && !!fieldError}
                    aria-describedby={submitted && fieldError ? "email-error" : undefined}
                  />
                </div>
                {submitted && fieldError && (
                  <p id="email-error" className="text-sm text-destructive" role="alert">
                    {fieldError}
                  </p>
                )}
              </div>

              {error && (
                <div
                  className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2"
                  role="alert"
                >
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <>
                    <ButtonSpinner />
                    Envoi…
                  </>
                ) : (
                  "Envoyer le lien de réinitialisation"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Vous vous souvenez de votre mot de passe ?{" "}
              <Link href="/connexion" className="text-primary hover:underline font-medium">
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function MotDePasseDemanderPage() {
  return <MotDePasseDemanderPageContent />
}
