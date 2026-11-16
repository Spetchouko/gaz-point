import { type Availability } from "@/app/_components/donnees-demo"
import { cn } from "@/lib/utils"

export const statusDotClass: Record<Availability, string> = {
  disponible: "bg-success",
  à_confirmer: "bg-warning",
  indisponible: "bg-destructive",
}

export function StatusDot({
  status,
  className,
}: {
  status: Availability
  className?: string
}) {
  return (
    <span
      className={cn("size-2.5 shrink-0 rounded-full", statusDotClass[status], className)}
      aria-hidden
    />
  )
}