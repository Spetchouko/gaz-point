"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Menu, Search, User, LogOut, LayoutDashboard, ChevronDown } from "lucide-react"
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
  { href: "/#trouver-du-gaz", label: "Trouver du gaz", isAction: true },
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

  const handleActionClick = (e: React.MouseEvent, href: string) => {
    if (!isAuthenticated) {
      e.preventDefault()
      closeMenu()
      openAuthModal("register")
    } else {
      closeMenu()
      router.push(href)
    }
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/65">
      <div className="container mx-auto flex h-16 items-center gap-3 px-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
        <Link
          href="/"
          onClick={closeMenu}
          className="flex items-center gap-2 transition-opacity hover:opacity-80 lg:justify-self-start"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F2] ring-1 ring-black/5">
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

        <nav className="hidden items-center gap-5 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              {...link}
              active={pathname === link.href}
              onClick={link.isAction ? (e) => handleActionClick(e, link.href) : undefined}
            />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:justify-self-end">
          {isAuthenticated && session?.user ? (
            <UserMenu
              user={session.user}
              onSignOut={handleSignOut}
            />
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex h-9 px-3 cursor-pointer"
                onClick={() => openAuthModal("login")}
              >
                Se connecter
              </Button>
              <Button
                size="sm"
                className="h-9 px-4 cursor-pointer"
                onClick={() => openAuthModal("register")}
              >
                S'inscrire
              </Button>
            </>
          )}

          <Button
            size="lg"
            className="h-9 gap-1.5 px-4 cursor-pointer"
            onClick={(e) => handleActionClick(e, "/#trouver-du-gaz")}
          >
            <Search className="size-4" />
            Trouver du gaz
          </Button>

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
            <SheetContent side="right" className="w-[85vw] max-w-sm gap-0 p-0">
              <SheetHeader className="border-b p-4">
                <SheetTitle>Menu</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Trouve du gaz près de chez toi.
                </p>
              </SheetHeader>

              <nav className="flex flex-col gap-1 p-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={link.isAction ? (e) => handleActionClick(e, link.href) : closeMenu}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className="rounded-lg px-3 py-3 text-base text-foreground transition-colors hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                ))}
                {isAuthenticated && (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={closeMenu}
                      className="rounded-lg px-3 py-3 text-base text-foreground transition-colors hover:bg-muted flex items-center gap-2"
                    >
                      <LayoutDashboard className="size-4" />
                      Tableau de bord
                    </Link>
                    <Link
                      href="/profil"
                      onClick={closeMenu}
                      className="rounded-lg px-3 py-3 text-base text-foreground transition-colors hover:bg-muted flex items-center gap-2"
                    >
                      <User className="size-4" />
                      Mon profil
                    </Link>
                    <button
                      onClick={() => { handleSignOut(); closeMenu(); }}
                      className="rounded-lg px-3 py-3 text-base text-destructive transition-colors hover:bg-muted flex items-center gap-2 w-full text-left"
                    >
                      <LogOut className="size-4" />
                      Déconnexion
                    </button>
                  </>
                )}
              </nav>

              <SheetFooter className="border-t p-4">
                <Button
                  size="lg"
                  className="h-11 w-full gap-1.5 cursor-pointer"
                  onClick={(e) => handleActionClick(e, "/#trouver-du-gaz")}
                >
                  <Search className="size-4" />
                  Trouver du gaz
                </Button>
              </SheetFooter>
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
  onClick,
}: {
  href: string
  label: string
  active?: boolean
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      data-active={active || undefined}
      className="relative py-1 text-sm text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:text-foreground hover:after:scale-x-100 data-active:text-foreground data-active:font-medium data-active:after:scale-x-100"
    >
      {label}
    </Link>
  )
}