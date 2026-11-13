"use client"

import { useCallback, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"
import { ButtonSpinner, Spinner, PageLoading } from "@/app/_components/spinner"
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

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const handleShowPasswordToggle = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    email?: string
    password?: string
  }>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    if (!validateForm()) {
      return
    }

    setError("")
    setLoading(true)

    try {
      const cleanPhoneNumber = ""

      const { error: signUpError } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phoneNumber: cleanPhoneNumber,
        role,
      } as Parameters<typeof authClient.signUp.email>[0])

      if (signUpError) {
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

      const normalizedEmail = email.trim().toLowerCase()
      let emailSent = false
      try {
        const res = await fetch("/api/auth/email-otp/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, resend: false }),
        })
        if (res.ok) {
          emailSent = true
        } else {
          const data = await res.json().catch(() => null)
          console.error("[signup-usager] envoi du code échoué:", data?.error?.message ?? res.statusText)
          setError(data?.error?.message ?? "L'envoi du code de vérification a échoué. Veuillez réessayer.")
          setLoading(false)
          return
        }
      } catch (sendErr) {
        console.error("[signup-usager] envoi du code échoué (exception):", sendErr)
        setError("L'envoi du code de vérification a échoué. Veuillez réessayer.")
        setLoading(false)
        return
      }

      if (emailSent) {
        router.push(
          `/validation-email?mode=${MODE_EMAIL}&email=${encodeURIComponent(normalizedEmail)}&redirect=${encodeURIComponent(redirectTo)}&sent=1`
        )
        router.refresh()
      }
    } catch (err) {
      console.error("[signup-usager] catch error:", err)
      setError("Une erreur inattendue est survenue. Veuillez réessayer.")
      setLoading(false)
    }
  }

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

  const handleGoogleLogin = useCallback(() => {
    authClient.signIn.social({ provider: "google", callbackURL: redirectTo })
  }, [redirectTo])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile: single column */}
      <div className="flex flex-col items-center justify-center px-4 pt-8 pb-24 md:hidden">
        <div className="w-full max-w-md space-y-8">
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

          <div className="text-center mb-8">
            <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 mb-4">
              <User className="size-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
              Créer un compte client
            </h1>
            <p className="text-sm text-muted-foreground">
              Remplissez vos informations pour commencer
            </p>
          </div>

          <Card className="shadow-sm">
            <CardContent className="space-y-6 p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
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
                      className="pl-9 h-11"
                      disabled={loading}
                      aria-invalid={submitted && !!fieldErrors.name}
                      aria-describedby={
                        submitted && fieldErrors.name ? "name-error" : undefined
                      }
                    />
                  </div>
                  {submitted && fieldErrors.name && (
                    <p id="name-error" className="text-sm text-destructive" role="alert">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

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
                      className="pl-9 h-11"
                      disabled={loading}
                      aria-invalid={submitted && !!fieldErrors.email}
                      aria-describedby={
                        submitted && fieldErrors.email ? "email-error" : undefined
                      }
                    />
                  </div>
                  {submitted && fieldErrors.email && (
                    <p id="email-error" className="text-sm text-destructive" role="alert">
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
                      className="pl-9 pr-10 h-11"
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
                    <p id="password-error" className="text-sm text-destructive" role="alert">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2" role="alert">
                    <AlertCircle className="size-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? (<><ButtonSpinner />Création en cours...</>) : "Créer mon compte usager"}
                </Button>
              </form>

              <div className="mt-6 space-y-6">
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
                  onClick={handleGoogleLogin}
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

      {/* Desktop: two columns */}
      <div className="hidden md:flex md:h-auto md:w-full md:max-w-5xl md:items-center md:justify-center md:px-8 md:py-12">
        <div className="flex-1 max-w-md">
          <div className="text-left mb-8">
            <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 mb-6">
              <User className="size-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3 leading-tight">
              Créer un compte client
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Remplissez vos informations pour commencer à utiliser GazPoints.
            </p>
          </div>

          <Card className="shadow-md p-8">
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
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
                      className="pl-9 h-11"
                      disabled={loading}
                      aria-invalid={submitted && !!fieldErrors.name}
                      aria-describedby={
                        submitted && fieldErrors.name ? "name-error" : undefined
                      }
                    />
                  </div>
                  {submitted && fieldErrors.name && (
                    <p id="name-error" className="text-sm text-destructive" role="alert">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

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
                      className="pl-9 h-11"
                      disabled={loading}
                      aria-invalid={submitted && !!fieldErrors.email}
                      aria-describedby={
                        submitted && fieldErrors.email ? "email-error" : undefined
                      }
                    />
                  </div>
                  {submitted && fieldErrors.email && (
                    <p id="email-error" className="text-sm text-destructive" role="alert">
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
                      className="pl-9 pr-10 h-11"
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
                    <p id="password-error" className="text-sm text-destructive" role="alert">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2" role="alert">
                    <AlertCircle className="size-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? (<><ButtonSpinner />Création en cours...</>) : "Créer mon compte usager"}
                </Button>
              </form>

              <div className="space-y-6">
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
                  onClick={handleGoogleLogin}
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

        <div className="flex-1 max-w-md md:max-w-lg hidden md:block">
          <div className="relative h-72 w-full mx-auto">
            <svg viewBox="0 0 800 600" className="w-full h-full" aria-hidden="true">
              <defs>
                <linearGradient id="gasGradReg" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#16834a;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#0e5c34;stop-opacity:1" />
                </linearGradient>
              </defs>
              <circle cx="620" cy="-80" r="200" fill="#eaf5ee" opacity="0.6" />
              <circle cx="180" cy="520" r="160" fill="#eff4fa" opacity="0.5" />

              <g transform="translate(200, 300)">
                <rect x="0" y="0" width="100" height="140" rx="12" fill="url(#gasGradReg)" />
                <rect x="15" y="10" width="70" height="20" rx="10" fill="#ffffff" opacity="0.15" />
                <rect x="25" y="40" width="50" height="90" rx="6" fill="#16834a" opacity="0.3" />
                <rect x="40" y="20" width="20" height="10" rx="5" fill="white" opacity="0.2" />
                <path d="M10 100 L90 100 M40 140 L40 155 M60 140 L60 155" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
              </g>

              <g transform="translate(420, 260)">
                <circle cx="0" cy="0" r="24" fill="#eaf5ee" />
                <path d="M-6 4 L2 12 L14 -2" stroke="#16834a" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <g transform="translate(560, 340)">
                <circle cx="0" cy="0" r="24" fill="#eaf5ee" />
                <path d="M-6 4 L2 12 L14 -2" stroke="#16834a" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              <text x="400" y="550" font-family="sans-serif" font-size="16" font-weight="600" fill="#17251e" text-anchor="middle">
                Rejoignez la communauté GazPoints
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InscriptionUsagerPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <InscriptionUsagerContent />
    </Suspense>
  )
}
