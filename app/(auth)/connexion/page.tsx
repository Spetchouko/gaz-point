"use client"

import { useCallback, Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { safeRedirect } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LoaderButton } from "@/app/_components/loader-button"
import { ActionFeedback } from "@/app/_components/action-feedback"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ModernCard } from "@/app/_components/card-modern"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import Image from "next/image"

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

function LoginPageContent() {
  const t = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const explicitRedirect = searchParams.get("redirect")
  const redirectTo = safeRedirect(explicitRedirect, "/dashboard")
  const { data: session } = authClient.useSession()

  const isStaff = (role?: string | null) =>
    role === "admin" || role === "collaborateur"

  const emailParamFromUrl = (searchParams.get("email") ?? "").trim()
  const emailVerifiedNotice = emailParamFromUrl ? "Votre adresse email est vérifiée. Vous pouvez maintenant vous connecter." : ""
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!session?.user) return
    const role = (session.user as { role?: string }).role
    if (!explicitRedirect && isStaff(role)) {
      router.push("/admin")
    } else if (!explicitRedirect && role === "vendor") {
      router.push("/dashboard/vendeur")
    } else {
      router.push(redirectTo)
    }
  }, [session, router, redirectTo, explicitRedirect])

  useEffect(() => {
    if (emailParamFromUrl) {
      passwordRef.current?.focus()
    }
  }, [emailParamFromUrl])

  const [email, setEmail] = useState(emailParamFromUrl)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [feedback, setFeedback] = useState<{ state: "idle" | "loading" | "success" | "error"; msg?: string }>({ state: "idle" })

  const handleGoogleLogin = useCallback(() => {
    authClient.signIn.social({ provider: "google", callbackURL: redirectTo })
  }, [redirectTo])

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
    setFeedback({ state: "loading", msg: "Connexion en cours…" })

    try {
      const { data: signInData, error: signInError } = await authClient.signIn.email({
        email: email.trim(),
        password,
      })

      if (signInError) {
        const errorMessage = signInError.message ?? "Identifiants incorrects."
        if (errorMessage.toLowerCase().includes("email") || errorMessage.toLowerCase().includes("user")) {
          setFieldErrors({ email: errorMessage })
        } else if (errorMessage.toLowerCase().includes("password")) {
          setFieldErrors({ password: errorMessage })
        } else {
          setError(errorMessage)
        }
        setFeedback({ state: "error", msg: errorMessage })
        setLoading(false)
        return
      }

      const role = (signInData?.user as { role?: string } | undefined)?.role
      const mustChange = (signInData?.user as { mustChangePassword?: boolean } | undefined)?.mustChangePassword

      if (role === "collaborateur" && mustChange === true) {
        router.push("/mot-de-passe-temporaire")
      } else if (!explicitRedirect && role === "vendor") {
        router.push("/dashboard/vendeur")
      } else if (!explicitRedirect && isStaff(role)) {
        router.push("/admin")
      } else {
        router.push(redirectTo)
      }
      router.refresh()
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
    <div className="min-h-screen bg-background">
      {/* Mobile: single column */}
      <div className="flex flex-col items-center justify-center px-4 pt-8 pb-24 md:hidden">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-6">
            <Button
              render={<Link href="/" />}
              nativeButton={false}
              variant="ghost"
              size="sm"
              className="justify-start gap-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Retour à l’accueil
            </Button>
          </div>

          <div className="text-center mb-8">
            <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Image src="/brand/logo.png" alt="GazPoints" width={28} height={28} className="h-7 w-7 object-contain" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">Heureux de vous retrouver !</h1>
            <p className="text-sm text-muted-foreground">Connectez-vous pour accéder à votre espace personnel.</p>
          </div>

          <ModernCard className="shadow-sm">
            <CardContent className="space-y-6 p-8">
              {emailVerifiedNotice && (
                <div className="flex items-center gap-2 rounded-md bg-primary/10 p-3 text-sm text-primary" role="status">
                  <CheckCircle className="size-4 shrink-0" />
                  <span>{emailVerifiedNotice}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("login_email")}</Label>
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
                      aria-describedby={submitted && fieldErrors.email ? "email-error" : undefined}
                    />
                  </div>
                  {submitted && fieldErrors.email && (
                    <p id="email-error" className="text-sm text-destructive" role="alert">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("login_password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      onBlur={() => setSubmitted(true)}
                      required
                      className="pl-9 pr-10 h-11"
                      disabled={loading}
                      aria-invalid={submitted && !!fieldErrors.password}
                      aria-describedby={submitted && fieldErrors.password ? "password-error" : undefined}
                      ref={passwordRef}
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
                    <p id="password-error" className="text-sm text-destructive" role="alert">{fieldErrors.password}</p>
                  )}
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2" role="alert">
                    <AlertCircle className="size-4 shrink-0" />
                    {error}
                  </div>
                )}

                <LoaderButton type="submit" className="w-full h-11" loading={loading} loadingText={t("loading")} disabled={loading}>
                  {t("login_button")}
                </LoaderButton>
                <div className="mt-2 min-h-[1.5em]">
                  <ActionFeedback state={feedback.state} loadingText={feedback.msg} errorText={feedback.msg} />
                </div>
              </form>

              <div className="mt-6 space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wider">
                    <span className="bg-background px-2 text-muted-foreground">{t("login_or_continue")}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full gap-2 h-11" disabled={loading} onClick={handleGoogleLogin}>
                  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {t("login_google")}
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                {t("login_no_account")}{" "}
                <Link href={`/inscription?redirect=${encodeURIComponent(redirectTo)}`} className="text-primary hover:underline font-medium">
                  {t("login_create_account")}
                </Link>
              </p>
          </CardContent>
          </ModernCard>
        </div>
      </div>
      {/* Desktop: two columns */}
      <div className="hidden md:flex md:h-auto md:w-full md:max-w-5xl md:items-center md:justify-center md:px-8 md:py-12">
        <div className="flex-1 max-w-md">
          <div className="text-left mb-8">
            <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 mb-6">
              <Image src="/brand/logo.png" alt="GazPoints" width={28} height={28} className="h-7 w-7 object-contain" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3 leading-tight">Heureux de vous retrouver !</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Connectez-vous pour accéder à votre espace personnel et trouver du gaz près de chez vous sans vous déplacer.
            </p>
          </div>

          <ModernCard className="shadow-md p-8">
            <CardContent className="space-y-6">
              {emailVerifiedNotice && (
                <div className="flex items-center gap-2 rounded-md bg-primary/10 p-3 text-sm text-primary" role="status">
                  <CheckCircle className="size-4 shrink-0" />
                  <span>{emailVerifiedNotice}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("login_email")}</Label>
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
                      aria-describedby={submitted && fieldErrors.email ? "email-error" : undefined}
                    />
                  </div>
                  {submitted && fieldErrors.email && (
                    <p id="email-error" className="text-sm text-destructive" role="alert">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("login_password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      onBlur={() => setSubmitted(true)}
                      required
                      className="pl-9 pr-10 h-11"
                      disabled={loading}
                      aria-invalid={submitted && !!fieldErrors.password}
                      aria-describedby={submitted && fieldErrors.password ? "password-error" : undefined}
                      ref={passwordRef}
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
                    <p id="password-error" className="text-sm text-destructive" role="alert">{fieldErrors.password}</p>
                  )}
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2" role="alert">
                    <AlertCircle className="size-4 shrink-0" />
                    {error}
                  </div>
                )}

                <LoaderButton type="submit" className="w-full h-11" loading={loading} loadingText={t("loading")} disabled={loading}>
                  {t("login_button")}
                </LoaderButton>
                <div className="mt-2 min-h-[1.5em]">
                  <ActionFeedback state={feedback.state} loadingText={feedback.msg} errorText={feedback.msg} />
                </div>
              </form>

              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wider">
                    <span className="bg-background px-2 text-muted-foreground">{t("login_or_continue")}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full gap-2 h-11" disabled={loading} onClick={handleGoogleLogin}>
                  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {t("login_google")}
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                {t("login_no_account")}{" "}
                <Link href={`/inscription?redirect=${encodeURIComponent(redirectTo)}`} className="text-primary hover:underline font-medium">
                  {t("login_create_account")}
                </Link>
              </p>
            </CardContent>
          </ModernCard>
        </div>

        <div className="flex-1 max-w-md md:max-w-lg hidden md:block">
          <div className="relative h-72 w-full mx-auto">
            <svg viewBox="0 0 800 600" className="w-full h-full" aria-hidden="true">
              <defs>
                <linearGradient id="gasGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#16834a;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#0e5c34;stop-opacity:1" />
                </linearGradient>
                <linearGradient id="pinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#174a7e;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#103657;stop-opacity:1" />
                </linearGradient>
              </defs>
              <circle cx="620" cy="-80" r="200" fill="#eaf5ee" opacity="0.6" />
              <circle cx="180" cy="520" r="160" fill="#eff4fa" opacity="0.5" />
              <circle cx="700" cy="580" r="120" fill="#eaf5ee" opacity="0.4" />

              <g transform="translate(320, 240)">
                <path d="M20 0 C-6.7 0 -13 6.7 -13 15 C-13 25.2 0 45 20 55 C40 45 53 25.2 53 15 C53 6.7 46.7 0 20 0 Z" fill="url(#pinGrad)" />
                <circle cx="20" cy="22" r="10" fill="white" />
              </g>

              <g transform="translate(200, 340)">
                <rect x="0" y="0" width="100" height="140" rx="12" fill="url(#gasGrad)" />
                <rect x="15" y="10" width="70" height="20" rx="10" fill="#ffffff" opacity="0.15" />
                <rect x="25" y="40" width="50" height="90" rx="6" fill="#16834a" opacity="0.3" />
                <rect x="40" y="20" width="20" height="10" rx="5" fill="white" opacity="0.2" />
                <path d="M10 100 L90 100 M40 140 L40 155 M60 140 L60 155" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
              </g>

              <g transform="translate(500, 320)">
                <circle cx="0" cy="0" r="24" fill="#eaf5ee" />
                <path d="M-6 4 L2 12 L14 -2" stroke="#16834a" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <g transform="translate(580, 380)">
                <circle cx="0" cy="0" r="24" fill="#eaf5ee" />
                <path d="M-6 4 L2 12 L14 -2" stroke="#16834a" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <g transform="translate(500, 440)">
                <circle cx="0" cy="0" r="24" fill="#eaf5ee" />
                <path d="M-6 4 L2 12 L14 -2" stroke="#16834a" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              <text x="400" y="560" font-family="sans-serif" font-size="16" font-weight="600" fill="#17251e" text-anchor="middle">
                Le gaz disponible, sans déplacement inutile.
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  )
}
