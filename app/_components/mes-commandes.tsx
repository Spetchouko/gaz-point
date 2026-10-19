"use client"

import { useActionState, useState } from "react"
import { CalendarDays, Package, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { pointDeVente, recharge } from "@/db/schema"
import {
  addRecharge,
  deleteRecharge,
  type ActionResult,
} from "@/app/mes-commandes/actions"
import { DashboardNav } from "@/app/_components/dashboard-nav"
import {
  bottleFormats,
  formatDate,
  formatPrice,
} from "@/lib/gaz"

type RechargeRow = typeof recharge.$inferSelect
type PointRow = typeof pointDeVente.$inferSelect

export function MesCommandes({
  recharges,
  points,
  pro = false,
}: {
  recharges: RechargeRow[]
  points: PointRow[]
  pro?: boolean
}) {
  const total = recharges.reduce((sum, row) => sum + row.price, 0)

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <DashboardNav pro={pro} />

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Mes commandes</h1>
          <p className="mt-2 text-muted-foreground">
            L&apos;historique de tes recharges de gaz, dépôt par dépôt.
          </p>
        </header>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Recharges enregistrées</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {recharges.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total dépensé</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {formatPrice(total)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <FormulaireRecharge points={points} />

          {recharges.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <Package className="size-6 text-primary" aria-hidden />
                </span>
                <p className="font-medium">Aucune recharge pour l&apos;instant</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Ajoute ta première recharge ci-dessus pour garder l&apos;historique
                  de tes achats de gaz.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-3">
              {recharges.map((row) => (
                <LigneRecharge key={row.id} row={row} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function FormulaireRecharge({ points }: { points: PointRow[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addRecharge,
    null
  )
  const [format, setFormat] = useState("")
  const today = new Date().toISOString().slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="size-5 text-primary" aria-hidden />
          Ajouter une recharge
        </CardTitle>
        <CardDescription>
          Dépôt, format, prix et date : ton historique se met à jour
          immédiatement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pointName">Dépôt</Label>
            <Input
              id="pointName"
              name="pointName"
              list="points-de-vente"
              placeholder="Ex : Tradex Bonamoussadi"
              required
            />
            <datalist id="points-de-vente">
              {points.map((point) => (
                <option key={point.id} value={point.name}>
                  {point.district}
                </option>
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">
              Choisis un dépôt existant ou saisis un autre nom.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Format de bouteille</Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value ?? "")}
            >
              <SelectTrigger className="w-full" aria-label="Format de bouteille">
                <SelectValue>
                  {(value) => (value ? String(value) : "Choisis un format")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {bottleFormats.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="format" value={format} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price">Prix payé (FCFA)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min={0}
              step={1}
              placeholder="Ex : 4500"
              required
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="date">Date de la recharge</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={today}
              max={today}
              required
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={pending} className="gap-2">
              <Plus className="size-4" aria-hidden />
              {pending ? "Ajout en cours…" : "Ajouter à mon historique"}
            </Button>
            {state && (
              <p
                role={state.ok ? "status" : "alert"}
                className={state.ok ? "text-sm text-emerald-600" : "text-sm text-destructive"}
              >
                {state.message}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

type ActionState = ActionResult | null

function LigneRecharge({ row }: { row: RechargeRow }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    deleteRecharge,
    null
  )
  const [confirming, setConfirming] = useState(false)

  return (
    <li className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <CalendarDays className="size-5 text-primary" aria-hidden />
          </span>
          <div>
            <p className="font-medium">{row.pointName}</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(row.purchasedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary">{row.format}</Badge>
          <span className="font-semibold tabular-nums">
            {formatPrice(row.price)}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        {confirming ? (
          <>
            <span className="mr-auto text-xs text-muted-foreground">
              Supprimer cette recharge ?
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              Annuler
            </Button>
            <form action={formAction}>
              <input type="hidden" name="id" value={row.id} />
              <Button
                size="sm"
                variant="destructive"
                type="submit"
                disabled={pending}
                className="gap-1.5"
              >
                <Trash2 className="size-3.5" aria-hidden />
                {pending ? "Suppression…" : "Confirmer"}
              </Button>
            </form>
          </>
        ) : (
          <>
            {state && !state.ok && (
              <p role="alert" className="mr-auto text-xs text-destructive">
                {state.message}
              </p>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirming(true)}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Supprimer
            </Button>
          </>
        )}
      </div>
    </li>
  )
}
