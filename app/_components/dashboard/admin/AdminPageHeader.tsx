"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LayoutDashboard, Menu } from "lucide-react";
import { useAdminSidebar } from "@/app/_components/dashboard/admin-sidebar-context";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  subtitle,
  icon,
  actions,
  className,
}: AdminPageHeaderProps) {
  const { sidebarOpen, toggleSidebar } = useAdminSidebar();
  return (
    <div className={cn("admin-page-header dashboard-card", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {icon && <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{icon}</div>}
          <div className="min-w-0">
            <h1 className="admin-page-title truncate">{title}</h1>
            {subtitle && <p className="admin-page-subtitle mt-1 truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Mobile menu button - top right on mobile only */}
          <Button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={sidebarOpen}
            className="lg:hidden flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Menu className="size-5" aria-hidden />
          </Button>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}