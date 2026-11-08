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
  Cylinder,
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
import {
  getAdminNavItems,
  type StaffNavRole,
} from "@/app/_components/admin-nav-items"

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Tableau de bord",
  "/admin/users": "Utilisateurs",
  "/admin/vendeurs": "Vendeurs",
  "/admin/points-de-vente": "Points de vente",
  "/admin/disponibilites": "Disponibilités",
  "/admin/marketing": "Publicités",
  "/admin/avis": "Avis & témoignages",
  "/admin/statistiques": "Statistiques",
  "/admin/profil": "Mon profil",
  "/admin/parametres": "Paramètres",
}

export function AdminTopBar({
  role,
  permissions,
  collapsed,
  onToggleCollapse,
}: {
  role: StaffNavRole
  permissions: string[]
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
  const items = getAdminNavItems(role, permissions)
  const roleLabel = role === "collaborateur" ? "Collaborateur" : "Administrateur"
  const initial = user?.name?.charAt(0).toUpperCase() ?? "A"
  const userName = user?.name ?? "Utilisateur"
  const title = PAGE_TITLES[pathname] ?? "Administration"

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <div
      className={cn(
        "sticky top-0 z-40 flex h-12 items-center gap-1 border-b border-border bg-background/85 px-3 backdrop-blur-md supports-backdrop-filter:bg-background/65 lg:px-4",
        collapsed ? "pl-2" : "pl-5"
      )}
    >
      {/* Bouton de réduction / agrandissement de la barre latérale (bureau uniquement) */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 hidden lg:flex"
        onClick={onToggleCollapse}
        aria-label={
          collapsed
            ? "Développer le menu latéral"
            : "Réduire le menu latéral"
        }
      >
        {collapsed ? (
          <ChevronRight className="size-3.5" />
        ) : (
          <ChevronLeft className="size-3.5" />
        )}
      </Button>

      {/* Boutons de navigation historique */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => router.back()}
        aria-label="Page précédente"
      >
        <ArrowLeft className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => router.forward()}
        aria-label="Page suivante"
      >
        <ArrowRight className="size-3.5" />
      </Button>

      <span className="sr-only">Navigation précédente / suivante</span>

      {/* Identifiant de l'application + titre de la page active */}
      <div className="flex shrink-0 items-center gap-2 px-2 py-1 rounded-lg bg-muted/50 text-muted-foreground">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Cylinder className="size-3" aria-hidden />
        </span>
        <span className={cn("text-xs font-semibold", collapsed ? "hidden" : "")}>
          {title}
        </span>
      </div>

      <div className="flex-1"></div>

      {/* Champ de recherche (centre, inspiré Outlook) — masqué sur mobile étroit */}
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

      {/* Notifications */}
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

      {/* Menu utilisateur */}
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                collapsed ? "hidden sm:flex" : ""
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
      <div className="ml-auto lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="Ouvrir le menu d'administration"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[90vw] max-w-md p-0">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Cylinder className="size-5" aria-hidden />
                </span>
                GAZ POINT Admin
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-4" aria-label="Navigation administration mobile">
              {items.map((item) => {
                const Icon = item.icon
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
                    <Icon className="size-4" aria-hidden />
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
