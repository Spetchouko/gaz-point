"use client"

import { useActionState, useState } from "react"
import {
  CheckCircle2,
  MapPin,
  PencilLine,
  Phone,
  Plus,
  ShieldCheck,
  Store,
  UserCheck,
} from "lucide-react"
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
import type { AvailabilityStatus, disponibilite } from "@/db/schema"
import {
  assignVendor,
  createPointDeVente,
  reportDisponibilite,
  type ActionResult,
} from "@/app/dashboard/pro/actions"
import { DashboardNav } from "@/app/_components/dashboard-nav"
import {
  availabilityBadgeClass,
  availabilityLabel,
  effectiveStatus,
  formatDateTime,
  isStale,
  sourceLabel,
} from "@/lib/gaz"

type ReportRow = typeof disponibilite.$inferSelect

type PointRow = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  vendorId: string | null
  vendorName: string | null
  report: ReportRow | null
}

type VendorOption = {
  id: string
  name: string
  email: string
}

const STATUSES: AvailabilityStatus[] = [
  "disponible",
  "a_confirmer",
  "indisponible",
]

export function EspacePro({
  role,
  reporterName,
  points,
  vendors,
}: {
  role: "vendor" | "admin" | "collaborateur"
  reporterName: string
  points: PointRow[]
  vendors: VendorOption[]
}) {
  const isAdmin = role === "admin"

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <DashboardNav pro isVendor={true} />

        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Espace professionnel
            </h1>
            <p className="mt-2 text-muted-foreground">
              Renseigne la disponibilité du gaz de tes dépôts : chaque
              signalement est daté et signé de ton nom, conformément aux
              règles de la plateforme.
            </p>
          </div>
          <Badge variant={isAdmin ? "default" : "secondary"}>
            {isAdmin ? "Administrateur" : "Vendeur"}
          </Badge>
        </header>

        {points.length === 0 && !isAdmin && (
          <Card className="mb-6">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Store className="size-6 text-primary" aria-hidden />
              </span>
              <p className="font-medium">Aucun dépôt rattaché à ton compte</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Contacte l'administration (petchouko@gmail.com) pour faire
                rattacher ton dépôt, puis tu pourras y signaler la disponibilité
                du gaz.
              </p>
            </CardContent>
          </Card>
        )}

        {points.length > 0 && (
          <div className="space-y-6">
            {points.map((point) => (
              <CartePoint
                key={point.id}
                point={point}
                role={role}
                reporterName={reporterName}
                vendors={vendors}
              />
            ))}
          </div>
        )}

        {isAdmin && <CreationPoint vendors={vendors} />}
      </div>
    </div>
  )
}

function CartePoint({
  point,
  role,
  reporterName,
  vendors,
}: {
  point: PointRow
  role: "vendor" | "admin" | "collaborateur"
  reporterName: string
  vendors: VendorOption[]
}) {
  const status = point.report
    ? effectiveStatus(point.report.status, point.report.createdAt)
    : null
  const stale = point.report ? isStale(point.report.createdAt) : false

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="size-4 text-primary" aria-hidden />
              {point.name}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {point.address} — {point.district}
            </CardDescription>
          </div>
          {status && (
            <Badge variant="outline" className={availabilityBadgeClass[status]}>
              {availabilityLabel[status]}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="space-y-1.5 text-sm text-muted-foreground">
          {point.vendorName && (
            <p className="flex items-center gap-1.5">
              <UserCheck className="size-3.5 shrink-0" aria-hidden />
              Vendeur rattaché : {point.vendorName}
            </p>
          )}
          {point.phone && (
            <p className="flex items-center gap-1.5">
              <Phone className="size-3.5 shrink-0" aria-hidden />
              {point.phone}
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Disponibilité actuelle</p>
            {status && (
              <Badge variant="outline" className={availabilityBadgeClass[status]}>
                {availabilityLabel[status]}
              </Badge>
            )}
          </div>

          {point.report ? (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-muted-foreground">
                Dernière mise à jour : le{" "}
                {formatDateTime(point.report.createdAt)} par{" "}
                {point.report.reportedByName} (
                {sourceLabel[point.report.source as keyof typeof sourceLabel]})
                .
              </p>
              {point.report.note && (
                <p className="text-sm text-muted-foreground">
                  Précision : {point.report.note}
                </p>
              )}
              {stale && (
                <p className="text-xs text-amber-600">
                  Non actualisé depuis plus de 24 h : la plateforme affiche ce
                  statut « à confirmer ».
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Aucun signalement de disponibilité pour ce dépôt.
            </p>
          )}
        </div>

        <FormulaireSignalement
          point={point}
          role={role}
          reporterName={reporterName}
        />

        {role === "admin" && (
          <FormulaireRattachement point={point} vendors={vendors} />
        )}
      </CardContent>
    </Card>
  )
}

function FormulaireSignalement({
  point,
  role,
  reporterName,
}: {
  point: PointRow
  role: "vendor" | "admin" | "collaborateur"
  reporterName: string
}) {
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<ActionResult | null>(null)
  const [status, setStatus] = useState<AvailabilityStatus>(
    (point.report?.status as AvailabilityStatus) ?? "disponible"
  )
  const [note, setNote] = useState("")
  const [quantity, setQuantity] = useState("")
  const [price, setPrice] = useState("")
  const [format, setFormat] = useState("")
  const [phone, setPhone] = useState("")
  const [step, setStep] = useState<"form" | "confirm">("form")

  const handleConfirm = async (formData: FormData) => {
    setPending(true)
    const result = await reportDisponibilite(null, formData)
    setFeedback(result)
    if (result.ok) {
      setStep("form")
      setNote("")
      setQuantity("")
      setPrice("")
      setFormat("")
      setPhone("")
    }
    setPending(false)
  }

  const source = role === "admin" ? "administration" : "vendeur"

  if (step === "confirm") {
    return (
      <div className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="size-4 text-primary" aria-hidden />
          Confirme le signalement avant publication
        </p>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>
            Dépôt :{" "}
            <span className="font-medium text-foreground">{point.name}</span>
          </li>
          <li className="flex items-center gap-2">
            Statut :{" "}
            <Badge
              variant="outline"
              className={availabilityBadgeClass[status]}
            >
              {availabilityLabel[status]}
            </Badge>
          </li>
          <li>
            Publié comme :{" "}
            <span className="font-medium text-foreground">
              {reporterName} ({sourceLabel[source]})
            </span>
          </li>
          {note && (
            <li>
              Précision : <span className="text-foreground">{note}</span>
            </li>
          )}
          <li>
            La date et l'heure de publication seront enregistrées
            automatiquement.
          </li>
        </ul>

        <div className="flex flex-wrap items-center gap-2">
          <form action={handleConfirm}>
            <input type="hidden" name="pointId" value={point.id} />
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="note" value={note} />
            <input type="hidden" name="quantity" value={quantity} />
            <input type="hidden" name="price" value={price} />
            <input type="hidden" name="format" value={format} />
            <input type="hidden" name="phone" value={phone} />
            <Button type="submit" size="sm" disabled={pending} className="gap-2">
              <CheckCircle2 className="size-4" aria-hidden />
              {pending ? "Publication…" : "Confirmer le signalement"}
            </Button>
          </form>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setStep("form")}
            disabled={pending}
          >
            Modifier
          </Button>
          {feedback && !feedback.ok && (
            <p role="alert" className="text-sm text-destructive">
              {feedback.message}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <PencilLine className="size-4 text-primary" aria-hidden />
        Signaler la disponibilité du gaz
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`status-${point.id}`}>Nouveau statut</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as AvailabilityStatus)}
          >
            <SelectTrigger
              id={`status-${point.id}`}
              className="w-full"
              aria-label="Nouveau statut de disponibilité"
            >
              <SelectValue>
                {(value) =>
                  value ? availabilityLabel[value as AvailabilityStatus] : "Choisis un statut"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {availabilityLabel[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`note-${point.id}`}>Précision (facultatif)</Label>
          <Input
            id={`note-${point.id}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ex : 12,5 kg uniquement"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`quantity-${point.id}`}>Quantité (facultatif)</Label>
          <Input
            id={`quantity-${point.id}`}
            name="quantity"
            type="number"
            min="0"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="Ex : 50"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`price-${point.id}`}>Prix unitaire en FCFA (facultatif)</Label>
          <Input
            id={`price-${point.id}`}
            name="price"
            type="number"
            min="0"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="Ex : 3500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`phone-${point.id}`}>Téléphone (facultatif)</Label>
          <Input
            id={`phone-${point.id}`}
            name="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Ex : +237 6 99 00 00 00"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`format-${point.id}`}>Format (facultatif)</Label>
          <Select value={format} onValueChange={(value) => setFormat(value ?? "")}>
            <SelectTrigger
              id={`format-${point.id}`}
              className="w-full"
              aria-label="Format de bouteille"
            >
              <SelectValue placeholder="Ex : 12,5 kg" />
            </SelectTrigger>
            <SelectContent>
              {["6 kg", "12,5 kg", "15 kg"].map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="format" value={format} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          className="gap-2"
          onClick={() => setStep("confirm")}
        >
          <ShieldCheck className="size-4" aria-hidden />
          Vérifier le signalement
        </Button>
        {feedback?.ok && (
          <p role="status" className="text-sm text-emerald-600">
            {feedback.message}
          </p>
        )}
        {feedback && !feedback.ok && (
          <p role="alert" className="text-sm text-destructive">
            {feedback.message}
          </p>
        )}
      </div>
    </div>
  )
}

function FormulaireRattachement({
  point,
  vendors,
}: {
  point: PointRow
  vendors: VendorOption[]
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    assignVendor,
    null
  )
  const [vendorId, setVendorId] = useState(point.vendorId ?? "__none__")

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
    >
      <input type="hidden" name="pointId" value={point.id} />
      <input type="hidden" name="vendorId" value={vendorId} />

      <div className="min-w-52 grow space-y-1.5">
        <Label htmlFor={`vendor-${point.id}`}>Vendeur rattaché</Label>
        <Select
          value={vendorId}
          onValueChange={(value) => setVendorId(value ?? "__none__")}
        >
          <SelectTrigger id={`vendor-${point.id}`} className="w-full">
            <SelectValue>
              {(value) =>
                value && value !== "__none__"
                  ? (vendors.find((vendor) => vendor.id === value)?.name ??
                    "Vendeur")
                  : "Aucun vendeur"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Aucun vendeur</SelectItem>
            {vendors.map((vendor) => (
              <SelectItem key={vendor.id} value={vendor.id}>
                {vendor.name} — {vendor.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>

      {state && (
        <p
          role={state.ok ? "status" : "alert"}
          className={
            state.ok ? "w-full text-sm text-emerald-600" : "w-full text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      )}
    </form>
  )
}

function CreationPoint({ vendors }: { vendors: VendorOption[] }) {
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<ActionResult | null>(null)
  const [vendorId, setVendorId] = useState("__none__")
  const [formKey, setFormKey] = useState(0)

  const handleCreate = async (formData: FormData) => {
    setPending(true)
    const result = await createPointDeVente(null, formData)
    setFeedback(result)
    if (result.ok) {
      setFormKey((key) => key + 1)
      setVendorId("__none__")
    }
    setPending(false)
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="size-5 text-primary" aria-hidden />
          Créer un point de vente
        </CardTitle>
        <CardDescription>
          Administration uniquement : crée le dépôt, puis rattache-le à son
          vendeur.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          key={formKey}
          action={handleCreate}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="point-name">Nom du dépôt</Label>
            <Input
              id="point-name"
              name="name"
              placeholder="Ex : Total Bonamoussadi"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="point-district">Quartier</Label>
            <Input
              id="point-district"
              name="district"
              placeholder="Ex : Bonamoussadi"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="point-address">Adresse</Label>
            <Input
              id="point-address"
              name="address"
              placeholder="Ex : Rond-point Bonamoussadi"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="point-phone">Téléphone (facultatif)</Label>
            <Input
              id="point-phone"
              name="phone"
              placeholder="Ex : +237 6 99 00 00 00"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="point-vendor">Vendeur (facultatif)</Label>
            <Select
              value={vendorId}
              onValueChange={(value) => setVendorId(value ?? "__none__")}
            >
              <SelectTrigger id="point-vendor" className="w-full">
                <SelectValue>
                  {(value) =>
                    value && value !== "__none__"
                      ? (vendors.find((vendor) => vendor.id === value)?.name ??
                        "Vendeur")
                      : "Aucun vendeur pour l'instant"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Aucun vendeur</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name} — {vendor.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="vendorId" value={vendorId} />
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={pending} className="gap-2">
              <Plus className="size-4" aria-hidden />
              {pending ? "Création…" : "Créer le point de vente"}
            </Button>
            {feedback && (
              <p
                role={feedback.ok ? "status" : "alert"}
                className={
                  feedback.ok
                    ? "text-sm text-emerald-600"
                    : "text-sm text-destructive"
                }
              >
                {feedback.message}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
