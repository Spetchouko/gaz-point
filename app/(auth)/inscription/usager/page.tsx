"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react"
import { useState } from "react"

const MODE_EMAIL = "email"

function validateEmail(email: string): string | null {
  if (!email.trim()) return "L'email est requis."
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return "Format d'email invalide."

  const domain = email.split("@")[1]?.toLowerCase()
  if (
    domain &&
    [
      "10minutemail.com",
      "guerrillamail.com",
      "mailinator.com",
      "tempmail.com",
      "throwawaymail.com",
      "yopmail.com",
      "trashmail.com",
      "getnada.com",
      "maildrop.cc",
      "sharklasers.com",
      "grr.la",
      "spamgourmet.com",
      "temp-mail.org",
      "fakeinbox.com",
      "dispostable.com",
      "mintemail.com",
    ].includes(domain)
  ) {
    return "Les emails temporaires ne sont pas autorisés."
  }
  return null
}

function validatePassword(password: string): string | null {
  if (!password) return "Le mot de passe est requis."
  if (password.length < 6) return "Le mot de passe doit contenir au moins 6 caractères."
  return null
}

function validateName(name: string): string | null {
  if (!name.trim()) return "Le nom est requis."
  if (name.trim().length < 2) return "Le nom doit contenir au moins 2 caractères."
  if (name.trim().length > 50) return "Le nom ne doit pas dépasser 50 caractères."
  return null
}

// -------------------------------------------------------------------
// Page d'inscription usager — mode email uniquement
// -------------------------------------------------------------------
function InscriptionUsagerContent() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const role = "client"

  const searchRedirect = useSearchParams().get("redirect")
  const redirectTo = searchRedirect ?? "/dashboard"

  useEffect(() => {
    if (session?.user) {
      router.push(redirectTo)
    }
  }, [session, router, redirectTo])

  // ---------- État du formulaire ----------
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    email?: string
    password?: string
  }>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // ---------- Validation ----------
  const validateForm = () => {
    const nameError = validateName(name)
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    const errors: {
      name?: string
      email?: string
      password?: string
    } = {}
    if (nameError) errors.name = nameError
    if (emailError) errors.email = emailError
    if (passwordError) errors.password = passwordError
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ---------- Submission ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    if (!validateForm()) {
      return
    }

    setError("")
    setLoading(true)

    try {
      // Nettoyer le numéro de téléphone (non utilisé en mode email)
      const cleanPhoneNumber = ""

      // Inscription mode email
      const { error: signUpError } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phoneNumber: cleanPhoneNumber,
        role,
      } as Parameters<typeof authClient.signUp.email>[0])

      if (signUpError) {
        console.error("[signup-usager] signUpError:", JSON.stringify(signUpError, null, 2))
        const errorMessage =
          signUpError.message ?? "Impossible de créer le compte."
        if (
          errorMessage.toLowerCase().includes("email") ||
          errorMessage.toLowerCase().includes("already") ||
          errorMessage.toLowerCase().includes("déjà") ||
          errorMessage.toLowerCase().includes("exist")
        ) {
          setFieldErrors((prev) => ({ ...prev, email: "Cette adresse email est déjà utilisée. Essayez de vous connecter." }))
        } else if (
          errorMessage.toLowerCase().includes("password") ||
          errorMessage.toLowerCase().includes("mot de passe")
        ) {
          setFieldErrors((prev) => ({ ...prev, password: errorMessage }))
        } else if (
          errorMessage.toLowerCase().includes("name") ||
          errorMessage.toLowerCase().includes("nom")
        ) {
          setFieldErrors((prev) => ({ ...prev, name: errorMessage }))
        } else {
          setError(errorMessage)
        }
        setLoading(false)
        return
      }

      // Inscription réussie — déclencher l'envoi du code de vérification à 6 chiffres.
      // Le compte est déjà créé : un échec d'envoi ne doit pas bloquer l'utilisateur.
      // On le redirige dans tous les cas, avec un message clair en cas d'échec.
      const normalizedEmail = email.trim().toLowerCase()
      let sendOk = true
      try {
        const res = await fetch("/api/auth/email-otp/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, resend: false }),
        })
        sendOk = res.ok
        if (!sendOk) {
          const data = await res.json().catch(() => null)
          console.error("[signup-usager] envoi du code refusé:", data?.error?.message)
        }
      } catch (sendErr) {
        console.error("[signup-usager] envoi du code échoué:", sendErr)
        sendOk = false
      }

      const flags = sendOk ? "&sent=1" : "&sendError=1"
      router.push(
        `/validation-email?mode=${MODE_EMAIL}&email=${encodeURIComponent(normalizedEmail)}&redirect=${encodeURIComponent(redirectTo)}${flags}`
      )
      router.refresh()
    } catch (err) {
      console.error("[signup-usager] catch error:", err)
      setError("Une erreur inattendue est survenue. Veuillez réessayer.")
      setLoading(false)
    }
  }

  // ---------- Gestion des changements d'entrée ----------
  const handleInputChange = (
    field: "name" | "email" | "password",
    value: string
  ) => {
    if (field === "name") setName(value)
    if (field === "email") setEmail(value)
    if (field === "password") setPassword(value)
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (error) setError("")
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* ---------- Retourn en arrière ---------- */}
        <div className="mb-6">
          <Button
            render={<Link href="/inscription" />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="justify-start gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Retour
          </Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600 ring-1 ring-sky-200">
              <User className="size-6" />
            </div>
            <CardTitle className="text-xl font-bold">Créer un compte usager</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Remplissez vos informations pour commencer
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Ex: Jean Dupont"
                    value={name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    onBlur={() => setSubmitted(true)}
                    required
                    className="pl-10 h-11"
                    disabled={loading}
                    aria-invalid={submitted && !!fieldErrors.name}
                    aria-describedby={
                      submitted && fieldErrors.name ? "name-error" : undefined
                    }
                  />
                </div>
                {submitted && fieldErrors.name && (
                  <p
                    id="name-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {fieldErrors.name}
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      onBlur={() => setSubmitted(true)}
                      required
                      className="pl-10 h-11"
                      disabled={loading}
                      aria-invalid={submitted && !!fieldErrors.email}
                      aria-describedby={
                        submitted && fieldErrors.email ? "email-error" : undefined
                      }
                    />
                  </div>
                  {submitted && fieldErrors.email && (
                    <p
                      id="email-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="6 caractères minimum"
                      value={password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      onBlur={() => setSubmitted(true)}
                      required
                      minLength={6}
                      className="pl-10 pr-10 h-11"
                      disabled={loading}
                      aria-invalid={submitted && !!fieldErrors.password}
                      aria-describedby={
                        submitted && fieldErrors.password ? "password-error" : undefined
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={loading}
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {submitted && fieldErrors.password && (
                    <p
                      id="password-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {fieldErrors.password}
                    </p>
                  )}
                </div>
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
                {loading
                  ? <Button
                      render={<Loader2 className="size-4 mr-2 animate-spin" />}
                      nativeButton={false}
                    >
                      Création en cours...
                    </Button>
                  : "Créer mon compte usager"}
              </Button>
            </form>

            <div className="mt-8 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou continuer avec
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2 h-11"
                disabled={loading}
                onClick={() => authClient.signIn.social({ provider: "google", callbackURL: redirectTo })}
              >
                <Image
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  width={16}
                  height={16}
                  className="size-4"
                />
                Continuer avec Google
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function InscriptionUsagerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <InscriptionUsagerContent />
    </Suspense>
  )
}