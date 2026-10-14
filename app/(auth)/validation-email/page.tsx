"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle, AlertCircle, Loader2, Clock } from "lucide-react"

const CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

function ValidationEmailContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { data: session } = authClient.useSession()

  // L'email est transmis par la page d'inscription (le compte n'a pas encore de
  // session tant qu'il n'est pas vérifié). On retombe sur la session si présente.
  const emailParam = (params.get("email") ?? "").trim().toLowerCase()
  const email = emailParam || (session?.user?.email ?? "").toLowerCase()
  const redirectParam = params.get("redirect") || "/dashboard"
  const sentOk = params.get("sent") === "1"
  const sendFailed = params.get("sendError") === "1"

  const [code, setCode] = useState("")
  const [error, setError] = useState(
    sendFailed
      ? "Le code n'a pas pu être envoyé. Cliquez sur « Renvoyer un code » pour réessayer."
      : ""
  )
  const [notice, setNotice] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  // Un SEUL décompte : le délai de renvoi (60 s). Démarre après un envoi réussi.
  const [resendCooldown, setResendCooldown] = useState(sentOk ? RESEND_COOLDOWN_SECONDS : 0)

  // Déjà connecté et email vérifié → redirection immédiate.
  useEffect(() => {
    if (session?.user?.emailVerified) {
      router.push(redirectParam)
    }
  }, [redirectParam, router, session])

  // Minuterie unique du décompte de renvoi. Démontée proprement, aucun intervalle doublon.
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const verifier = async (value: string) => {
    const otp = value.trim()
    if (loading || success) return
    if (!email) {
      setError("Session expirée. Veuillez recommencer la vérification.")
      return
    }
    if (otp.length !== CODE_LENGTH) {
      setError("Le code doit contenir 6 chiffres.")
      return
    }
    setError("")
    setNotice("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/email-otp/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
      const data = (await res.json().catch(() => null)) as
        | { message?: string; error?: { message?: string } }
        | null
      if (!res.ok || data?.error) {
        const msg = data?.error?.message ?? data?.message ?? "Code invalide ou expiré."
        setError(msg)
        setLoading(false)
        return
      }
      setSuccess(true)
      setError("")
      await new Promise((r) => setTimeout(r, 800))
      router.push(redirectParam)
      router.refresh()
    } catch {
      setError("Une erreur inattendue est survenue. Veuillez réessayer.")
      setLoading(false)
    }
  }

  const renvoyerCode = async () => {
    if (resending || resendCooldown > 0) return
    if (!email) {
      setError("Session expirée. Veuillez recommencer la vérification.")
      return
    }
    setResending(true)
    setError("")
    setNotice("")
    try {
      const res = await fetch("/api/auth/email-otp/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = (await res.json().catch(() => null)) as
        | { error?: { message?: string; retryAfter?: number } }
        | null
      if (!res.ok || data?.error) {
        setError(
          data?.error?.message ??
            "Impossible de renvoyer le code. Réessayez dans un instant."
        )
        const retryAfter = Number(data?.error?.retryAfter)
        if (Number.isFinite(retryAfter) && retryAfter > 0) {
          setResendCooldown(retryAfter)
        }
        setResending(false)
        return
      }
      setNotice("Un nouveau code de vérification vient d'être envoyé à votre adresse e-mail.")
      setCode("")
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch {
      setError("Une erreur inattendue est survenue. Veuillez réessayer.")
    }
    setResending(false)
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card className="p-8 md:p-10">
          <CardHeader className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Confirmation email
            </h2>
          </CardHeader>

          <CardContent>
            {success && (
              <div className="text-center">
                <CheckCircle className="size-8 text-primary mx-auto mb-3" />
                <p className="text-base text-foreground font-medium">
                  Félicitations ! Votre compte a été créé avec succès.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Redirection vers votre espace…
                </p>
              </div>
            )}

            {!success && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  {notice ||
                    "Un code de vérification à six chiffres a été envoyé à votre adresse e-mail. Saisissez-le pour confirmer votre compte."}
                </p>

                {error && (
                  <div
                    className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                    role="alert"
                  >
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Code email à 6 chiffres"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH)
                    setCode(val)
                    if (val.length === CODE_LENGTH) {
                      verifier(val)
                    }
                  }}
                  maxLength={CODE_LENGTH}
                  className="w-full h-11 rounded-md border border-border placeholder:text-muted-foreground focus:border-primary text-center text-lg tracking-widest"
                  disabled={loading || !email}
                  aria-label="Code de vérification à 6 chiffres"
                />

                <Button
                  onClick={() => verifier(code)}
                  className="w-full"
                  disabled={loading || !email || code.length !== CODE_LENGTH}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Vérification…
                    </>
                  ) : (
                    "Confirmer le code email"
                  )}
                </Button>

                <div className="text-center min-h-6">
                  {resending ? (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      Envoi…
                    </span>
                  ) : resendCooldown > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" aria-hidden />
                      Renvoyer possible dans{" "}
                      <span className="font-mono">{formatTime(resendCooldown)}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={renvoyerCode}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Vous n&apos;avez pas reçu le code ? Renvoyer un code
                    </button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ValidationEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">Chargement…</div>
      }
    >
      <ValidationEmailContent />
    </Suspense>
  )
}
