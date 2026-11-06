"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LayoutDashboard, LogOut, User } from "lucide-react"
import { authClient } from "@/lib/auth-client"
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
}

export function UserMenu({ isMobile = false }: UserMenuProps) {
  const router = useRouter()
  const t = useTranslation()
  const { data: session } = authClient.useSession()
  const user = session?.user
  const role = (user as { role?: string } | undefined)?.role
  const isStaff = role === "admin" || role === "collaborateur"
  const espaceHref = isStaff ? "/admin" : role === "vendor" ? "/dashboard/vendeur" : "/dashboard"
  const espaceLabel = "Dashboard"

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
          className={cn("gap-2 h-9 px-3", isMobile && "w-full justify-start py-2.5 text-left")}
        >
          <Avatar className="size-8 flex items-center justify-center" data-size={avatarSize}>
            <UserRound className="size-4" />
          </Avatar>
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
            href={isStaff ? "/admin/profil" : "/profil"}
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