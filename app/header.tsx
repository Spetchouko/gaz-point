"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LogIn,
  Menu,
  UserPlus,
  X,
  Sun,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"
import { UserMenu } from "@/app/_components/user-menu"
import { useTheme } from "@/app/_components/theme-provider"
import { useTranslation } from "@/lib/i18n"

const navLinks = [
  { href: "/", labelKey: "nav_home" },
  { href: "/#comment-ca-marche", labelKey: "nav_how" },
  { href: "/#faq", labelKey: "nav_faq" },
  { href: "/a-propos", labelKey: "nav_about" },
  { href: "/contact", labelKey: "nav_contact" },
]

export function Header() {
  const t = useTranslation()
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const closeMenu = () => setMobileMenuOpen(false)
  const { data: session } = authClient.useSession()
  const isAuthenticated = !!session?.user

  // Green brand background for the header
  const headerClassName =
    "sticky top-0 z-50 bg-primary border-b border-primary/20"

  const navLinkClassName =
    "relative px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-white after:transition-transform hover:after:scale-x-100"

  return (
    <header className={headerClassName}>
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo à gauche - toujours visible */}
        <Link
          href="/"
          onClick={closeMenu}
          className="flex items-center gap-3 transition-opacity hover:opacity-80 shrink-0"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-white shrink-0">
            <Image
              src="/brand/logo.png"
              alt="GazPoints"
              width={24}
              height={24}
              className="size-5 object-contain"
              style={{ width: "auto", height: "auto" }}
            />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight text-white">
            GazPoints
          </span>
        </Link>

        {/* Navigation principale - desktop uniquement */}
        <nav
          aria-label="Navigation principale"
          className="hidden flex-1 flex items-center justify-end lg:flex"
        >
          <ul className="flex items-center gap-1 lg:gap-4" role="menubar">
            {navLinks.map((link) => (
              <li key={link.href} role="none">
                <Link
                  href={link.href}
                  role="menuitem"
                  className={navLinkClassName}
                >
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Actions utilisateur - desktop uniquement */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-lg text-white"
                  aria-label="Mon compte"
                >
                  <User className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link
                    href="/connexion"
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <LogIn className="size-4" />
                    Se connecter
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/inscription"
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <UserPlus className="size-4" />
                    Créer un compte
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-lg text-white"
            onClick={() => {
              setTheme(theme === "light" ? "dark" : "light")
            }}
            aria-label="Changer de thème"
            aria-pressed={theme === "dark"}
          >
            <Sun className="size-5" />
          </Button>
        </div>

        {/* Bouton menu hamburger mobile uniquement */}
        <div className="flex items-center gap-2 shrink-0 lg:hidden">
          <Sheet
            open={mobileMenuOpen}
            onOpenChange={setMobileMenuOpen}
          >
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-lg text-white"
                aria-label={t("nav_menu")}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
                <span className="sr-only">{t("nav_menu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-[85vw] max-w-sm flex-col p-0 bg-background overflow-hidden"
            >
              <div className="flex flex-col p-4 gap-6">
                <nav
                  className="flex flex-col gap-1 overflow-y-auto max-h-[60vh]"
                  aria-label="Menu mobile"
                >
                  {/* Liens de navigation publique */}
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      aria-current={pathname === link.href ? "page" : undefined}
                      className="rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {t(link.labelKey)}
                    </Link>
                  ))}

                  <div className="my-2 border-t border-border" />

                  {/* Section COMPTE */}
                  <div className="space-y-2 px-3">
                    <p className="px-2 py-1 text-sm font-medium text-muted-foreground">
                      {t("nav_account")}
                    </p>
                    {isAuthenticated ? (
                      <UserMenu />
                    ) : (
                      <>
                        <Link
                          href="/connexion"
                          onClick={closeMenu}
                          className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <LogIn className="size-4" />
                          Se connecter
                        </Link>
                        <Link
                          href="/inscription"
                          onClick={closeMenu}
                          className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <UserPlus className="size-4" />
                          Créer un compte
                        </Link>
                        </>
                      )}
                  </div>

                  <div className="my-2 border-t border-border" />

                  {/* Section APPARENCE — basculement clair / sombre uniquement */}
                  <div className="px-3">
                    <button
                      onClick={() => {
                        setTheme(theme === "light" ? "dark" : "light")
                        closeMenu()
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <Sun className="size-4" />
                      <span>
                        {theme === "light"
                          ? "Passer en mode sombre"
                          : "Passer en mode clair"}
                      </span>
                    </button>
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
