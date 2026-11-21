"use client"

import { useEffect, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Pencil,
  Send,
  Star,
  Trash2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/app/_components/spinner"
import {
  AVIS_RATING_MAX,
  AVIS_RATING_MIN,
  AVIS_STATUS_LABELS,
  avisTypeLabel,
  type AvisMine,
  type AvisStatus,
  type AvisType,
} from "@/lib/avis-shared"
import { cn } from "@/lib/utils"

const RATINGS = Array.from(
  { length: AVIS_RATING_MAX - AVIS_RATING_MIN + 1 },
  (_, index) => AVIS_RATING_MIN + index
)

function statusIcon(status: AvisStatus) {
  if (status === "approved") return CheckCircle2
  if (status === "rejected") return XCircle
  return Clock3
}

function statusClass(status: AvisStatus) {
  if (status === "approved") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
  if (status === "rejected") return "border-destructive/30 bg-destructive/10 text-destructive"
  return "border-amber-500/30 bg-amber-500/10 text-amber-600"
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export function MonAvis({ role }: { role: AvisType }) {
  const [avis, setAvis] = useState<AvisMine | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState("")
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch("/api/avis", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!response.ok) throw new Error("Impossible de charger votre avis")
        const data = await response.json()
        if (cancelled) return
        const mine = data.avis as AvisMine | null
        setAvis(mine)
        if (mine) {
          setRating(mine.rating ?? 0)
          setComment(mine.quote)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger votre avis")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const startEdit = () => {
    setRating(avis?.rating ?? 0)
    setComment(avis?.quote ?? "")
    setEditing(true)
    setSuccess(null)
    setError(null)
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (rating < AVIS_RATING_MIN || rating > AVIS_RATING_MAX) {
      setError(`Choisissez une note entre ${AVIS_RATING_MIN} et ${AVIS_RATING_MAX} étoiles.`)
      return
    }
    if (comment.trim().length < 10) {
      setError("Votre commentaire doit contenir au moins 10 caractères.")
      return
    }

    setSubmitting(true)
    try {
      const isUpdate = editing && Boolean(avis)
      const response = await fetch(isUpdate ? `/api/avis/${avis!.id}` : "/api/avis", {
        method: isUpdate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, quote: comment.trim() }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (data.avis) setAvis(data.avis as AvisMine)
        throw new Error(data.error || "Impossible d'enregistrer votre avis")
      }
      setAvis(data.avis as AvisMine)
      setEditing(false)
      setSuccess(
        isUpdate
          ? "Votre avis a été mis à jour et remis en attente de validation."
          : "Merci ! Votre avis a bien été soumis et est en attente de validation."
      )
      toast.success("Avis soumis avec succès")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'enregistrer votre avis"
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async () => {
    if (!avis) return
    setDeleting(true)
    setError(null)
    try {
      const response = await fetch(`/api/avis/${avis.id}`, { method: "DELETE" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Impossible de supprimer votre avis")
      setAvis(null)
      setRating(0)
      setComment("")
      setEditing(false)
      setDeleteOpen(false)
      setSuccess("Votre avis a été supprimé.")
      toast.success("Avis supprimé")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer votre avis"
      setError(message)
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  const canEdit = avis && (avis.status === "pending" || avis.status === "rejected")

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <CardTitle className="font-heading text-xl">Donner mon avis</CardTitle>
              <CardDescription>
                Partagez votre expérience avec GazPoints en tant que {avisTypeLabel(role).toLowerCase()}.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <p>{success}</p>
            </div>
          )}

          {avis && !editing && (
            <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge variant="outline" className={cn("gap-1.5", statusClass(avis.status))}>
                  {(() => {
                    const Icon = statusIcon(avis.status)
                    return <Icon className="size-3.5" />
                  })()}
                  {AVIS_STATUS_LABELS[avis.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Soumis le {formatDate(avis.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-1" aria-label={`Note : ${avis.rating ?? 0} sur 5`}>
                {RATINGS.map((value) => (
                  <Star
                    key={value}
                    className={cn(
                      "size-5",
                      avis.rating && value <= avis.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/40"
                    )}
                  />
                ))}
                {avis.rating ? (
                  <span className="ml-2 text-sm font-medium text-foreground">{avis.rating}/5</span>
                ) : null}
              </div>

              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{avis.quote}</p>

              {avis.status === "pending" && (
                <p className="text-xs text-muted-foreground">
                  Votre avis est en attente de validation. Il sera publié une fois validé par l’administration.
                </p>
              )}
              {avis.status === "approved" && (
                <p className="text-xs text-emerald-600">
                  Votre avis est publié et visible sur la page d’accueil.
                </p>
              )}
              {avis.status === "rejected" && (
                <p className="text-xs text-muted-foreground">
                  Cet avis n’a pas été retenu. Vous pouvez le modifier puis le soumettre à nouveau.
                </p>
              )}
              {avis.status === "hidden" && (
                <p className="text-xs text-muted-foreground">
                  Cet avis n’est plus affiché publiquement.
                </p>
              )}

              {canEdit && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={startEdit}>
                    <Pencil className="mr-2 size-4" /> Modifier mon avis
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="mr-2 size-4" /> Supprimer
                  </Button>
                </div>
              )}
            </div>
          )}

          {(!avis || editing) && (
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label>Votre note</Label>
                <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
                  {RATINGS.map((value) => {
                    const active = value <= (hovered || rating)
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                        aria-pressed={rating === value}
                        onClick={() => setRating(value)}
                        onMouseEnter={() => setHovered(value)}
                        className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        <Star
                          className={cn(
                            "size-7 transition-colors",
                            active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                          )}
                        />
                      </button>
                    )
                  })}
                  {rating > 0 && (
                    <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avis-commentaire">Votre commentaire</Label>
                <Textarea
                  id="avis-commentaire"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Racontez votre expérience avec GazPoints…"
                  minLength={10}
                  maxLength={1000}
                  rows={6}
                  className="resize-y"
                />
                <p className="text-right text-xs text-muted-foreground">
                  {comment.length}/1000 caractères
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <Spinner className="mr-2 size-4" />
                  ) : (
                    <Send className="mr-2 size-4" />
                  )}
                  {editing ? "Enregistrer les modifications" : "Soumettre mon avis"}
                </Button>
                {editing && (
                  <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                    Annuler
                  </Button>
                )}
              </div>
            </form>
          )}

          <p className="border-t border-border pt-4 text-xs text-muted-foreground">
            Votre avis est soumis à validation administrative avant toute publication. Vous restez
            propriétaire de votre avis et pouvez le modifier ou le supprimer tant qu’il n’est pas publié.
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer votre avis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. Votre avis sera retiré de la file de modération.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <Button variant="destructive" onClick={remove} disabled={deleting}>
              {deleting ? <Spinner className="mr-2 size-4" /> : <Trash2 className="mr-2 size-4" />}
              Supprimer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
