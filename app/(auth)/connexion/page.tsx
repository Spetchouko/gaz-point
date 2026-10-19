"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { safeRedirect } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { useState } from "react"

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const explicitRedirect = searchParams.get("redirect")
  const redirectTo = safeRedirect(explicitRedirect, "/dashboard")
  const { data: session } = authClient.useSession()

  const isStaff = (role?: string | null) =>
    role === "admin" || role === "collaborateur"

  useEffect(() => {
    if (!session?.user) return
    const role = (session.user as { role?: string }).role
    router.push(!explicitRedirect && isStaff(role) ? "/admin" : redirectTo)
  }, [session, router, redirectTo, explicitRedirect])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
        setLoading(false)
        return
      }

      const role = (signInData?.user as { role?: string } | undefined)?.role
      router.push(!explicitRedirect && isStaff(role) ? "/admin" : redirectTo)
      router.refresh()
    } catch {
      setError("Une erreur inattendue est survenue. Veuillez réessayer.")
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
            Retour à l&apos;accueil
          </Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Image
                src="/brand/logo.png"
                alt="GazPoints"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </div>
            <CardTitle className="text-xl font-bold">Connexion</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Accédez à votre espace GazPoints
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="password">Mot de passe</Label>
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
                    className="pl-10 pr-10 h-11"
                    disabled={loading}
                    aria-invalid={submitted && !!fieldErrors.password}
                    aria-describedby={submitted && fieldErrors.password ? "password-error" : undefined}
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

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="size-4 mr-2 animate-spin" /> : "Se connecter"}
              </Button>
            </form>

            <div className="mt-8 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-background px-2 text-muted-foreground">Ou continuer avec</span>
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

            <p className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link
                href={`/inscription?redirect=${encodeURIComponent(redirectTo)}`}
                className="text-primary hover:underline font-medium"
              >
                Créer un compte
              </Link>
            </p>
          </CardContent>
        </Card>
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