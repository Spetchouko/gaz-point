"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Package,
  Search,
  User,
  BarChart3,
  LayoutDashboard,
} from "lucide-react";
import type { DashboardUser } from "@/lib/auth-session";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { DashboardFooter } from "@/app/_components/dashboard/dashboard-footer";
import { ScrollToTop } from "@/app/_components/dashboard/scroll-to-top";
import { DashboardQuickActions } from "@/app/_components/dashboard/dashboard-quick-actions";
import {
  getDashboardHomeHref,
  getDashboardNavItems,
  getDashboardNavGroups,
  getDashboardProfileHref,
  getDashboardNotificationsHref,
  getPrimaryAction,
  getSecondaryAction,
  type DashboardShellRole,
  type DashboardNavGroup,
} from "@/app/_components/dashboard/dashboard-nav";
import { cn } from "@/lib/utils";
import { useNotificationUnreadCount } from "@/lib/use-notification-unread-count";

type DashboardShellProps = {
  children: React.ReactNode;
  role?: DashboardShellRole;
  session?: DashboardUser | null;
  status?: "loading" | "authenticated" | "unauthenticated";
  // For admin/collaborateur grouped navigation
  navGroups?: DashboardNavGroup[];
  permissions?: Set<string>;
  // Custom header actions for admin (e.g., Utilisateurs, Vendeurs buttons)
  headerActions?: React.ReactNode;
};

export function DashboardShell({
  children,
  role = "client",
  session: sessionProp,
  status: statusProp,
  navGroups,
  permissions = new Set<string>(),
  headerActions,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const user = sessionProp ?? undefined;
  const status = statusProp;
  const isAuthenticated = Boolean(user);
  const dashboardHomeHref = getDashboardHomeHref(role);
  const profileHref = getDashboardProfileHref(role);
  const notificationsHref = getDashboardNotificationsHref(role);
  const navItems = getDashboardNavItems(role);
  const { unreadCount } = useNotificationUnreadCount(isAuthenticated);
  const buttonDisabled = status === "loading";

  // Le shell vendeur desserve des routes dynamiques dont le rendu RSC peut être
  // annulé par le navigateur (survol/refresh/navigation). Désactiver le prefetch
  // uniquement pour ce rôle évite ces rendus spéculatifs sans modifier le
  // comportement des dashboards client/admin/collaborateur.
  const linkPrefetch = role === "vendor" ? false : undefined;

  const primaryAction = getPrimaryAction(role);
  const secondaryAction = getSecondaryAction(role);

  // Determine active href for both flat and grouped navigation
  const allNavItems = navGroups
    ? navGroups.flatMap((group) => group.items)
    : navItems;

  const activeHref = allNavItems
    .filter((item) =>
      item.href === "/dashboard/recherches"
        ? pathname === item.href || pathname === "/resultats-recherche"
        : pathname === item.href || pathname.startsWith(`${item.href}/`)
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const isActive = (href: string) => activeHref === href;

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  const handleProfileClick = () => {
    router.push(profileHref);
  };

  const getUserAvatar = () => user?.image ?? null;

  const PrimaryActionIcon = primaryAction.icon;
  const SecondaryActionIcon = secondaryAction?.icon ?? null;

  // Filter nav groups based on permissions
  const filteredNavGroups = navGroups
    ? navGroups
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) => !item.requiredPermission || permissions.has(item.requiredPermission)
          ),
        }))
        .filter((group) => group.items.length > 0)
    : [];

  return (
    <div className="min-h-screen bg-background flex">
      <aside
        className={cn(
          "fixed inset-y-0 z-40 flex h-full flex-col bg-card transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-16" : "w-64",
          "lg:left-0 lg:translate-x-0 lg:border-r lg:border-border",
          "right-0 lg:right-auto border-l border-border",
          sidebarOpen ? "translate-x-0" : "translate-x-full",
          "lg:translate-x-0"
        )}
        aria-label="Navigation du dashboard"
      >
        <div
          className={cn(
            "flex h-16 items-center justify-between border-b border-border px-4",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          <Link
            href={dashboardHomeHref}
            prefetch={linkPrefetch}
            className="flex items-center gap-2 font-bold text-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Image
                src="/brand/logo.png"
                alt="GazPoints"
                width={24}
                height={24}
                className="h-5 w-5 object-contain"
                style={{ width: "auto", height: "auto" }}
              />
            </span>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg tracking-tight">GazPoints</span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? "Étendre le menu" : "Réduire le menu"}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="size-4" aria-hidden />
            ) : (
              <ChevronLeft className="size-4" aria-hidden />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2" aria-label="Navigation principale">
          {filteredNavGroups.length > 0 ? (
            // Grouped navigation for admin/collaborateur
            filteredNavGroups.map((group) => (
              <div key={group.groupLabel} className="space-y-0.5">
                <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.groupLabel}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        prefetch={linkPrefetch}
                        onClick={() => setSidebarOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          sidebarCollapsed && "justify-center px-2"
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", sidebarCollapsed && "mx-auto")} aria-hidden />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            // Flat navigation for client/vendor
            navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={linkPrefetch}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    sidebarCollapsed && "justify-center px-2"
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", sidebarCollapsed && "mx-auto")} aria-hidden />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })
          )}
        </nav>

        <div className={cn("space-y-2 border-t border-border p-3", sidebarCollapsed && "px-1")}>
          <div className={cn("flex items-center gap-3 rounded-lg px-3 py-2", sidebarCollapsed && "justify-center")}>
            <button
              type="button"
              onClick={handleProfileClick}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
              aria-label="Aller à mon profil"
            >
              {status === "loading" ? (
                <div className="animate-pulse rounded-full bg-muted" />
              ) : getUserAvatar() ? (
                <Image
                  src={getUserAvatar()!}
                  alt="Avatar utilisateur"
                  width={32}
                  height={32}
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <User className="size-5 text-primary" aria-hidden="true" />
              )}
            </button>
            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={handleProfileClick}
                className="min-w-0 cursor-pointer text-left"
              >
                {status === "loading" ? (
                  <div className="space-y-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-32 animate-pulse rounded bg-muted/50" />
                  </div>
                ) : (
                  <>
                    <p className="truncate text-sm font-medium text-foreground transition-colors hover:text-primary">
                      {user?.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </>
                )}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              router.push(notificationsHref);
            }}
            className={cn(
              "relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              sidebarCollapsed && "justify-center px-1"
            )}
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Notifications"}
          >
            <span className="relative flex size-4 shrink-0 items-center justify-center">
              <Bell className={cn("size-4", sidebarCollapsed && "mx-auto")} aria-hidden />
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-destructive px-1 text-center text-[10px] font-semibold leading-4 text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
            {!sidebarCollapsed && <span>Notifications</span>}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              sidebarCollapsed && "justify-center px-1"
            )}
            aria-label="Se déconnecter"
            disabled={buttonDisabled}
          >
            <LogOut className={cn("size-4 shrink-0", sidebarCollapsed && "mx-auto")} aria-hidden />
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "dashboard-surface flex min-w-0 flex-1 flex-col",
          sidebarCollapsed ? "lg:ml-[calc(4rem+1px)]" : "lg:ml-[calc(16rem+1px)]"
        )}
      >
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6 lg:hidden">
          <Link
            href={dashboardHomeHref}
            prefetch={linkPrefetch}
            className="flex items-center gap-2 font-bold text-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Image
                src="/brand/logo.png"
                alt="GazPoints"
                width={24}
                height={24}
                className="h-5 w-5 object-contain"
                style={{ width: "auto", height: "auto" }}
              />
            </span>
            <span className="text-primary font-bold tracking-tight">GazPoints</span>
          </Link>
          <div className="flex items-center gap-1">
            <DashboardQuickActions />
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Menu className="size-5" aria-hidden />
              <span className="sr-only">Menu</span>
            </button>
          </div>
        </header>

        <header className="hidden lg:sticky lg:top-0 lg:z-10 lg:flex lg:h-14 lg:items-center lg:justify-between lg:border-b lg:border-border lg:bg-card/80 lg:px-8 lg:backdrop-blur-md">
          <Link
            href={dashboardHomeHref}
            prefetch={linkPrefetch}
            className="flex items-center gap-2"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Image
                src="/brand/logo.png"
                alt="GazPoints"
                width={24}
                height={24}
                className="h-5 w-5 object-contain"
                style={{ width: "auto", height: "auto" }}
              />
            </span>
            <span className="font-heading text-lg font-bold tracking-tight text-primary">
              GazPoints
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(primaryAction.href)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={primaryAction.ariaLabel}
            >
              <PrimaryActionIcon className="size-4" />
              {primaryAction.label}
            </Button>
            {secondaryAction && SecondaryActionIcon && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(secondaryAction.href)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={secondaryAction.ariaLabel}
              >
                <SecondaryActionIcon className="size-4" />
                {secondaryAction.label}
              </Button>
            )}
            {headerActions}
          </div>
          <div className="flex items-center gap-4">
            <DashboardQuickActions />
            <button
              type="button"
              onClick={handleProfileClick}
              className="flex cursor-pointer items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
            >
              {status === "loading" ? (
                <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
              ) : (
                <>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {getUserAvatar() ? (
                      <Image
                        src={getUserAvatar()!}
                        alt="Avatar utilisateur"
                        width={24}
                        height={24}
                        className="size-6 rounded-full object-cover"
                      />
                    ) : (
                      <User className="size-5 text-primary" aria-hidden="true" />
                    )}
                  </span>
                  <span className="hidden font-medium sm:block">{user?.name}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push(notificationsHref)}
              className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 size-2.5 rounded-full bg-destructive text-white text-[10px] leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        <main ref={mainRef} className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        <DashboardFooter />
        <ScrollToTop scrollContainerRef={mainRef} />
      </div>
    </div>
  );
}