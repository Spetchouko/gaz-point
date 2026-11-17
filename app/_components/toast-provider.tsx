"use client"

import { Toaster } from "sonner"

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      theme="system"
      toastOptions={{
        classNames: {
          toast: "group rounded-xl border border-border bg-card p-4 shadow-lg text-sm text-foreground",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground hover:bg-primary/90",
          cancelButton: "bg-muted text-muted-foreground hover:bg-muted/80",
        },
      }}
    />
  )
}