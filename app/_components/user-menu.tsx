"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LayoutDashboard, LogOut, User } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { useSafeSession } from "@/lib/auth-session"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar } from "@/components/ui/avatar"
import { UserRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface UserMenuProps {
  isMobile?: boolean
  iconOnly?: boolean
}

export function UserMenu({ isMobile = false, iconOnly = false }: UserMenuProps) {
  const router = useRouter()
  const t = useTranslation()
  const { data: session } = useSafeSession()
  const user = session?.user
  const role = (user as { role?: string } | undefined)?.role
  const espaceHref =
    role === "admin"
      ? "/dashboard/admin"
      : role === "vendor"
        ? "/dashboard/vendeur"
        : role === "collaborateur"
          ? "/dashboard/collaborateur"
          : "/dashboard"
  const espaceLabel = "Dashboard"
  const profilHref =
    role === "admin"
      ? "/dashboard/admin/profil"
      : role === "vendor"
        ? "/dashboard/vendeur/profil"
        : "/dashboard/profil"

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  if (!user) return null

  const avatarSize = isMobile ? "lg" : "default"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label="Compte"
          className={cn(
            isMobile
              ? "w-full justify-start gap-2 py-2.5 px-3 text-left hover:bg-muted transition-colors"
              : iconOnly
                ? "size-9 rounded-lg bg-transparent text-primary hover:bg-primary hover:text-white transition-colors duration-200 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                : "size-10 rounded-md bg-white text-primary shadow-sm hover:bg-primary-strong hover:text-white transition-colors duration-200 p-0",
            !iconOnly && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          )}
        >
          {isMobile ? (
            <Avatar className="size-8 flex items-center justify-center" data-size={avatarSize}>
              <UserRound className="size-4" />
            </Avatar>
          ) : (
            <UserRound className="size-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 border-b">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={espaceHref}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <LayoutDashboard className="size-4" />
            {espaceLabel}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={profilHref}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <User className="size-4" />
            {t("nav_profil")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 text-left text-destructive focus:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            {t("nav_logout")}
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}