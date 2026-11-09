"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LogIn, Menu, Shield, UserPlus } from "lucide-react"
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
import { UserMenu } from "@/app/_components/user-menu"
import { SettingsPopover } from "@/app/_components/settings-popover"
import { useTranslation } from "@/lib/i18n"

const navLinks = [
  { href: "/", labelKey: "nav_home" },
  { href: "/#comment-ca-marche", labelKey: "nav_how" },
  { href: "/#faq", labelKey: "nav_faq" },
  { href: "/a-propos", labelKey: "nav_about" },
  { href: "/contact", labelKey: "nav_contact" },
]

// Outlook-style: compact top bar with menu bar styling
const topBarClassName =
  "border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50"

const navLinkClassName =
  "relative inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground transition-colors rounded-lg hover:bg-primary/10 hover:text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary after:transition-transform hover:after:scale-x-100 data-[state=active]:after:scale-x-100"

export function Header() {
  const t = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const closeMenu = () => setMobileMenuOpen(false)
  const { data: session } = authClient.useSession()
  const isAuthenticated = !!session?.user

  return (
    <header className={topBarClassName}>
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={closeMenu}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <Image
            src="/brand/logo.png"
            alt="GazPoints"
            width={20}
            height={20}
            className="h-5 w-5 object-contain shrink-0"
          />
          <span className="font-heading text-lg font-bold tracking-tight text-foreground">
            GazPoints
          </span>
        </Link>

        <nav aria-label="Navigation" className="hidden items-center justify-center gap-2 sm:gap-4 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={navLinkClassName}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden sm:flex gap-2 cursor-pointer">
                  <UserPlus className="size-4" />
                  <span>{t("nav_account")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    href="/inscription"
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="size-4" />
                    {t("nav_register")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/connexion"
                    className="flex items-center gap-2"
                  >
                    <LogIn className="size-4" />
                    {t("nav_login")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin/login"
                    className="flex items-center gap-2"
                  >
                    <Shield className="size-4" />
                    {t("nav_admin_login")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <SettingsPopover />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger>
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-lg text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden cursor-pointer"
              >
                <Menu className="size-5" />
                <span className="sr-only">{t("nav_account")}</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-[85vw] max-w-sm flex-col justify-between p-0"
            >
              <div className="flex flex-col gap-2 p-4">
                <span className="text-sm text-muted-foreground">
                  {t("nav_home")} {t("nav_contact")}
                </span>
              </div>

              <nav className="flex flex-col gap-1 p-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      aria-current={pathname === link.href ? "page" : undefined}
                      className="rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {t(link.labelKey)}
                    </Link>
                  ))}
                  <div className="my-2 border-t border-border" />
                  <div className="space-y-2">
                    <p className="px-3 py-2 text-sm font-medium text-muted-foreground">
                      {t("nav_account")}
                    </p>
                    {isAuthenticated ? (
                      <UserMenu isMobile />
                    ) : (
                      <>
                        <Link
                          href="/inscription"
                          onClick={closeMenu}
                          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <UserPlus className="size-4" />
                          S’inscrire
                        </Link>
                        <Link
                          href="/connexion"
                          onClick={closeMenu}
                          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <LogIn className="size-4" />
                          Se connecter
                        </Link>
                        <Link
                          href="/admin/login"
                          onClick={closeMenu}
                          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <Shield className="size-4" />
                          Connexion administrateur
                        </Link>
                      </>
                    )}
                  </div>
                </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}