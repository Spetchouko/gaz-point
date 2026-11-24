"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

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
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}