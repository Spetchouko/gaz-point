import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export function ModernCard({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Card> & { children: ReactNode }) {
  return (
    <Card
      className={cn(
        "shadow-sm border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-background",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
}
