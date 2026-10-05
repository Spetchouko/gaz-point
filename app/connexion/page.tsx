"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

export default function Connexion() {
  const router = useRouter()
  const [isForgot, setIsForgot] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string

    if (isForgot) {
      const { error: resetError } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/connexion",
      })
      setLoading(false)
      if (resetError) {
        setError(resetError.message || "Impossible d'envoyer l'email de réinitialisation.")
        return
      }
      setSuccessMessage("Un email avec le lien de réinitialisation vous a été envoyé.")
      return
    }

    const password = formData.get("password") as string
    const { data, error: signInError } = await authClient.signIn.email({
      email,
      password,
    })

    setLoading(false)

    if (signInError || !data) {
      setError(signInError?.message || "Identifiants incorrects.")
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          {isForgot ? "Mot de passe oublié" : "Connexion"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isForgot
            ? "Renseigne ton email pour réinitialiser ton mot de passe."
            : "Retrouve ton compte GazPoint."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3.5">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="ton@email.com"
            />
          </div>

          {!isForgot && (
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgot(true)
                    setError(null)
                    setSuccessMessage(null)
                  }}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="Ton mot de passe"
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive rounded-md bg-destructive/10 p-2" role="alert">
              {error}
            </p>
          )}

          {successMessage && (
            <div className="flex items-start gap-1.5 rounded-md bg-emerald-500/10 p-2 text-xs font-medium text-emerald-600" role="status">
              <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <Button type="submit" disabled={loading} className="mt-2 h-11 w-full font-semibold cursor-pointer">
            {loading ? "Chargement..." : isForgot ? "Envoyer le lien" : "Se connecter"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          {isForgot ? (
            <button
              type="button"
              onClick={() => {
                setIsForgot(false)
                setError(null)
                setSuccessMessage(null)
              }}
              className="text-primary underline-offset-4 hover:underline cursor-pointer"
            >
              Retour à la connexion
            </button>
          ) : (
            <p>
              Pas encore de compte ?{" "}
              <Link href="/inscription" className="text-primary underline-offset-4 hover:underline">
                S&apos;inscrire
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
