"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare, Pencil, Send, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
import {
  VendorEmptyState,
  VendorErrorState,
  VendorNotice,
  VendorPageHeader,
  VendorSectionCard,
  VendorStatusBadge,
} from "@/app/_components/vendor/vendor-ui"
import { formatDate } from "@/lib/gaz"
import {
  AVIS_RATING_MAX,
  AVIS_RATING_MIN,
  AVIS_STATUS_LABELS,
  type AvisMine,
} from "@/lib/avis-shared"
import { cn } from "@/lib/utils"

const RATINGS = Array.from(
  { length: AVIS_RATING_MAX - AVIS_RATING_MIN + 1 },
  (_, index) => AVIS_RATING_MIN + index
)

const STATUS_MESSAGES: Record<string, string> = {
  pending: "Votre avis est en attente de validation. Il sera publié après modération.",
  approved: "Votre avis est publié et visible sur la page d’accueil.",
  rejected: "Cet avis n’a pas été retenu. Vous pouvez le modifier puis le soumettre à nouveau.",
  hidden: "Cet avis n’est plus affiché publiquement.",
}

export function VendorReviewManager({
  initialReview,
}: {
  initialReview: AvisMine | null
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement | null>(null)
  const [review, setReview] = useState(initialReview)
  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState(initialReview?.rating ?? 0)
  const [quote, setQuote] = useState(initialReview?.quote ?? "")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editable =
    review?.status === "pending" || review?.status === "rejected"

  const startEdit = () => {
    setRating(review?.rating ?? 0)
    setQuote(review?.quote ?? "")
    setEditing(true)
    setError(null)
  }

  const cancelEdit = () => {
    setRating(review?.rating ?? 0)
    setQuote(review?.quote ?? "")
    setEditing(false)
    setError(null)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (rating < AVIS_RATING_MIN || rating > AVIS_RATING_MAX) {
      setError("Choisissez une note entre 1 et 5 étoiles.")
      return
    }
    if (quote.trim().length < 10) {
      setError("Votre commentaire doit contenir au moins 10 caractères.")
      return
    }

    void (async () => {
      setSaving(true)
      try {
        const isUpdate = editing && Boolean(review)
        const response = await fetch(
          isUpdate ? `/api/avis/${review!.id}` : "/api/avis",
          {
            method: isUpdate ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rating, quote: quote.trim() }),
          }
        )
        const payload = (await response.json().catch(() => null)) as {
          error?: string
          avis?: AvisMine
        } | null
        if (!response.ok) {
          if (payload?.avis) setReview(payload.avis)
          throw new Error(payload?.error ?? "Impossible d'enregistrer votre avis")
        }
        if (!payload?.avis) {
          throw new Error("Réponse inattendue du serveur")
        }
        setReview(payload.avis)
        setEditing(false)
        toast.success(
          isUpdate
            ? "Avis mis à jour et soumis à la modération"
            : "Merci, votre avis a été soumis"
        )
        router.refresh()
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Impossible d'enregistrer votre avis."
        )
      } finally {
        setSaving(false)
      }
    })()
  }

  const handleDelete = () => {
    if (!review) return
    void (async () => {
      setDeleting(true)
      setError(null)
      try {
        const response = await fetch(`/api/avis/${review.id}`, {
          method: "DELETE",
        })
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        if (!response.ok) {
          throw new Error(payload?.error ?? "Impossible de supprimer votre avis")
        }
        setReview(null)
        setRating(0)
        setQuote("")
        setEditing(false)
        setDeleteOpen(false)
        toast.success("Votre avis a été supprimé")
        router.refresh()
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Impossible de supprimer votre avis."
        )
        setDeleteOpen(false)
      } finally {
        setDeleting(false)
      }
    })()
  }

  const showForm = !review || editing

  return (
    <div className="space-y-4">
      <VendorPageHeader
        title="Donner mon avis"
        description="Partagez votre expérience avec GazPoints en tant que vendeur."
      />

      {error && (
        <VendorErrorState
          message={error}
          onRetry={() =>
            review && editing ? formRef.current?.requestSubmit() : undefined
          }
        />
      )}

      {review && !editing && (
        <VendorSectionCard
          title="Mon avis"
          description={`Soumis le ${formatDate(review.createdAt)}`}
          actions={
            <VendorStatusBadge
              status={review.status}
              label={AVIS_STATUS_LABELS[review.status]}
            />
          }
        >
          <div className="space-y-3">
            <div className="flex items-center gap-1" aria-label={`Note : ${review.rating ?? 0} sur 5`}>
              {RATINGS.map((value) => (
                <Star
                  key={value}
                  className={cn(
                    "size-4",
                    review.rating && value <= review.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/40"
                  )}
                  aria-hidden
                />
              ))}
              <span className="ml-1 text-xs text-muted-foreground">
                {review.rating ?? 0}/5
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {review.quote}
            </p>
            <VendorNotice tone={review.status === "approved" ? "success" : "info"}>
              {STATUS_MESSAGES[review.status] ?? "Statut de votre avis."}
            </VendorNotice>
            {editable && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <Button size="sm" variant="outline" onClick={startEdit}>
                  <Pencil className="size-3.5" aria-hidden />
                  Modifier mon avis
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Supprimer
                </Button>
              </div>
            )}
          </div>
        </VendorSectionCard>
      )}

      {showForm && (
        <VendorSectionCard
          title={editing ? "Modifier mon avis" : "Rédiger mon avis"}
          description="Un seul avis par compte. Il est soumis à modération avant publication."
        >
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Votre note</Label>
              <div className="flex items-center gap-1" role="group" aria-label="Note de 1 à 5 étoiles">
                {RATINGS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                    aria-pressed={rating === value}
                    className="rounded-md p-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Star
                      className={cn(
                        "size-6 transition-colors",
                        value <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/40"
                      )}
                      aria-hidden
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-xs font-medium text-foreground">
                    {rating}/5
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vendor-review-quote">Votre commentaire</Label>
              <Textarea
                id="vendor-review-quote"
                value={quote}
                onChange={(event) => setQuote(event.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Décrivez votre expérience avec GazPoints…"
                disabled={saving}
                required
              />
              <p className="text-xs text-muted-foreground">
                {quote.trim().length}/1000 caractères · minimum 10 caractères.
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
              {editing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Annuler
                </Button>
              )}
              <Button type="submit" size="sm" disabled={saving}>
                <Send className="size-3.5" aria-hidden />
                {saving
                  ? "Envoi…"
                  : editing
                    ? "Enregistrer la modification"
                    : "Soumettre mon avis"}
              </Button>
            </div>
          </form>
        </VendorSectionCard>
      )}

      {!review && !showForm && (
        <VendorSectionCard title="Mon avis">
          <VendorEmptyState
            icon={MessageSquare}
            title="Aucun avis soumis"
            description="Partagez votre expérience avec la communauté GazPoints."
          />
        </VendorSectionCard>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer votre avis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. Vous pourrez soumettre un nouvel avis
              après cette suppression.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Suppression…" : "Supprimer"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
