"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Menu, User, LogOut, LayoutDashboard, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthModal } from "@/lib/auth-context"
import { authClient } from "@/lib/auth-client"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
  { href: "/#faq", label: "FAQ" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
]

function UserMenu({
  user,
  onSignOut,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null }
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="gap-2 h-9 px-3 pr-2"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Avatar className="size-8">
          <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
            {user.name?.charAt(0).toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
        <span className="hidden sm:block font-medium">{user.name?.split(" ")[0]}</span>
        <ChevronDown className="size-4" />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2">
            <div className="px-2 py-1.5 flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
            <hr className="my-1 border-muted" />
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-foreground hover:bg-accent rounded-sm"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="size-4" />
              Tableau de bord
            </Link>
            <Link
              href="/profil"
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-foreground hover:bg-accent rounded-sm"
              onClick={() => setOpen(false)}
            >
              <User className="size-4" />
              Mon profil
            </Link>
            <hr className="my-1 border-muted" />
            <button
              onClick={() => { onSignOut(); setOpen(false); }}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-destructive hover:bg-accent rounded-sm"
            >
              <LogOut className="size-4" />
              Déconnexion
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, openAuthModal } = useAuthModal()
  const { data: session } = authClient.useSession()
  const closeMenu = () => setMobileMenuOpen(false)

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

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
          {isAuthenticated && session?.user ? (
            <UserMenu
              user={session.user}
              onSignOut={handleSignOut}
            />
          ) : (
            <Button
              size="sm"
              className="h-9 px-4 font-medium cursor-pointer"
              onClick={() => openAuthModal("login")}
            >
              Connexion / Inscription
            </Button>
          )}

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
                  {isAuthenticated && (
                    <>
                      <div className="my-2 border-t" />
                      <Link
                        href="/dashboard"
                        onClick={closeMenu}
                        className="rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted flex items-center gap-2.5"
                      >
                        <LayoutDashboard className="size-4 text-muted-foreground" />
                        Tableau de bord
                      </Link>
                      <Link
                        href="/profil"
                        onClick={closeMenu}
                        className="rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted flex items-center gap-2.5"
                      >
                        <User className="size-4 text-muted-foreground" />
                        Mon profil
                      </Link>
                      <button
                        onClick={() => { handleSignOut(); closeMenu(); }}
                        className="rounded-lg px-3 py-2.5 text-base font-medium text-destructive transition-colors hover:bg-destructive/10 flex items-center gap-2.5 w-full text-left"
                      >
                        <LogOut className="size-4" />
                        Déconnexion
                      </button>
                    </>
                  )}
                </nav>
              </div>

              {!isAuthenticated && (
                <SheetFooter className="border-t p-4">
                  <Button
                    size="lg"
                    className="h-10 w-full font-medium cursor-pointer"
                    onClick={() => {
                      closeMenu()
                      openAuthModal("login")
                    }}
                  >
                    Connexion / Inscription
                  </Button>
                </SheetFooter>
              )}
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