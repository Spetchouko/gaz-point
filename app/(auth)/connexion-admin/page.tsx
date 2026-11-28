"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, Mail, Shield } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { getServerRoleRedirect } from "@/lib/auth-redirect-client"
import { LoaderButton } from "@/app/_components/loader-button"
import { ActionFeedback } from "@/app/_components/action-feedback"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ACCOUNT_ACCESS_MESSAGES } from "@/lib/auth-routing"

function validateEmail(email: string): string | null {
  if (!email.trim()) return "L'email est requis."
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return "Format d'email invalide."
  return null
}

function validatePassword(password: string): string | null {
  if (!password) return "Le mot de passe est requis."
  return null
}

function LoginAdminPageContent() {
  const searchParams = useSearchParams()

  const passwordRef = useRef<HTMLInputElement>(null)

  const emailParamFromUrl = (searchParams.get("email") ?? "").trim()
  const urlErrorCode = searchParams.get("error")
  const urlErrorMessage = urlErrorCode ? (ACCOUNT_ACCESS_MESSAGES[urlErrorCode] ?? "") : ""

  useEffect(() => {
    if (emailParamFromUrl) {
      passwordRef.current?.focus()
    }
  }, [emailParamFromUrl])

  const [email, setEmail] = useState(emailParamFromUrl)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(urlErrorMessage)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [feedback, setFeedback] = useState<{ state: "idle" | "loading" | "success" | "error"; msg?: string }>({ state: "idle" })

  const validateForm = () => {
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    const errors: { email?: string; password?: string } = {}
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
    setFeedback({ state: "loading", msg: "Connexion administrateur en cours…" })

    try {
      const { error: signInError } = await authClient.signIn.email({
        email: email.trim(),
        password,
      })

      if (signInError) {
        // Diagnostic logging sans données sensibles
        console.log("[AUTH CLIENT] Admin sign-in error", {
          hasMessage: !!signInError.message,
          message: signInError.message,
          code: (signInError as { code?: string }).code,
          status: (signInError as { status?: number }).status,
        })

        const errorCode = (signInError as { code?: string }).code;
        const errorMessage = signInError.message ?? 
          errorCode === "EMAIL_NOT_VERIFIED"
            ? "Veuillez vérifier votre adresse email avant de vous connecter."
            : errorCode === "INVALID_CREDENTIALS"
              ? "Identifiants incorrects."
              : errorCode === "USER_NOT_FOUND"
                ? "Aucun compte trouvé avec cet email."
                : errorCode === "TOO_MANY_REQUESTS"
                  ? "Trop de tentatives. Veuillez patienter avant de réessayer."
                  : errorCode === "SESSION_ERROR" || errorCode === "INTERNAL_SERVER_ERROR"
                    ? "Erreur serveur temporaire. Veuillez réessayer dans quelques instants."
                    : errorCode === "STAFF_REQUIRED"
                      ? "Ce canal est réservé aux administrateurs et collaborateurs."
                      : errorCode
                        ? `Erreur (${errorCode}). Veuillez réessayer.`
                        : "Identifiants incorrects."
        
        if (errorMessage.toLowerCase().includes("email") || errorMessage.toLowerCase().includes("user") || errorMessage.toLowerCase().includes("vérif")) {
          setFieldErrors({ email: errorMessage })
        } else if (errorMessage.toLowerCase().includes("password") || errorMessage.toLowerCase().includes("identifiant") || errorMessage.toLowerCase().includes("incorrect")) {
          setFieldErrors({ password: errorMessage })
        } else {
          setError(errorMessage)
        }
        setFeedback({ state: "error", msg: errorMessage })
        setLoading(false)
        return
      }

      try {
        const destination = await getServerRoleRedirect("staff")
        window.location.assign(destination.redirectTo)
      } catch (caught) {
        await authClient.signOut().catch(() => undefined)
        const errorMessage =
          caught instanceof Error
            ? caught.message
            : "Ce canal est réservé aux administrateurs et collaborateurs."
        setError(errorMessage)
        setFeedback({ state: "error", msg: errorMessage })
        setLoading(false)
      }
    } catch {
      setError("Une erreur inattendue est survenue. Veuillez réessayer.")
      setFeedback({ state: "error", msg: "Une erreur inattendue est survenue. Veuillez réessayer." })
      setLoading(false)
    }
  }

  const handleInputChange = (field: "email" | "password", value: string) => {
    if (field === "email") setEmail(value)
    if (field === "password") setPassword(value)
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (error) setError("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-background to-slate-100/70 dark:from-slate-950 dark:via-background dark:to-slate-900 px-4 py-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl lg:grid-cols-[1.05fr_1fr]">
          <div className="relative hidden flex-col justify-between bg-slate-900 p-8 text-white lg:flex xl:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.18),transparent_30%)]" />
            <div className="relative space-y-8">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
                  <Image src="/brand/logo.png" alt="GazPoints" width={28} height={28} className="h-7 w-7 object-contain" />
                </span>
                <span className="text-xl font-bold tracking-tight">GazPoints</span>
              </Link>

              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90">
                  <Shield className="size-4" />
                  Espace sécurisé
                </div>
                <div className="space-y-3">
                  <h1 className="font-heading text-3xl font-bold leading-tight xl:text-4xl">Connexion administrateur</h1>
                  <p className="max-w-md text-sm leading-6 text-slate-300 xl:text-base">
                    Accès réservé à l’administrateur principal et aux collaborateurs disposant d’un compte et d’un rôle autorisé.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-10 space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 backdrop-blur-sm">
              <p className="font-medium text-white">Contrôle d’accès</p>
              <p className="text-slate-300">Le même portail de connexion admin est utilisé, avec vérification des rôles et permissions côté serveur.</p>
            </div>
          </div>

          <div className="flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-10">
            <div className="w-full max-w-md">
              <div className="mb-6 flex items-center justify-between">
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  <ArrowLeft className="size-4" />
                  Retour à l’accueil
                </Link>
                <Link href="/" className="inline-flex items-center gap-2 lg:hidden">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Image src="/brand/logo.png" alt="GazPoints" width={22} height={22} className="h-5 w-5 object-contain" />
                  </span>
                  <span className="font-semibold">GazPoints</span>
                </Link>
              </div>

              <Card className="border-border/70 shadow-sm">
                <CardHeader className="space-y-3 pb-4">
                  <div className="flex items-center gap-3 lg:hidden">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Shield className="size-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Espace sécurisé</p>
                      <CardTitle className="mt-0.5 text-xl">Connexion administrateur</CardTitle>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <CardTitle className="text-2xl">Connexion administrateur</CardTitle>
                  </div>
                  <CardDescription className="text-sm leading-6">
                    Connectez-vous avec votre compte administrateur ou collaborateur autorisé.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {error && (
                    <div
                      className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
                      role="alert"
                    >
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Adresse e-mail
                      </Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="admin@gazpoints.cm"
                          value={email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          onBlur={() => setSubmitted(true)}
                          required
                          className="h-11 pl-10"
                          disabled={loading}
                          aria-invalid={submitted && !!fieldErrors.email}
                          aria-describedby={submitted && fieldErrors.email ? "email-error" : undefined}
                        />
                      </div>
                      {submitted && fieldErrors.email && (
                        <p id="email-error" className="text-sm text-destructive" role="alert">
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="password" className="text-sm font-medium">
                          Mot de passe
                        </Label>
                        <Link
                          href="/mot-de-passe-demander"
                          className="text-xs font-medium text-primary hover:underline sm:text-sm"
                        >
                          Mot de passe oublié ?
                        </Link>
                      </div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          onBlur={() => setSubmitted(true)}
                          required
                          className="h-11 pl-10 pr-11"
                          disabled={loading}
                          aria-invalid={submitted && !!fieldErrors.password}
                          aria-describedby={submitted && fieldErrors.password ? "password-error" : undefined}
                          ref={passwordRef}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
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

                    <div className="space-y-2 pt-1">
                      <LoaderButton
                        type="submit"
                        className="h-11 w-full"
                        loading={loading}
                        loadingText="Connexion…"
                        disabled={loading}
                      >
                        Connexion administrateur
                      </LoaderButton>
                      <div className="min-h-[1.5rem]">
                        <ActionFeedback
                          state={feedback.state}
                          loadingText={feedback.msg}
                          errorText={feedback.msg}
                        />
                      </div>
                    </div>
                  </form>

                  <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 text-xs leading-5 text-muted-foreground sm:text-sm">
                    Accès strictement réservé aux administrateurs et collaborateurs autorisés. Les identifiants sont vérifiés et les permissions appliquées côté serveur.
                  </div>
                </CardContent>
              </Card>

              <p className="mt-5 text-center text-xs text-muted-foreground sm:text-sm">
                Besoin d’un autre espace ?{" "}
                <Link href="/connexion" className="font-medium text-primary hover:underline">
                  Connexion client / vendeur
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginAdminPage() {
  return (
    <Suspense>
      <LoginAdminPageContent />
    </Suspense>
  )
}
