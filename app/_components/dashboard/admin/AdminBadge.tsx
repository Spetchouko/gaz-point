"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AdminBadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "destructive" | "info" | "neutral" | "primary";
  className?: string;
  icon?: React.ReactNode;
  dot?: boolean;
  dotColor?: string;
}

const variantClasses = {
  success: "admin-badge--success",
  warning: "admin-badge--warning",
  destructive: "admin-badge--destructive",
  info: "admin-badge--info",
  neutral: "admin-badge--neutral",
  primary: "bg-primary/10 text-primary border-primary/20",
};

export function AdminBadge({
  children,
  variant = "neutral",
  className,
  icon,
  dot,
  dotColor,
}: AdminBadgeProps) {
  return (
    <Badge className={cn("admin-badge", variantClasses[variant], className)}>
      {dot && <span className={cn("size-1.5 rounded-full", dotColor || "bg-current")} />}
      {icon && <span className="size-3">{icon}</span>}
      {children}
    </Badge>
  );
}