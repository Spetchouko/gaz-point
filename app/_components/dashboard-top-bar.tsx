"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Bell, LogOut, Menu, Search, User } from "lucide-react"
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
import {
  getDashboardNavSections,
} from "./dashboard-nav-items"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/dashboard/reservations": "Mes réservations",
  "/dashboard/historique-codes": "Historique des codes",
  "/avis": "Donner mon avis",
  "/profil": "Mon profil",
  "/dashboard/vendeur": "Tableau de bord vendeur",
  "/dashboard/vendeur/points-de-vente": "Mon point de vente",
  "/dashboard/vendeur/disponibilites": "Disponibilités de gaz",
  "/dashboard/vendeur/reservations": "Mes réservations",
  "/dashboard/vendeur/profil": "Mon profil",
  "/admin": "Tableau de bord admin",
  "/admin/users": "Utilisateurs",
  "/admin/vendeurs": "Vendeurs",
  "/admin/points-de-vente": "Points de vente",
  "/admin/disponibilites": "Disponibilités",
  "/admin/marketing": "Publicités",
  "/admin/avis": "Avis & témoignages",
  "/admin/statistiques": "Statistiques",
  "/admin/profil": "Mon profil",
  "/admin/parametres": "Paramètres",
  "/admin/collaborateurs": "Collaborateurs",
}

export function DashboardTopBar({
  role,
  collapsed,
  onToggleCollapse,
  permissions,
}: {
  role: DashboardRole
  collapsed: boolean
  onToggleCollapse: () => void
  permissions?: string[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: session } = authClient.useSession()
  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string | null }
    | undefined
  const roleLabel =
    role === "vendor"
      ? "Vendeur"
      : role === "admin" || role === "collaborateur"
        ? "Administrateur"
        : "Usager"
  const initial = user?.name?.charAt(0).toUpperCase() ?? "U"
  const userName = user?.name ?? roleLabel
  const title = PAGE_TITLES[pathname] ?? "Tableau de bord"
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  // Items de navigation mobile, regroupés par rôle
  const sections = getDashboardNavSections(role, permissions)
  const mobileItems: Array<{
    href: string
    label: string
    icon: React.ComponentType<{ className?: string }>
  }> = sections.flatMap((s) => s.items)

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  const adminHref = role === "admin" || role === "collaborateur" ? "/admin" : "/dashboard"

  return (
    <div
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-1 border-b border-border bg-background/85 px-3 backdrop-blur-md supports-backdrop-filter:bg-background/65 lg:px-4",
        collapsed ? "pl-2" : "pl-5"
      )}
    >
      {/* Logo + titre de page active (compact, mobile-friendly) */}
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={adminHref}
          className="flex items-center gap-2 px-2 py-1 rounded-lg text-primary font-semibold tracking-tight text-sm"
          onClick={(e) => {
            e.preventDefault()
            router.push(adminHref)
          }}
        >
          <Image
            src="/brand/logo.png"
            alt="GazPoints"
            width={24}
            height={24}
            className="shrink-0 size-6"
          />
          <span className="text-sm font-bold tracking-tight">GazPoints</span>
        </Link>

        <span className="inline-block text-muted-foreground">
          /
        </span>
        <span className={cn("text-xs font-semibold text-muted-foreground", collapsed ? "hidden" : "")}>
          {title}
        </span>
      </div>

      <div className="flex-1"></div>

      {/* Champ de recherche (centre, masqué sur mobile étroit) */}
      <div className="hidden md:flex items-center">
        <div className="relative w-[220px] max-w-xs shrink-0">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Rechercher…"
            className="w-full h-8 pl-8 pr-2.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          />
        </div>
      </div>

      {/* Notifications (masqué sur mobile étroit) */}
      <div className="hidden sm:flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Notifications"
        >
          <Bell className="size-3.5" />
        </Button>
      </div>

      {/* Menu utilisateur (desktop/tablette) */}
      <div className="flex items-center gap-1 hidden lg:flex">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-label="Profil utilisateur"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                {initial}
              </span>
              <div className="hidden sm:flex flex-col min-w-0">
                <p className="truncate text-xs font-medium text-foreground">
                  {userName}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {roleLabel}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-0">
            <DropdownMenuItem className="flex items-center gap-2 text-xs">
              <User className="size-3.5" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive text-xs"
              onClick={handleSignOut}
            >
              <LogOut className="size-3.5" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bouton menu mobile / tablette */}
      <div className="ml-auto lg:hidden flex items-center gap-1">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger>
            <button
              type="button"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="Ouvrir le menu"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[90vw] max-w-md p-0 border-none shadow-xl">
            <SheetHeader className="border-b border-border p-4 bg-card">
              <SheetTitle className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
                <Image
                  src="/brand/logo.png"
                  alt="GazPoints"
                  width={24}
                  height={24}
                  className="size-6 shrink-0"
                />
                <span className="text-sm font-bold tracking-tight">GazPoints</span>
                <span className="ml-auto text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {roleLabel}
                </span>
              </SheetTitle>
              <span className="text-[10px] text-muted-foreground truncate ml-4">
                {userName}
              </span>
            </SheetHeader>
            <nav className="flex flex-col gap-0.5 p-3" aria-label="Navigation du dashboard mobile">
              {mobileItems.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary border border-primary/100"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                )
              })}
              <div className="border-t border-border mt-2 pt-3 space-y-0">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground text-destructive"
                  onClick={() => {
                    setMobileOpen(false)
                    handleSignOut()
                  }}
                >
                  <LogOut className="size-4 shrink-0" />
                  Déconnexion
                </button>
              </div>
            </nav>
            <div className="p-3 border-t border-border text-center space-y-2">
              <Link
                href={adminHref}
                className="block text-xs font-medium text-primary hover:text-primary-strong"
                onClick={() => setMobileOpen(false)}
              >
                ← Retour au tableau de bord
              </Link>
              <Link
                href="/"
                className="block text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {"Retour à l\u0027accueil"}
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
