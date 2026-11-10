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
    const user = session.user as { role?: string; emailVerified?: boolean }
    
    // For vendors: check if email is verified but subscription might not be active
    // The dashboard will handle subscription check and redirect to payment if needed
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
      // Seul un collaborateur avec mot de passe temporaire est redirigé.
      // Les vendeurs vont sur leur dashboard professionnel, les clients sur
      // leur dashboard usager, les administrateurs sur l'admin.
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
    <div className="min-h-screen bg-background px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">
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

        <ModernCard className="shadow-sm">
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
            <CardTitle className="text-xl font-bold">{t("login_title")}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t("login_subtitle")}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {emailVerifiedNotice && (
              <div
                className="flex items-center gap-2 rounded-md bg-primary/10 p-3 text-sm text-primary"
                role="status"
              >
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
                    className="pl-9"
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
                  <p id="password-error" className="text-sm text-destructive" role="alert">
                    {fieldErrors.password}
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

              <LoaderButton
                type="submit"
                className="w-full h-11"
                loading={loading}
                loadingText={t("loading")}
                disabled={loading}
              >
                {t("login_button")}
              </LoaderButton>
              <div className="mt-2 min-h-[1.5em]">
                <ActionFeedback state={feedback.state} loadingText={feedback.msg} errorText={feedback.msg} />
              </div>
            </form>

            <div className="mt-8 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-background px-2 text-muted-foreground">{t("login_or_continue")}</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2 h-11"
                disabled={loading}
                onClick={handleGoogleLogin}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t("login_google")}
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {t("login_no_account")}{" "}
              <Link
                href={`/inscription?redirect=${encodeURIComponent(redirectTo)}`}
                className="text-primary hover:underline font-medium"
              >
                {t("login_create_account")}
              </Link>
            </p>
          </CardContent>
        </ModernCard>
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