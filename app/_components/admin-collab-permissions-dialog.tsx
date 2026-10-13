"use client"

import { useState, useTransition, type FormEvent } from "react"
import { CheckCircle2, Loader2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { setCollaboratorPermissions } from "@/app/admin/actions"
import {
  ADMIN_MODULES_UI,
  ADMIN_MODULE_LABELS,
  type AdminModuleUi,
} from "@/app/_components/admin-module-labels"

type Props = {
  open: boolean
  onClose: () => void
  collaboratorId: string
  collaboratorName: string
  initialModules: AdminModuleUi[]
}

export function AdminCollabPermissionsDialog({
  open,
  onClose,
  collaboratorId,
  collaboratorName,
  initialModules,
}: Props) {
  const [selected, setSelected] = useState<Set<AdminModuleUi>>(
    () => new Set(initialModules)
  )
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const toggle = (module: AdminModuleUi) => {
    setFeedback(null)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(module)) next.delete(module)
      else next.add(module)
      return next
    })
  }

  if (!open) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.set("userId", collaboratorId)
    formData.set("modules", [...selected].join(","))
    startTransition(async () => {
      try {
        const result = await setCollaboratorPermissions(null, formData)
        setFeedback({ ok: result.ok, message: result.message })
        if (result.ok) onClose()
      } catch {
        setFeedback({ ok: false, message: "Une erreur est survenue." })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-4" />
            Permissions de {collaboratorName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Attribuez les modules auxquels ce collaborateur a accès. Un
            collaborateur sans module est en{" "}
            <strong className="text-foreground">consultation seule</strong> et ne
            peut jamais hériter des privilèges d&apos;administrateur.
          </p>

          <div className="space-y-3">
            {ADMIN_MODULES_UI.map((module) => {
              const checked = selected.has(module)
              return (
                <label
                  key={module}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 data-checked:border-primary data-checked:bg-primary/5"
                  data-checked={checked || undefined}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(module)}
                    className="mt-0.5 size-4 accent-[hsl(var(--primary))]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {ADMIN_MODULE_LABELS[module]}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Lecture + modification de ce module
                    </span>
                  </span>
                </label>
              )
            })}
          </div>

          {feedback && !feedback.ok && (
            <p role="alert" className="text-sm text-destructive">
              {feedback.message}
            </p>
          )}

          <DialogFooter className="flex-row gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Enregistrer les permissions
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}