"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LogIn, Menu, Sun, UserPlus, X, User } from "lucide-react"
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const closeMenu = () => setMobileMenuOpen(false)
  const { data: session } = authClient.useSession()
  const isAuthenticated = !!session?.user
  const { theme, setTheme } = useTheme()

  // Green brand background for the header
  const headerClassName =
    "sticky top-0 z-50 bg-primary border-b border-primary/20"

  const navLinkClassName =
    "relative px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-white after:transition-transform hover:after:scale-x-100"

  return (
    <header className={headerClassName}>
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo à gauche dans un cercle blanc */}
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

        {/* Navigation principale - alignée à droite sur desktop, masquée sur mobile */}
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

        {/* Actions utilisateur / Menu mobile */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("nav_account")}
                    className={cn(
                      "hidden sm:inline-flex text-white/90 hover:text-white",
                      "rounded-lg cursor-pointer"
                    )}
                  >
                    <User className="size-4" />
                    <span className="absolute top-1 right-1 size-2 rounded-full bg-primary text-white text-[10px] leading-none">
                      +
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/connexion"
                      className="flex items-center gap-2 text-foreground"
                    >
                      <LogIn className="size-4" />
                      {t("nav_login")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/inscription"
                      className="flex items-center gap-2 text-foreground"
                    >
                      <UserPlus className="size-4" />
                      {t("nav_register")}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant="ghost"
              size="icon"
              aria-label={t("nav_theme")}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="hidden sm:inline-flex rounded-lg cursor-pointer text-white/90 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Sun className="size-4" />
            </Button>
          </div>

          {/* Bouton menu hamburger mobile */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-lg lg:hidden text-white"
                aria-label={t("nav_menu")}
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
              <nav className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
                {/* Section 1: Navigation principale */}
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className={cn(
                      "rounded-lg px-3 py-3 text-base font-medium transition-colors",
                      pathname === link.href
                        ? "bg-primary/10 text-primary border-l-2 border-primary pl-2"
                        : "text-foreground hover:bg-primary hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                    )}
                  >
                    {t(link.labelKey)}
                  </Link>
                ))}

                <div className="my-2 border-t border-border" />

                {/* Section 2: Compte */}
                <div className="space-y-2">
                  <p className="px-3 py-2 text-sm font-medium text-muted-foreground">
                    Votre compte
                  </p>
                  {isAuthenticated ? (
                    <UserMenu isMobile />
                  ) : (
                    <>
                      <Link
                        href="/connexion"
                        onClick={closeMenu}
                        className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium transition-colors text-foreground hover:bg-primary hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                      >
                        <LogIn className="size-4" />
                        Se connecter
                      </Link>
                      <Link
                        href="/inscription"
                        onClick={closeMenu}
                        className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium transition-colors text-foreground hover:bg-primary hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                      >
                        <UserPlus className="size-4" />
                        Créer un compte
                      </Link>
                    </>
                  )}
                </div>

                <div className="my-2 border-t border-border" />

                {/* Section 3: Apparence */}
                <button
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  aria-label={t("nav_theme")}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium transition-colors text-foreground hover:bg-primary hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground cursor-pointer"
                >
                  <Sun className="size-5" />
                  <span>Changer de thème</span>
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}