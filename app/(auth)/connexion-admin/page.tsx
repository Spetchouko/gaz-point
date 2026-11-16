"use client"

import { useCallback, Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useSafeSession } from "@/lib/auth-session"
import { safeRedirect } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LoaderButton } from "@/app/_components/loader-button"
import { ActionFeedback } from "@/app/_components/action-feedback"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, Shield } from "lucide-react"
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

function LoginAdminPageContent() {
  const t = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const explicitRedirect = searchParams.get("redirect")
  const defaultRedirect = "/dashboard/admin"
  const redirectTo = safeRedirect(explicitRedirect, defaultRedirect)
  const { data: session } = useSafeSession()

  const passwordRef = useRef<HTMLInputElement>(null)

  // Déjà connecté en tant qu'admin/collaborateur : rediriger vers le dashboard approprié.
  useEffect(() => {
    if (!session?.user) return
    const role = (session.user as { role?: string }).role
    const mustChange = (session.user as { mustChangePassword?: boolean })?.mustChangePassword
    if (role === "admin") {
      router.push(redirectTo)
    } else if (role === "collaborateur") {
      if (mustChange === true) {
        router.push("/mot-de-passe-temporaire")
      } else {
        router.push("/dashboard/collaborateur")
      }
    }
  }, [session, router, redirectTo])

  const emailParamFromUrl = (searchParams.get("email") ?? "").trim()
  const passwordRefFocus = useRef<HTMLInputElement>(null)

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

      // Ce canal est réservé aux administrateurs et collaborateurs uniquement.
      if (role !== "admin" && role !== "collaborateur") {
        setError("Ce canal est réservé aux administrateurs et collaborateurs.")
        setFeedback({ state: "error", msg: "Ce canal est réservé aux administrateurs et collaborateurs." })
        setLoading(false)
        return
      }

      // Un collaborateur avec mot de passe temporaire doit d'abord le changer.
      const mustChange = (signInData?.user as { mustChangePassword?: boolean } | undefined)?.mustChangePassword
      if (role === "collaborateur" && mustChange === true) {
        router.push("/mot-de-passe-temporaire")
      } else if (role === "collaborateur") {
        // Collaborateur sans mot de passe temporaire -> dashboard collaborateur
        router.push("/dashboard/collaborateur")
      } else {
        // Admin -> dashboard admin
        router.push(redirectTo)
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
    <div className="min-h-screen bg-slate-900 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Bandeau d'identification admin */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 mb-6"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20">
              <Image
                src="/brand/logo.png"
                alt="GazPoints"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">GazPoints</span>
          </Link>
          <div className="flex size-10 items-center justify-center rounded-lg bg-slate-800/50 border border-white/10 px-3 py-1.5 mb-2 inline-block">
            <Shield className="size-5 text-white" />
            <span className="ml-1.5 text-xs font-semibold text-white uppercase tracking-wider">
              Espace Administrateur
            </span>
          </div>
          <CardTitle className="text-2xl font-bold text-white mt-4">Connexion administrateur</CardTitle>
          <p className="text-slate-400 text-sm mt-1">
            Accès sécurisé réservé aux administrateurs et collaborateurs autorisés.
          </p>
        </div>

        <Card className="bg-slate-800/50 border border-white/10">
          <CardContent className="p-6 space-y-4">
            {error && (
              <div
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive-foreground flex items-center gap-2 border border-destructive/20"
                role="alert"
              >
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-300">
                  Adresse e-mail
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@gazpoints.cm"
                    value={email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={() => setSubmitted(true)}
                    required
                    className="pl-10 text-white placeholder-slate-500 bg-slate-900/50 border-slate-600 focus:ring-primary focus:border-primary"
                    disabled={loading}
                    aria-invalid={submitted && !!fieldErrors.email}
                    aria-describedby={submitted && fieldErrors.email ? "email-error" : undefined}
                  />
                </div>
                {submitted && fieldErrors.email && (
                  <p id="email-error" className="text-sm text-destructive-foreground" role="alert">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-300">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    onBlur={() => setSubmitted(true)}
                    required
                    className="pl-10 pr-10 h-11 text-white placeholder-slate-500 bg-slate-900/50 border-slate-600 focus:ring-primary focus:border-primary"
                    disabled={loading}
                    aria-invalid={submitted && !!fieldErrors.password}
                    aria-describedby={submitted && fieldErrors.password ? "password-error" : undefined}
                    ref={passwordRef}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white disabled:opacity-50"
                    disabled={loading}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {submitted && fieldErrors.password && (
                  <p id="password-error" className="text-sm text-destructive-foreground" role="alert">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <LoaderButton
                type="submit"
                className="w-full h-11 bg-primary text-white hover:bg-primary/90 disabled:opacity-70"
                loading={loading}
                loadingText="Connexion…"
                disabled={loading}
              >
                Connexion administrateur
              </LoaderButton>
              <div className="mt-2 min-h-[1.5em]">
                <ActionFeedback
                  state={feedback.state}
                  loadingText={feedback.msg}
                  errorText={feedback.msg}
                />
              </div>
            </form>

            <div className="mt-6 border-t border-white/10 pt-4">
              <p className="text-center text-sm text-slate-400 mb-3">
                Besoin d'aide ?
                <Link
                  href="/mot-de-passe-demander"
                  className="text-primary hover:text-primary/80 font-medium hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          Retour à l'accueil
          <Link
            href="/"
            className="text-primary hover:text-primary/80 font-medium hover:underline ml-1"
          >
            ici
          </Link>
        </p>
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
