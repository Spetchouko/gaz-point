"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, UserPlus, LogIn } from "lucide-react"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
  { href: "/#faq", label: "FAQ" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/65">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 lg:grid lg:grid-cols-[auto_1fr_auto] lg:gap-8">
        <Link
          href="/"
          onClick={closeMenu}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F2] ring-1 ring-black/5 shadow-xs">
            <Image
              src="/brand/logo.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight text-foreground">
            GazPoint
          </span>
        </Link>

        <nav className="hidden items-center justify-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              {...link}
              active={pathname === link.href}
            />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 hidden sm:flex">
                <UserPlus className="size-4" />
                <span>Compte</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <Link
                  href="/inscription"
                  className="flex items-center gap-2"
                >
                  <UserPlus className="size-4" />
                  S'inscrire
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/connexion"
                  className="flex items-center gap-2"
                >
                  <LogIn className="size-4" />
                  Se connecter
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center rounded-lg text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden"
                >
                  <Menu className="size-5" />
                  <span className="sr-only">Ouvrir le menu</span>
                </button>
              }
            />
            <SheetContent side="right" className="w-[85vw] max-w-sm flex flex-col justify-between p-0">
              <div>
                <SheetHeader className="border-b p-4">
                  <SheetTitle>Menu</SheetTitle>
                  <p className="text-sm text-muted-foreground">
                    Navigation GazPoint
                  </p>
                </SheetHeader>

                <nav className="flex flex-col gap-1 p-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      aria-current={pathname === link.href ? "page" : undefined}
                      className="rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="border-t my-2" />
                  <div className="space-y-2">
                    <p className="px-3 py-2 text-sm font-medium text-muted-foreground">Compte</p>
                    <Link
                      href="/inscription"
                      onClick={closeMenu}
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <UserPlus className="size-4" />
                      S'inscrire
                    </Link>
                    <Link
                      href="/connexion"
                      onClick={closeMenu}
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <LogIn className="size-4" />
                      Se connecter
                    </Link>
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

function NavLink({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      data-active={active || undefined}
      className="relative py-1 text-sm font-medium text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary after:transition-transform hover:text-foreground hover:after:scale-x-100 data-active:text-foreground data-active:after:scale-x-100"
    >
      {label}
    </Link>
  )
}