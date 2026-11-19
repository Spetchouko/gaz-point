"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  User,
  Calendar,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Store,
  Package,
  Truck,
  Shield,
  Lock,
  BarChart3,
  MapPin,
  Archive,
  X,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { useAuthModal } from "@/lib/auth-context";
import type { DashboardUser } from "@/lib/auth-session";
import { useDashboardSession } from "@/lib/auth-session";
import { authClient } from "@/lib/auth-client";
import { DashboardFooter } from "@/app/_components/dashboard/dashboard-footer";
import { ScrollToTop } from "@/app/_components/dashboard/scroll-to-top";
import { DashboardQuickActions } from "@/app/_components/dashboard/dashboard-quick-actions";
import { cn } from "@/lib/utils";
import { useNotificationUnreadCount } from "@/lib/use-notification-unread-count";
import { AdminSidebarProvider, useAdminSidebar } from "@/app/_components/dashboard/admin-sidebar-context";

// Logo du site pour l'en-tête de la sidebar admin
const SIDEBAR_LOGO = (
  <Image
    src="/brand/logo.png"
    alt="GazPoints"
    width={24}
    height={24}
    className="h-6 w-6 object-contain"
  />
);

// Navigation items organized by functional groups
const ADMIN_NAV_GROUPS = [
  {
    groupLabel: "TABLEAU DE BORD",
    items: [
      {
        key: "overview",
        href: "/dashboard/admin",
        label: "Vue d'ensemble",
        icon: LayoutDashboard,
        requiredPermission: null,
      },
      {
        key: "analytics",
        href: "/dashboard/admin/analytics",
        label: "Rapports & Statistiques",
        icon: BarChart3,
        requiredPermission: "statistiques",
      },
    ],
  },
  {
    groupLabel: "GESTION DES UTILISATEURS",
    items: [
      {
        key: "utilisateurs",
        href: "/dashboard/admin/utilisateurs",
        label: "Utilisateurs",
        icon: Users,
        requiredPermission: "utilisateurs",
      },
      {
        key: "vendeurs",
        href: "/dashboard/admin/vendeurs",
        label: "Vendeurs",
        icon: Store,
        requiredPermission: "vendeurs",
      },
      {
        key: "collaborateurs",
        href: "/dashboard/admin/collaborateurs",
        label: "Collaborateurs",
        icon: Shield,
        requiredPermission: "collaborateurs",
      },
    ],
  },
  {
    groupLabel: "GESTION DES OPÉRATIONS",
    items: [
      {
        key: "points-de-vente",
        href: "/dashboard/admin/points-de-vente",
        label: "Points de vente",
        icon: MapPin,
        requiredPermission: "vendeurs",
      },
      {
        key: "disponibilites",
        href: "/dashboard/admin/disponibilites",
        label: "Disponibilités",
        icon: Package,
        requiredPermission: "disponibilites",
      },
      {
        key: "reservations",
        href: "/dashboard/admin/reservations",
        label: "Réservations",
        icon: Calendar,
        requiredPermission: "reservations",
      },
    ],
  },
  {
    groupLabel: "CONTENU & MARKETING",
    items: [
      {
        key: "publicite",
        href: "/dashboard/admin/publicite",
        label: "Annonces & Publicités",
        icon: Truck,
        requiredPermission: "publicite",
      },
    ],
  },
  {
    groupLabel: "AVIS & RÉPUTATION",
    items: [
      {
        key: "avis",
        href: "/dashboard/admin/avis",
        label: "Avis",
        icon: MessageSquare,
        requiredPermission: "avis",
      },
    ],
  },
  {
    groupLabel: "ABONNEMENTS",
    items: [
      {
        key: "abonnements",
        href: "/dashboard/admin/abonnements",
        label: "Abonnements",
        icon: CreditCard,
        requiredPermission: "abonnements",
      },
    ],
  },
] as const;

interface DashboardAdminLayoutProps {
  children: React.ReactNode;
  permissions: Set<string>;
  session?: DashboardUser | null;
  status?: "loading" | "authenticated" | "unauthenticated";
}

export function DashboardAdminLayout({
  children,
  permissions,
  session: sessionProp,
  status: statusProp,
}: DashboardAdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { openAuthModal, closeAuthModal } = useAuthModal();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const user = sessionProp ?? undefined;
  const status = statusProp;
  const isAuthenticated = Boolean(user);
  const { unreadCount } = useNotificationUnreadCount(isAuthenticated);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const notificationsHref = "/dashboard/admin/notifications";

  useEffect(() => {
    setButtonDisabled(status === "loading");
  }, [status]);

  const isActive = (href: string) =>
    href === "/dashboard/admin" ? pathname === "/dashboard/admin" : pathname.startsWith(href);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  const handleAuthClick = (mode: "login" | "register") => {
    if (!isAuthenticated) {
      openAuthModal(mode);
    }
  };

  const getUserAvatar = () => user?.image ?? null;

  const getUserInitials = () => {
    return user?.name
      ?.split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "A";
  };

  const handleProfileClick = () => {
    router.push("/dashboard/admin/profil");
  };

  const handleNotificationsClick = () => {
    router.push(notificationsHref);
  };

  // Flatten nav items for active state checking
  const allNavItems = ADMIN_NAV_GROUPS.flatMap((group) => group.items);
  const allowedNavItems = allNavItems.filter(
    (item) => item.requiredPermission === null || permissions.has(item.requiredPermission)
  );

  return (
    <AdminSidebarProvider>
      <DashboardAdminLayoutInner
        children={children}
        permissions={permissions}
        session={sessionProp}
        status={statusProp}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        user={user}
        status={status}
        isAuthenticated={isAuthenticated}
        unreadCount={unreadCount}
        buttonDisabled={buttonDisabled}
        notificationsHref={notificationsHref}
        allowedNavItems={allowedNavItems}
        handleSignOut={handleSignOut}
        handleAuthClick={handleAuthClick}
        getUserAvatar={getUserAvatar}
        getUserInitials={getUserInitials}
        handleProfileClick={handleProfileClick}
        handleNotificationsClick={handleNotificationsClick}
      />
    </AdminSidebarProvider>
  );
}

function DashboardAdminLayoutInner({
  children,
  permissions,
  session,
  status,
  sidebarCollapsed,
  setSidebarCollapsed,
  user,
  status: statusProp,
  isAuthenticated,
  unreadCount,
  buttonDisabled,
  notificationsHref,
  allowedNavItems,
  handleSignOut,
  handleAuthClick,
  getUserAvatar,
  getUserInitials,
  handleProfileClick,
  handleNotificationsClick,
}: {
  children: React.ReactNode;
  permissions: Set<string>;
  session: DashboardUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  user: DashboardUser | undefined;
  status: "loading" | "authenticated" | "unauthenticated";
  isAuthenticated: boolean;
  unreadCount: number;
  buttonDisabled: boolean;
  notificationsHref: string;
  allowedNavItems: typeof ADMIN_NAV_GROUPS extends { flatMap: (fn: (g: any) => any) => infer T } ? T : any;
  handleSignOut: () => Promise<void>;
  handleAuthClick: (mode: "login" | "register") => void;
  getUserAvatar: () => string | null;
  getUserInitials: () => string;
  handleProfileClick: () => void;
  handleNotificationsClick: () => void;
}) {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useAdminSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { openAuthModal, closeAuthModal } = useAuthModal();

  const isActive = (href: string) =>
    href === "/dashboard/admin" ? pathname === "/dashboard/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Navigation administrateur */}
      <aside
        id="admin-sidebar"
        className={cn(
          // Mobile : tiroir à droite (glisse depuis la droite, pleine hauteur).
          // Desktop : sidebar fixée à gauche.
          "admin-sidebar fixed inset-y-0 right-0 z-40 flex h-full flex-col border-l border-border transition-all duration-200 ease-out",
          "lg:left-0 lg:right-auto lg:border-l-0 lg:border-r",
          sidebarCollapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
        aria-label="Navigation du dashboard administrateur"
      >
        {/* Header with site logo */}
        <div className={cn("admin-sidebar__header", sidebarCollapsed && "justify-center px-0")}>
          <Link
            href="/dashboard/admin"
            className="admin-sidebar__logo"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              {SIDEBAR_LOGO}
            </span>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg tracking-tight">GazPoints</span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? "Étendre le menu" : "Réduire le menu"}
            className="admin-sidebar__collapse-btn"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="size-4" aria-hidden />
            ) : (
              <ChevronLeft className="size-4" aria-hidden />
            )}
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="admin-sidebar__nav" aria-label="Navigation principale">
          {ADMIN_NAV_GROUPS.map((group) => {
            const allowedItems = group.items.filter(
              (item) => item.requiredPermission === null || permissions.has(item.requiredPermission)
            );
            if (allowedItems.length === 0) return null;

            return (
              <div key={group.groupLabel} className="admin-sidebar__group">
                {!sidebarCollapsed && (
                  <p className="admin-sidebar__group-label">{group.groupLabel}</p>
                )}
                <div className="space-y-0.5">
                  {allowedItems.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "admin-sidebar__link",
                          active && "data-[active]",
                          sidebarCollapsed && "justify-center px-2"
                        )}
                        data-active={active}
                      >
                        <Icon className={cn("admin-sidebar__link-icon", sidebarCollapsed && "mx-auto")} aria-hidden />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer: User Info + Actions */}
        <div className={cn("admin-sidebar__footer", sidebarCollapsed && "px-1")}>
          {/* Accès rapide : retour au site + thème */}
          <div className={cn("flex items-center gap-1", sidebarCollapsed ? "justify-center" : "justify-between")}>
            {!sidebarCollapsed && (
              <span className="text-xs font-medium text-muted-foreground">Accès rapide</span>
            )}
            <DashboardQuickActions popoverPlacement="top" />
          </div>

          {/* Profile Button */}
          <button
            type="button"
            onClick={handleProfileClick}
            className={cn("admin-sidebar__user-btn", sidebarCollapsed && "justify-center px-1")}
            aria-label="Mon profil"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
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
            </span>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.name || "Administrateur"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.role === "collaborateur" ? "Collaborateur" : "Administrateur"}
                </p>
              </div>
            )}
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={handleNotificationsClick}
            className={cn("admin-sidebar__notif-btn", sidebarCollapsed && "justify-center px-1")}
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Notifications"}
          >
            <span className="relative flex size-4 shrink-0 items-center justify-center">
              <Bell className={cn("size-4", sidebarCollapsed && "mx-auto")} aria-hidden />
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 min-w-4 h-4 rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white text-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
            {!sidebarCollapsed && <span>Notifications</span>}
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={handleSignOut}
            className={cn("admin-sidebar__logout-btn", sidebarCollapsed && "justify-center px-1")}
            aria-label="Se déconnecter"
            disabled={buttonDisabled}
          >
            <LogOut className={cn("size-4 shrink-0", sidebarCollapsed && "mx-auto")} aria-hidden />
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content area */}
      <div className={cn(
        "dashboard-surface admin-workarea flex flex-col",
        sidebarCollapsed ? "lg:pl-[calc(4rem+1px)]" : "lg:pl-[calc(16rem+1px)]"
      )}>
        {/* Main Content */}
        <main className="admin-workarea__main">
          <div className="admin-workarea__padding">
            {children}
          </div>
        </main>

        {/* Copyright au niveau du dashboard (plus dans la sidebar) */}
        <DashboardFooter />

        {/* Scroll to top button */}
        <ScrollToTop />
      </div>
    </div>
  );
}