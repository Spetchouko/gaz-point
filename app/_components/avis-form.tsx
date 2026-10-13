"use client"

import { useActionState } from "react"
import { CheckCircle2, Loader2, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitAvis, type AvisActionResult } from "@/app/avis/actions"
import { AVIS_STATUS_LABELS, type AvisStatus } from "@/lib/avis-shared"

const QUOTE_MAX = 600

export function AvisForm({
  defaultQuote,
  defaultCity,
  currentStatus,
}: {
  defaultQuote: string
  defaultCity: string
  currentStatus: AvisStatus | null
}) {
  const [state, formAction, pending] = useActionState<AvisActionResult | null, FormData>(
    submitAvis,
    null
  )

  return (
    <div className="space-y-6">
      {currentStatus && (
        <p className="rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          État actuel de ton avis :{" "}
          <span className="font-medium text-foreground">
            {AVIS_STATUS_LABELS[currentStatus]}
          </span>
          {currentStatus === "approved" &&
            " — il est visible sur la page d'accueil."}
          {currentStatus === "pending" &&
            " — il attend la validation de l'équipe."}
          {currentStatus === "rejected" &&
            " — tu peux le corriger et le renvoyer."}
          {currentStatus === "hidden" &&
            " — il n'est plus affiché, tu peux le modifier et le renvoyer."}
        </p>
      )}

      <form action={formAction} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="quote">Ton avis</Label>
          <Textarea
            id="quote"
            name="quote"
            defaultValue={defaultQuote}
            required
            minLength={10}
            maxLength={QUOTE_MAX}
            rows={5}
            placeholder="Raconte comment GazPoints t'aide à trouver du gaz près de chez toi…"
            className="resize-y"
          />
          <p className="text-xs text-muted-foreground">
            {QUOTE_MAX} caractères maximum. Ton nom et ton profil seront affichés.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ville / quartier (facultatif)</Label>
          <Input
            id="city"
            name="city"
            defaultValue={defaultCity}
            maxLength={80}
            placeholder="Ex. Douala, Bonamoussadi"
          />
        </div>

        {state && (
          <p
            role="status"
            className={
              state.ok
                ? "flex items-center gap-2 text-sm text-emerald-600"
                : "text-sm text-destructive"
            }
          >
            {state.ok && <CheckCircle2 className="size-4" />}
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending} className="gap-2">
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MessageSquarePlus className="size-4" />
          )}
          {currentStatus ? "Mettre à jour mon avis" : "Publier mon avis"}
        </Button>
      </form>
    </div>
  )
}
