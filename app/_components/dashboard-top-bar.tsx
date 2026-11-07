"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Search,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import type { DashboardRole } from "./dashboard-nav-items"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/dashboard/reservations": "Mes réservations",
  "/dashboard/favoris": "Mes favoris",
  "/dashboard/historique-codes": "Historique des codes",
  "/avis": "Donner mon avis",
  "/profil": "Mon profil",
  "/dashboard/vendeur": "Tableau de bord vendeur",
  "/dashboard/vendeur/points-de-vente": "Mon point de vente",
  "/dashboard/vendeur/disponibilites": "Disponibilités de gaz",
  "/dashboard/vendeur/consignations": "Mes consignations",
  "/dashboard/vendeur/profil": "Mon profil",
}

export function DashboardTopBar({
  role,
  collapsed,
  onToggleCollapse,
}: {
  role: DashboardRole
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: session } = authClient.useSession()
  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string | null }
    | undefined
  const roleLabel = role === "vendor" ? "Vendeur" : "Usager"
  const initial = user?.name?.charAt(0).toUpperCase() ?? "U"
  const userName = user?.name ?? (role === "vendor" ? "Vendeur" : "Usager")
  const title = PAGE_TITLES[pathname] ?? "Tableau de bord"
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  const items = [
    { href: "/dashboard", label: "Tableau de bord" },
    { href: "/dashboard/reservations", label: "Mes réservations" },
    { href: "/dashboard/favoris", label: "Mes favoris" },
    { href: "/dashboard/historique-codes", label: "Historique des codes" },
    { href: "/avis", label: "Donner mon avis" },
    { href: "/profil", label: "Mon profil" },
  ]

  return (
    <div
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-1 border-b border-border bg-background/85 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/65 lg:px-6",
        collapsed ? "pl-3" : "pl-6"
      )}
    >
      {/* Bouton de réduction / agrandissement de la barre latérale (bureau uniquement) */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 hidden lg:flex"
        onClick={onToggleCollapse}
        aria-label={
          collapsed
            ? "Développer le menu latéral"
            : "Réduire le menu latéral"
        }
      >
        {collapsed ? (
          <ChevronRight className="size-4" />
        ) : (
          <ChevronLeft className="size-4" />
        )}
      </Button>

      {/* Boutons de navigation historique */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => router.back()}
        aria-label="Page précédente"
      >
        <ArrowLeft className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => router.forward()}
        aria-label="Page suivante"
      >
        <ArrowRight className="size-4" />
      </Button>

      <span className="sr-only">Navigation précédente / suivante</span>

      {/* Identifiant de l'application + titre de la page active */}
      <div className="flex shrink-0 items-center gap-2 px-3 py-1 rounded-lg bg-muted/50 text-muted-foreground">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <User className="size-3.5" aria-hidden />
        </span>
        <span className={cn("text-sm font-semibold", collapsed ? "hidden" : "")}>
          {title}
        </span>
      </div>

      <div className="flex-1"></div>

      {/* Champ de recherche (centre, inspiré Outlook) */}
      <div className="hidden sm:flex items-center">
        <div className="relative w-[260px] max-w-xs shrink-0">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Rechercher…"
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="hidden sm:flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </Button>
      </div>

      {/* Menu utilisateur */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                collapsed ? "hidden sm:flex" : ""
              )}
              aria-label="Profil utilisateur"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                {initial}
              </span>
              <div className="hidden sm:flex flex-col min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {userName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {roleLabel}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-0">
            <DropdownMenuItem className="flex items-center gap-2 text-sm">
              <User className="size-4" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bouton menu mobile */}
      <div className="ml-auto lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="Ouvrir le menu"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-sm p-0">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <User className="size-5" aria-hidden />
                </span>
                GazPoints
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-4" aria-label="Navigation du dashboard mobile">
              {items.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
              <div className="border-t border-border mt-3 pt-3 space-y-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => {
                    setMobileOpen(false)
                    handleSignOut()
                  }}
                >
                  <LogOut className="size-4" />
                  Déconnexion
                </button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}