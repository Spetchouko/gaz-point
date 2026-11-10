"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LogIn, Menu, Shield, UserPlus } from "lucide-react"
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

// Compact top bar with modern styling
const topBarClassName =
  "border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50"

const navLinkClassName =
  "relative inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground transition-colors rounded-lg hover:bg-primary/10 hover:text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary after:transition-transform hover:after:scale-x-100 data-[state=active]:after:scale-x-100"

const actionButtonClassName =
  "inline-flex items-center justify-center gap-1.5 h-9 px-3.5 text-sm font-medium transition-colors rounded-lg cursor-pointer"

export function Header() {
  const t = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const closeMenu = () => setMobileMenuOpen(false)
  const { data: session } = authClient.useSession()
  const isAuthenticated = !!session?.user

  return (
    <header className={topBarClassName}>
      <div className="container mx-auto flex h-12 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={closeMenu}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80 shrink-0"
        >
          <Image
            src="/brand/logo.png"
            alt="GazPoints"
            width={20}
            height={20}
            className="h-5 w-5 object-contain shrink-0"
            style={{ width: "auto", height: "auto" }}
          />
          <span className="font-heading text-lg font-bold tracking-tight text-foreground">
            GazPoints
          </span>
        </Link>

        <nav
          aria-label="Navigation principale"
          className="flex-1 flex items-center justify-center"
        >
          <ul className="hidden items-center gap-1 sm:flex lg:gap-2" role="menubar">
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

        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "hidden sm:inline-flex gap-2",
                      actionButtonClassName
                    )}
                  >
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

              <SettingsPopover />
            </>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg lg:hidden"
                aria-label={t("nav_menu")}
              >
                <Menu className="size-5" />
                <span className="sr-only">{t("nav_menu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-[85vw] max-w-sm flex-col p-0"
            >
              <nav className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
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
                        {t("nav_register")}
                      </Link>
                      <Link
                        href="/connexion"
                        onClick={closeMenu}
                        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <LogIn className="size-4" />
                        {t("nav_login")}
                      </Link>
                      <Link
                        href="/admin/login"
                        onClick={closeMenu}
                        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <Shield className="size-4" />
                        {t("nav_admin_login")}
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