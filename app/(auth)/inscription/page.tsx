"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModernCard } from "@/app/_components/card-modern"
import { User, Store } from "lucide-react"
import Link from "next/link"

const CARD_HEIGHT = "max-h-[320px]"

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
    <div className="min-h-screen bg-background px-4 py-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 mb-4">
            <User className="size-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            Rejoignez GazPoints
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
            Créez votre compte et profitez d’un accès simplifié aux services GazPoints.
          </p>
        </div>

        {/* Role selection cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Client card */}
          <ModernCard
            className={cn(
              CARD_HEIGHT,
              "flex flex-col items-center p-8 rounded-2xl border border-border bg-white dark:bg-background shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer",
              selectedRole === "user"
                ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                : "hover:border-primary/40"
            )}
            onClick={handleUsager}
            onKeyDown={(e) => e.key === "Enter" && handleUsager()}
            role="button"
            tabIndex={0}
            aria-label="Compte client"
          >
            <div className="mb-6 shrink-0">
              <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <User className="size-6 text-primary" />
              </div>
              {selectedRole === "user" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-4 rounded-full bg-primary ring-2 ring-background" />
              )}
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">Compte client</h3>
            <p className="text-sm text-muted-foreground text-center leading-relaxed px-4">
              Trouvez facilement les disponibilités de gaz près de chez vous.
              Évitez les déplacements inutiles.
            </p>
            <Button
              type="button"
              className="mt-6 w-full px-8 py-3 text-sm font-medium bg-primary hover:bg-primary-strong text-white shadow-sm hover:shadow-md"
              onClick={(e) => {
                e.stopPropagation()
                handleUsager()
              }}
              disabled={selectedRole === "user"}
            >
              Continuer
            </Button>
          </ModernCard>

          {/* Vendor card */}
          <ModernCard
            className={cn(
              CARD_HEIGHT,
              "flex flex-col items-center p-8 rounded-2xl border border-border bg-white dark:bg-background shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer",
              selectedRole === "vendor"
                ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                : "hover:border-primary/40"
            )}
            onClick={handleVendor}
            onKeyDown={(e) => e.key === "Enter" && handleVendor()}
            role="button"
            tabIndex={0}
            aria-label="Compte vendeur"
          >
            <div className="mb-6 shrink-0">
              <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Store className="size-6 text-primary" />
              </div>
              {selectedRole === "vendor" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-4 rounded-full bg-primary ring-2 ring-background" />
              )}
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">Compte vendeur</h3>
            <p className="text-sm text-muted-foreground text-center leading-relaxed px-4">
              Publiez et gérez la disponibilité de vos bouteilles de gaz.
              Attirez plus de clients.
            </p>
            <Button
              type="button"
              className="mt-6 w-full px-8 py-3 text-sm font-medium bg-primary hover:bg-primary-strong text-white shadow-sm hover:shadow-md"
              onClick={(e) => {
                e.stopPropagation()
                handleVendor()
              }}
              disabled={selectedRole === "vendor"}
            >
              Continuer
            </Button>
          </ModernCard>
        </div>

        {/* Footer links */}
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
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
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
