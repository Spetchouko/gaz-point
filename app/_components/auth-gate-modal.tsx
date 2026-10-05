"use client"

import { useState } from "react"
import Image from "next/image"
import { authClient } from "@/lib/auth-client"
import { useAuthModal } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Phone, Store, User, X } from "lucide-react"

export function AuthGateModal() {
  const { isOpen, closeAuthModal, mode, setMode } = useAuthModal()
  const [role, setRole] = useState<"client" | "vendor">("client")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      if (mode === "forgot-password") {
        const { error: resetError } = await authClient.requestPasswordReset({
          email,
          redirectTo: "/mot-de-passe-oublie",
        })
        if (resetError) {
          setError(resetError.message || "Impossible d'envoyer l'email de réinitialisation.")
          setLoading(false)
          return
        }
        setSuccessMessage("Un lien de réinitialisation vous a été envoyé par email.")
        setLoading(false)
        return
      }

      if (mode === "register") {
        const { error: signUpError } = await authClient.signUp.email({
          name,
          email,
          password,
          phoneNumber,
          role,
        } as Parameters<typeof authClient.signUp.email>[0])

        if (signUpError) {
          setError(signUpError.message || "Impossible de créer le compte.")
          setLoading(false)
          return
        }
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        })
        if (signInError) {
          setError(signInError.message || "Identifiants incorrects.")
          setLoading(false)
          return
        }
      }

      closeAuthModal()
      window.location.href = "/dashboard"
    } catch {
      setError("Une erreur inattendue est survenue.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/60 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-sm rounded-2xl border bg-card p-5 sm:p-6 shadow-xl transition-all">
        {/* Bouton de fermeture */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute right-3.5 top-3.5 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 mb-2">
            <Image
              src="/brand/logo.png"
              alt="GazPoint"
              width={26}
              height={26}
              className="h-6.5 w-6.5 object-contain"
            />
          </div>

          <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
            {mode === "register"
              ? "Créer un compte"
              : mode === "login"
              ? "Connexion"
              : "Mot de passe oublié"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "register"
              ? "Choisissez votre profil et commencez."
              : mode === "login"
              ? "Accédez à votre espace GazPoint."
              : "Entrez votre email pour réinitialiser."}
          </p>
        </div>

        {/* Tab switch Navigation */}
        {mode !== "forgot-password" && (
          <div className="mt-4 flex rounded-lg bg-muted p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode("register")
                setError(null)
                setSuccessMessage(null)
              }}
              className={`flex-1 rounded-md py-1 font-semibold transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Créer un compte
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("login")
                setError(null)
                setSuccessMessage(null)
              }}
              className={`flex-1 rounded-md py-1 font-semibold transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Se connecter
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-2.5">
          {/* Sélection du profil pour l'inscription */}
          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Type de profil
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("client")}
                  className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center transition-all cursor-pointer ${
                    role === "client"
                      ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <User className="size-4 mb-1" />
                  <span className="text-[11px]">Usager / Client</span>
                  <span className="text-[9px] font-normal text-muted-foreground">0 FCFA</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("vendor")}
                  className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center transition-all cursor-pointer ${
                    role === "vendor"
                      ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Store className="size-4 mb-1" />
                  <span className="text-[11px]">Vendeur / Dépôt</span>
                  <span className="text-[9px] font-normal text-muted-foreground">5 000 FCFA/m</span>
                </button>
              </div>
            </div>
          )}

          {mode === "register" && (
            <div>
              <label
                htmlFor="gate-name"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {role === "vendor" ? "Nom du dépôt ou gérant" : "Nom complet"}
              </label>
              <input
                id="gate-name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === "vendor" ? "Ex: Dépôt Gaz Bonamoussadi" : "Ex: Jean Dupont"}
                className="mt-1 block h-9 w-full rounded-lg border bg-background px-3 py-1 text-xs sm:text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="gate-email"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Adresse email
            </label>
            <input
              id="gate-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="mt-1 block h-9 w-full rounded-lg border bg-background px-3 py-1 text-xs sm:text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          {/* Numéro de téléphone pour vérification mobile */}
          {mode === "register" && (
            <div>
              <label
                htmlFor="gate-phone"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between"
              >
                <span>Numéro de téléphone</span>
                <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                  <Phone className="size-2.5" /> Vérification mobile
                </span>
              </label>
              <input
                id="gate-phone"
                name="phoneNumber"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: +237 6XX XX XX XX"
                className="mt-1 block h-9 w-full rounded-lg border bg-background px-3 py-1 text-xs sm:text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          )}

          {mode !== "forgot-password" && (
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="gate-password"
                  className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Mot de passe
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot-password")
                      setError(null)
                      setSuccessMessage(null)
                    }}
                    className="text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <input
                id="gate-password"
                name="password"
                type="password"
                required
                minLength={mode === "register" ? 8 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "8 caractères minimum" : "Votre mot de passe"}
                className="mt-1 block h-9 w-full rounded-lg border bg-background px-3 py-1 text-xs sm:text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 p-2 text-xs font-medium text-destructive" role="alert">
              {error}
            </p>
          )}

          {successMessage && (
            <div className="flex items-start gap-1.5 rounded-md bg-emerald-500/10 p-2 text-xs font-medium text-emerald-600" role="status">
              <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <Button type="submit" disabled={loading} className="mt-3 h-10 w-full text-xs sm:text-sm font-semibold cursor-pointer">
            {loading
              ? "Chargement..."
              : mode === "register"
              ? role === "vendor"
                ? "Créer mon compte Vendeur"
                : "Créer mon compte Usager"
              : mode === "login"
              ? "Se connecter"
              : "Envoyer le lien de réinitialisation"}
          </Button>
        </form>

        {mode === "forgot-password" && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => {
                setMode("login")
                setError(null)
                setSuccessMessage(null)
              }}
              className="text-xs text-primary underline-offset-4 hover:underline cursor-pointer"
            >
              Retour à la connexion
            </button>
          </div>
        )}

        {mode !== "forgot-password" && (
          <>
            <Separator className="my-4">
              <span className="text-xs text-muted-foreground">Ou continuer avec</span>
            </Separator>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/" })}
            >
              <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={16} height={16} className="size-4" />
              Continuer avec Google
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
