"use client";

import { cn } from "@/lib/utils";
import { BarChart3, Users, Store, Package, Calendar, MapPin, Shield, Truck } from "lucide-react";

// Skeleton card component
function SkeletonCard({ icon }: { icon: React.ComponentType }) {
  return (
    <div className="p-4 flex flex-col items-center rounded-xl bg-muted/30 animate-pulse/20">
      <div className="w-full h-6 bg-border rounded-md mb-3 animate-pulse" />
      <Icon className="size-4 mt-1 text-muted-foreground" aria-hidden />
    </div>
  );
}

// Skeleton KPI cards - 4 cards per row on desktop
const SkeletonKpiCards = () => {
  const icons = [
    { name: "users", Component: Users },
    { name: "vendors", Component: Store },
    { name: "collaborators", Component: Shield },
    { name: "points", Component: Package },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {icons.map(({ name, Component }) => (
        <SkeletonCard key={name} icon={Component} />
      ))}
    </div>
  );
};

// Main component - works as both default and named export
const SkeletonGridComponent = () => {
  return <SkeletonKpiCards />;
};

// Export as default for import SkeletonGrid from ...
export default SkeletonGridComponent;

// Also export as named for import { SkeletonGrid } from ...
export { SkeletonGridComponent as SkeletonGrid };