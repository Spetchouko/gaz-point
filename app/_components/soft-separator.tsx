import { Database, MessageCircle } from "lucide-react"

export function SoftSeparator() {
  return (
    <div className="flex items-center justify-center gap-3 py-6 sm:py-10">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="flex items-center gap-2 rounded-full bg-muted/60 px-4 py-2 shadow-sm ring-1 ring-border backdrop-blur-sm">
        <Database className="size-4 text-primary/70" aria-hidden />
        <span className="text-xs font-medium text-muted-foreground tracking-wide">Drizzle</span>
        <span className="text-muted-foreground/30">·</span>
        <MessageCircle className="size-4 text-primary/70" aria-hidden />
        <span className="text-xs font-medium text-muted-foreground tracking-wide">Chat</span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </div>
  )
}
