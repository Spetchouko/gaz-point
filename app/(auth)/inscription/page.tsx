"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { User, Store } from "lucide-react"
import Link from "next/link"

const CARD_HEIGHT = "max-h-[250px]"

function setRegisterRoleCookie(role: "user" | "vendor") {
  const roleKey = role === "user" ? "client" : "vendor"
  document.cookie = `gazpoint_register_role=${roleKey}; path=/; max-age=300; SameSite=Lax`
}

export default function InscriptionPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<"user" | "vendor" | null>(null)

  const handleUsager = () => {
    setRegisterRoleCookie("user")
    setSelectedRole("user")
    router.push("/inscription/usager")
  }
  const handleVendor = () => {
    setRegisterRoleCookie("vendor")
    setSelectedRole("vendor")
    router.push("/inscription/vendeur")
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-6xl px-4">

        {/* Titre en haut */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
            Créer un compte
          </h1>
          <p className="text-sm text-muted-foreground">
            Choisissez votre profil et commencez.
          </p>
        </div>

        {/* Cartes */}
        <div className="grid max-w-140 mx-auto gap-4 md:grid-cols-2">

          {/* Carte Usager - Bleu clair */}
          <Card
            className={cn(
              CARD_HEIGHT,
              "flex flex-col items-center rounded-xl bg-info/5 border-info/20 hover:border-info/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer p-4",
              selectedRole === "user"
                ? "border-info ring-2 ring-info/20 bg-info/10"
                : ""
            )}
            onClick={handleUsager}
            onKeyDown={(e) => e.key === "Enter" && handleUsager()}
            role="button"
            tabIndex={0}
            aria-label="Compte usager"
          >
            <div className="relative mb-3 shrink-0">
              <div className="size-12 rounded-full bg-info/10 flex items-center justify-center mx-auto border border-info/20">
                <User className="size-5 text-info" />
              </div>
              {selectedRole === "user" && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-3 rounded-full bg-info ring-2 ring-background" />
              )}
            </div>
            <h3 className="font-heading text-sm font-semibold text-info mb-1">Compte usager</h3>
            <p className="text-xs text-info/80 text-center mb-4 leading-snug px-1 flex-1">
              Trouvez facilement les disponibilités de gaz près de vous.
            </p>
            <Button
              type="button"
              className="w-full px-5 py-2 text-sm font-medium bg-info hover:bg-info-strong text-white"
              onClick={(e) => {
                e.stopPropagation()
                handleUsager()
              }}
              disabled={selectedRole === "user"}
            >
              Continuer
            </Button>
          </Card>

          {/* Carte Vendeur - Vert/Émeraude clair */}
          <Card
            className={cn(
              CARD_HEIGHT,
              "flex flex-col items-center rounded-xl bg-success/5 border-success/20 hover:border-success/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer p-4",
              selectedRole === "vendor"
                ? "border-success ring-2 ring-success/20 bg-success/10"
                : ""
            )}
            onClick={handleVendor}
            onKeyDown={(e) => e.key === "Enter" && handleVendor()}
            role="button"
            tabIndex={0}
            aria-label="Compte vendeur"
          >
            <div className="relative mb-3 shrink-0">
              <div className="size-12 rounded-full bg-success/10 flex items-center justify-center mx-auto border border-success/20">
                <Store className="size-5 text-success" />
              </div>
              {selectedRole === "vendor" && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-3 rounded-full bg-success ring-2 ring-background" />
              )}
            </div>
            <h3 className="font-heading text-sm font-semibold text-success mb-1">Compte vendeur</h3>
            <p className="text-xs text-success/80 text-center mb-4 leading-snug px-1 flex-1">
              Publiez et gérez la disponibilité de vos bouteilles de gaz.
            </p>
            <Button
              type="button"
              className="w-full px-5 py-2 text-sm font-medium bg-success hover:bg-success-strong text-white"
              onClick={(e) => {
                e.stopPropagation()
                handleVendor()
              }}
              disabled={selectedRole === "vendor"}
            >
              Continuer
            </Button>
          </Card>

        </div>

        {/* Bas de page */}
        <div className="mt-8 flex flex-col items-center gap-2 text-center">
          <Link
            href="/connexion?redirect=/dashboard"
            className="text-sm text-primary hover:underline font-medium"
          >
            Vous avez déjà un compte ? Se connecter
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Retour à l&apos;accueil
          </Link>
        </div>

      </div>
    </div>
  )
}